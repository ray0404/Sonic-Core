
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import decode from 'audio-decode';
import { spawn, ChildProcess } from 'child_process';
import { 
  SonicEngine, 
  PlaybackState, 
  MeteringData
} from '../../packages/sonic-core/src/engine-interface.js';
import { RackModule, RackModuleType } from '../../packages/sonic-core/src/types.js';
import { ProfileAnalyzer } from '../../packages/sonic-core/src/core/profile-analyzer.js';
import { SonicForgeSDK } from '../../packages/sonic-core/src/sdk.js';
import { getModuleDescriptors } from '../../packages/sonic-core/src/module-descriptors.js';
import { encodeWAV } from '../../src/utils/wav-export.js';
import * as OfflineDSP from '../../packages/sonic-core/src/core/offline-processors.js';
import { linearToDb, dbToLinear } from '../../packages/sonic-core/src/utils/audio-math.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class NativeEngine implements SonicEngine {
  private sdk: SonicForgeSDK | null = null;
  private rack: RackModule[] = [];
  private sourceBuffer: Float32Array | null = null;
  private processedBuffer: Float32Array | null = null;
  private numChannels: number = 1;
  private sampleRate: number = 44100;
  private duration: number = 0;
  private isPlaying: boolean = false;
  private currentTime: number = 0;
  private playbackProcess: ChildProcess | null = null;
  private meteringData: MeteringData = { 
    levels: [0, 0], 
    peakLevels: [0, 0],
    fftData: new Float32Array(128).fill(0)
  };
  private abMode: 'A' | 'B' = 'B';
  private playbackInterval: NodeJS.Timeout | null = null;
  private grEnvelopes: Map<string, Float32Array> = new Map();
  private cacheStack: { id: string, buffer: Float32Array, grEnvelopes: Map<string, Float32Array> }[] = [];
  private isProcessingRack: boolean = false;
  private pendingRackUpdate: boolean = false;
  private wasmPath: string;

  constructor(wasmPath: string) {
    this.wasmPath = wasmPath;
  }

  async init() {
    const wasmBuffer = fs.readFileSync(this.wasmPath);
    const arrayBuffer = wasmBuffer.buffer.slice(
      wasmBuffer.byteOffset, 
      wasmBuffer.byteOffset + wasmBuffer.byteLength
    ) as ArrayBuffer;
    this.sdk = new SonicForgeSDK(arrayBuffer);
    await this.sdk.init();
  }

  async getModuleDescriptors() {
    return getModuleDescriptors();
  }

  async loadAudio(buffer: ArrayBuffer | Buffer) {
    const audio = await decode(buffer);
    this.numChannels = 2; // Always force stereo for TUI processors
    if (audio.numberOfChannels === 2) {
        this.sourceBuffer = this.interleave(audio.getChannelData(0), audio.getChannelData(1));
    } else {
        // Mono to Stereo
        this.sourceBuffer = this.interleave(audio.getChannelData(0), audio.getChannelData(0));
    }
    this.sampleRate = audio.sampleRate;
    this.duration = audio.duration;
    this.processedBuffer = new Float32Array(this.sourceBuffer);
    this.applyRack();
  }

  private interleave(l: Float32Array, r: Float32Array): Float32Array {
    const result = new Float32Array(l.length + r.length);
    for (let i = 0; i < l.length; i++) {
      result[i * 2] = l[i];
      result[i * 2 + 1] = r[i];
    }
    return result;
  }

  private applyRack() {
    if (!this.sourceBuffer || !this.sdk) return;
    
    // Prevent concurrent processing - queue if already processing
    if (this.isProcessingRack) {
      this.pendingRackUpdate = true;
      return;
    }
    this.isProcessingRack = true;
    // For now, we compare the current rack with the cacheStack.
    let startIndex = 0;
    let currentBuffer = new Float32Array(this.sourceBuffer);
    const currentGrEnvelopes = new Map<string, Float32Array>();

    for (let i = 0; i < this.rack.length; i++) {
        const cached = this.cacheStack[i];
        const mod = this.rack[i];

        // Simple check: if module ID matches and it's not the one we just updated?
        // Actually, NativeEngine is currently stateless regarding "which module changed".
        // To be safe, we'll clear the stack from the point of change.
        // But since we don't know the change point here yet, let's optimize updateParam.
        
        if (cached && cached.id === mod.id) {
            // Check if parameters changed? We'd need to store parameters in cache too.
            // For now, let's just use the stack if it exists and let updateParam/addModule handle invalidation.
            currentBuffer = cached.buffer as any;
            // Merge GR envelopes from previous steps
            for (const [gid, genv] of cached.grEnvelopes) {
                currentGrEnvelopes.set(gid, genv);
            }
            startIndex = i + 1;
        } else {
            break;
        }
    }

    // 2. Clear invalid cache
    this.cacheStack = this.cacheStack.slice(0, startIndex);

    // 3. Process remaining
    let current: any = new Float32Array(currentBuffer);
    
    for (let i = startIndex; i < this.rack.length; i++) {
      const mod = this.rack[i];
      if (mod.bypass) {
        // Still push to cache stack even if bypassed, just with current buffer
        this.cacheStack.push({ 
            id: mod.id, 
            buffer: new Float32Array(current),
            grEnvelopes: new Map(currentGrEnvelopes)
        });
        continue;
      }
      
      switch (mod.type) {
        case 'LOUDNESS_METER': 
             current = this.sdk.processLufsNormalize(current, mod.parameters.targetLufs ?? -14);
             break;
        case 'DE_CLIP':
             current = this.sdk.processDeclip(current, mod.parameters.threshold ?? 0.99);
             break;
        case 'PHASE_ROTATION':
             current = this.sdk.processPhaseRotation(current);
             break;
        case 'SPECTRAL_DENOISE':
             current = this.sdk.processSpectralDenoise(current);
             break;
        case 'MONO_BASS':
             current = this.sdk.processMonoBass(current, this.sampleRate, mod.parameters.frequency ?? 120);
             break;
        case 'PLOSIVE_GUARD':
             current = this.sdk.processPlosiveGuard(
               current, 
               this.sampleRate, 
               mod.parameters.sensitivity ?? 0.5, 
               mod.parameters.strength ?? 0.5, 
               mod.parameters.cutoff ?? 200
             );
             break;
        case 'VOICE_ISOLATE':
             current = this.sdk.processVoiceIsolate(current, mod.parameters.amount ?? 0.5);
             break;
        case 'PSYCHO_DYNAMIC_EQ':
             current = this.sdk.processPsychodynamic(
               current, 
               this.sampleRate, 
               mod.parameters.intensity ?? 0.5, 
               mod.parameters.refDb ?? -24
             );
             break;
        case 'SMART_LEVEL':
             current = this.sdk.processSmartLevel(
               current, 
               mod.parameters.targetLufs ?? -14, 
               mod.parameters.maxGainDb ?? 12, 
               mod.parameters.gateThresholdDb ?? -60
             );
             break;
        case 'TAPE_STABILIZER':
             current = this.sdk.processTapeStabilizer(
               current, 
               this.sampleRate, 
               mod.parameters.nominalFreq ?? 3150, 
               mod.parameters.scanMin ?? 3000, 
               mod.parameters.scanMax ?? 3300, 
               mod.parameters.amount ?? 0.5
             );
             break;
        case 'ECHO_VANISH':
             current = this.sdk.processEchoVanish(
               current, 
               this.sampleRate, 
               mod.parameters.amount ?? 0.5, 
               mod.parameters.tailMs ?? 500
             );
             break;
        case 'BITCRUSHER':
             current = this.sdk.processBitcrusher(
               current, 
               mod.parameters.bits ?? 8, 
               mod.parameters.normFreq ?? 1, 
               mod.parameters.mix ?? 1
             );
             break;
        case 'SATURATION':
             current = this.sdk.processSaturation(
               current, 
               mod.parameters.drive ?? 0, 
               mod.parameters.type ?? 1, 
               mod.parameters.outputGain ?? 0, 
               mod.parameters.mix ?? 1
             );
             break;
         case 'DISTORTION':
              current = this.sdk.processDistortion(
                current,
                mod.parameters.drive ?? 1,
                mod.parameters.type ?? 0,
                mod.parameters.outputGain ?? 0,
                mod.parameters.wet ?? 1
              );
              break;
        case 'CHORUS':
             current = this.sdk.processChorus(
               current,
               this.sampleRate,
               {
                 frequency: mod.parameters.frequency ?? 1.5,
                 delayTime: mod.parameters.delayTime ?? 0.03,
                 depth: mod.parameters.depth ?? 0.002,
                 feedback: mod.parameters.feedback ?? 0,
                 wet: mod.parameters.wet ?? 0.5
               }
             );
             break;
        case 'FEEDBACK_DELAY':
             current = this.sdk.processFeedbackDelay(
               current,
               this.sampleRate,
               {
                 delayTime: mod.parameters.delayTime ?? 0.5,
                 feedback: mod.parameters.feedback ?? 0.3,
                 wet: mod.parameters.wet ?? 0.5
               }
             );
             break;
        case 'PARAMETRIC_EQ':
             current = this.sdk.processParametricEQ(current, this.sampleRate, {
                lowFreq: mod.parameters.lowFreq ?? 100,
                lowGain: mod.parameters.lowGain ?? 0,
                midFreq: mod.parameters.midFreq ?? 1000,
                midGain: mod.parameters.midGain ?? 0,
                midQ: mod.parameters.midQ ?? 0.707,
                highFreq: mod.parameters.highFreq ?? 5000,
                highGain: mod.parameters.highGain ?? 0,
             });
             break;
        case 'COMPRESSOR': {
             current = this.sdk.processCompressor(current, this.sampleRate, {
                threshold: mod.parameters.threshold ?? -24,
                ratio: mod.parameters.ratio ?? 4,
                attack: mod.parameters.attack ?? 0.01,
                release: mod.parameters.release ?? 0.1,
                makeupGain: mod.parameters.makeupGain ?? 0,
                mix: mod.parameters.mix ?? 1
             });
             // TODO: Retrieve GR envelope from Zig if needed for UI
             currentGrEnvelopes.set(mod.id, new Float32Array(current.length / 2).fill(0)); 
             break;
        }
        case 'LIMITER': {
             current = this.sdk.processLimiter(
               current, 
               this.sampleRate, 
               mod.parameters.threshold ?? -6, 
               mod.parameters.release ?? 0.05
             );
              currentGrEnvelopes.set(mod.id, new Float32Array(current.length / 2).fill(0));
              break;
        }
         case 'TREMOLO':
              current = this.sdk.processTremolo(
                current,
                this.sampleRate,
                mod.parameters.frequency ?? 4,
                mod.parameters.depth ?? 0.5,
                mod.parameters.waveform ?? 0,
                mod.parameters.mix ?? 1
              );
              break;
         case 'PHASER':
              current = this.sdk.processPhaser(
                current,
                this.sampleRate,
                {
                  stages: mod.parameters.stages ?? 4,
                  frequency: mod.parameters.frequency ?? 0.5,
                  baseFrequency: mod.parameters.baseFrequency ?? 1000,
                  octaves: mod.parameters.octaves ?? 2,
                  wet: mod.parameters.wet ?? 0.5
                }
              );
              break;
         case 'AUTOWAH':
              current = OfflineDSP.applyAutowah(
                current,
                this.sampleRate,
                mod.parameters.baseFrequency ?? 100,
                mod.parameters.sensitivity ?? 0.5,
                mod.parameters.octaves ?? 4,
                mod.parameters.Q ?? 2,
                mod.parameters.attack ?? 0.01,
                mod.parameters.release ?? 0.1,
                mod.parameters.wet ?? 1
              );
              break;
         case 'STEREO_IMAGER':
              current = this.sdk.processStereoImager(
                current,
                this.sampleRate,
                {
                  lowFreq: mod.parameters.lowFreq ?? 150,
                  highFreq: mod.parameters.highFreq ?? 2500,
                  widthLow: mod.parameters.widthLow ?? 0,
                  widthMid: mod.parameters.widthMid ?? 1,
                  widthHigh: mod.parameters.widthHigh ?? 1.2
                }
              );
              break;
         case 'TRANSIENT_SHAPER':
              current = this.sdk.processTransientShaper(
                current,
                this.sampleRate,
                {
                  attackGain: mod.parameters.attackGain ?? 0,
                  sustainGain: mod.parameters.sustainGain ?? 0,
                  mix: mod.parameters.mix ?? 1
                }
              );
              break;
         case 'MIDSIDE_EQ':
              current = this.sdk.processMidSideEQ(
                current,
                this.sampleRate,
                {
                  midGain: mod.parameters.midGain ?? 0,
                  midFreq: mod.parameters.midFreq ?? 1000,
                  sideGain: mod.parameters.sideGain ?? 0,
                  sideFreq: mod.parameters.sideFreq ?? 1000
                }
              );
              break;
         case 'DYNAMIC_EQ':
              current = OfflineDSP.applyDynamicEQ(
                current,
                this.sampleRate,
                {
                  frequency: mod.parameters.frequency ?? 1000,
                  Q: mod.parameters.Q ?? 1,
                  gain: mod.parameters.gain ?? 0,
                  threshold: mod.parameters.threshold ?? -20,
                  ratio: mod.parameters.ratio ?? 2,
                  attack: mod.parameters.attack ?? 0.01,
                  release: mod.parameters.release ?? 0.1
                }
              );
              break;
         case 'DE_ESSER':
              current = this.sdk.processDeesser(
                current,
                this.sampleRate,
                {
                  frequency: mod.parameters.frequency ?? 6000,
                  threshold: mod.parameters.threshold ?? -20,
                  ratio: mod.parameters.ratio ?? 4,
                  attack: mod.parameters.attack ?? 0.005,
                  release: mod.parameters.release ?? 0.05
                }
              );
              break;
         case 'MULTIBAND_COMPRESSOR':
              current = OfflineDSP.applyMultibandCompressor(
                current,
                this.sampleRate,
                {
                  lowFreq: mod.parameters.lowFreq ?? 150,
                  highFreq: mod.parameters.highFreq ?? 2500,
                  threshLow: mod.parameters.threshLow ?? -24,
                  ratioLow: mod.parameters.ratioLow ?? 4,
                  gainLow: mod.parameters.gainLow ?? 0,
                  threshMid: mod.parameters.threshMid ?? -24,
                  ratioMid: mod.parameters.ratioMid ?? 4,
                  gainMid: mod.parameters.gainMid ?? 0,
                  threshHigh: mod.parameters.threshHigh ?? -24,
                  ratioHigh: mod.parameters.ratioHigh ?? 4,
                  gainHigh: mod.parameters.gainHigh ?? 0
                }
              );
              break;
         case 'DE_BLEED':
              // DE_BLEED requires source audio - use current as both for self-processing
              current = this.sdk!.processDebleed(current, current, mod.parameters.sensitivity ?? 0.5, mod.parameters.threshold ?? -40);
              break;
         case 'SPECTRAL_MATCH':
              if (mod.parameters.refAnalysisPtr) {
                current = this.sdk.processSpectralMatch(current, mod.parameters.refAnalysisPtr as number, mod.parameters.amount ?? 0.15);
              }
              break;
         case 'GAIN':
              current = this.sdk.processGain(current, mod.parameters.gain ?? 1.0);
              break;
         case 'LUFS_NORMALIZER':
              current = this.sdk.processLufsNormalize(current, mod.parameters.targetLufs ?? -14);
              break;
         case 'ZIG_SATURATION':
              current = this.sdk.processSaturation(
                current,
                mod.parameters.drive ?? 0.5,
                mod.parameters.type ?? 0,
                mod.parameters.outputGain ?? 0,
                mod.parameters.mix ?? 1
              );
              break;
         case 'ZIG_COMPRESSOR':
              current = this.sdk.processCompressor(current, this.sampleRate, {
                threshold: mod.parameters.threshold ?? -24,
                ratio: mod.parameters.ratio ?? 4,
                attack: mod.parameters.attack ?? 0.01,
                release: mod.parameters.release ?? 0.1,
                makeupGain: mod.parameters.makeup ?? 0,
                mix: mod.parameters.mix ?? 1
              });
              break;
         case 'ZIG_LIMITER':
              current = this.sdk.processLimiter(current, this.sampleRate, mod.parameters.threshold ?? -6, mod.parameters.release ?? 0.05);
              break;
         case 'ZIG_DE_ESSER':
              current = this.sdk.processDeesser(current, this.sampleRate, {
                frequency: mod.parameters.frequency ?? 6000,
                threshold: mod.parameters.threshold ?? -20,
                ratio: mod.parameters.ratio ?? 4,
                attack: mod.parameters.attack ?? 0.005,
                release: mod.parameters.release ?? 0.05
              });
              break;
         case 'ZIG_TRANSIENT_SHAPER':
              current = this.sdk.processTransientShaper(current, this.sampleRate, {
                attackGain: mod.parameters.attackGain ?? 0,
                sustainGain: mod.parameters.sustainGain ?? 0,
                mix: mod.parameters.mix ?? 1
              });
              break;
         case 'ZIG_BITCRUSHER':
              current = this.sdk.processBitcrusher(
                current,
                mod.parameters.bits ?? 8,
                mod.parameters.normFreq ?? 1,
                mod.parameters.mix ?? 1
              );
              break;
      }

      // Add to cache stack
      this.cacheStack.push({
          id: mod.id,
          buffer: new Float32Array(current),
          grEnvelopes: new Map(currentGrEnvelopes)
      });
    }
    
    this.processedBuffer = current;
    this.grEnvelopes = currentGrEnvelopes;
    
    // Release lock and process any pending updates
    this.isProcessingRack = false;
    if (this.pendingRackUpdate) {
      this.pendingRackUpdate = false;
      this.applyRack();
    }
  }

  async updateParam(moduleId: string, paramId: string, value: number) {
    const modIndex = this.rack.findIndex(m => m.id === moduleId);
    if (modIndex !== -1) {
      // Ensure value is a finite number to prevent NaN/Infinity glitches
      const safeValue = Number.isFinite(value) ? value : 0;
      this.rack[modIndex].parameters[paramId] = safeValue;
      // Invalidate cache from this module onwards
      this.cacheStack = this.cacheStack.slice(0, modIndex);
      this.applyRack();
    }
  }

  async addModule(type: RackModuleType) {
    const id = Math.random().toString(36).substr(2, 9);
    const descriptors = getModuleDescriptors();
    const descriptor = descriptors[type];
    const parameters: Record<string, any> = {};
    
    if (descriptor) {
      for (const p of descriptor.params) {
        parameters[p.name] = p.defaultValue;
      }
    }

    this.rack.push({
      id,
      name: type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      type,
      bypass: false,
      parameters
    });
    this.applyRack();
  }

  async removeModule(id: string) {
    const modIndex = this.rack.findIndex(m => m.id === id);
    if (modIndex !== -1) {
        this.rack.splice(modIndex, 1);
        this.cacheStack = this.cacheStack.slice(0, modIndex);
        this.applyRack();
    }
  }

  async reorderRack(start: number, end: number) {
    const [removed] = this.rack.splice(start, 1);
    this.rack.splice(end, 0, removed);
    // Invalidate from the earlier of the two indices
    this.cacheStack = this.cacheStack.slice(0, Math.min(start, end));
    this.applyRack();
  }

  async toggleModuleBypass(id: string) {
    const modIndex = this.rack.findIndex(m => m.id === id);
    if (modIndex !== -1) {
      this.rack[modIndex].bypass = !this.rack[modIndex].bypass;
      // Invalidate cache from this module onwards
      this.cacheStack = this.cacheStack.slice(0, modIndex);
      this.applyRack();
    }
  }

  async togglePlay() {
    if (this.isPlaying) {
      this.stopPlayback();
    } else {
      this.startPlayback();
    }
  }

  async stop() {
    this.stopPlayback();
    this.currentTime = 0;
  }

  private startPlayback() {
    if (!this.processedBuffer) return;
    this.isPlaying = true;

    try {
      // Platform-specific audio output command
      let command: string;
      let args: string[];

      if (process.platform === 'darwin') {
        // macOS: ffplay is the most reliable for raw PCM piping
        command = 'ffplay';
        args = [
          '-f', 'f32le',
          '-ar', this.sampleRate.toString(),
          '-ac', this.numChannels.toString(),
          '-nodisp',
          '-autoexit',
          '-i', 'pipe:0'
        ];
      } else {
        // Linux/Default: Use aplay (ALSA)
        command = 'aplay';
        args = [
          '-r', this.sampleRate.toString(),
          '-c', this.numChannels.toString(),
          '-f', 'FLOAT_LE',
          '-t', 'raw',
          '--buffer-time', '200000' // 200ms buffer to reduce underruns
        ];
      }

      this.playbackProcess = spawn(command, args);

      if (this.playbackProcess.stdin) {
        this.playbackProcess.stdin.on('error', (err: any) => {
          if (err.code === 'EPIPE') return; // Expected when stopping
          console.error('Playback pipe error:', err);
        });
      }

      const chunkSize = 1024; // Smaller chunks for higher temporal resolution
      const totalSamples = this.processedBuffer.length;
      
      let currentSample = Math.floor(this.currentTime * this.sampleRate) * this.numChannels;

      const pump = () => {
        if (!this.isPlaying || !this.playbackProcess || !this.playbackProcess.stdin) return;

        let canWrite = true;
        while (canWrite && this.isPlaying) {
            const bufferToUse = this.abMode === 'A' ? this.sourceBuffer : this.processedBuffer;
            if (!bufferToUse) return;

            const totalSamples = bufferToUse.length;
            const endSample = Math.min(currentSample + chunkSize * this.numChannels, totalSamples);
            
            if (currentSample >= totalSamples) {
                this.playbackProcess.stdin.end();
                return;
            }

            const chunk = bufferToUse.slice(currentSample, endSample);
            
            // Update metering for every chunk to capture all transients
            this.updateMetering(chunk);

            const buffer = Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength);
            canWrite = this.playbackProcess.stdin.write(buffer);
            
            currentSample = endSample;
            this.currentTime = (currentSample / this.numChannels) / this.sampleRate;
        }

        if (this.isPlaying && !canWrite) {
          this.playbackProcess.stdin.once('drain', pump);
        }
      };

      pump();

      this.playbackProcess.on('exit', () => {
        this.isPlaying = false;
        this.playbackProcess = null;
      });

    } catch (e) {
      console.error('Failed to start playback:', e);
      this.isPlaying = false;
    }
  }

  private stopPlayback() {
    this.isPlaying = false;
    if (this.playbackProcess) {
      this.playbackProcess.kill();
      this.playbackProcess = null;
    }
    this.meteringData = { levels: [0, 0], peakLevels: [0, 0] };
  }

  private updateMetering(chunk: Float32Array) {
    if (!this.sdk) return;

    const stats = this.sdk.analyzeAudio(chunk, this.numChannels, this.sampleRate);
    
    // Sanitize stats to prevent NaN propagation to UI
    const sanitize = (val: number, fallback: number = 0) => {
        return (Number.isNaN(val) || !Number.isFinite(val)) ? fallback : val;
    };

    const lufs = sanitize(stats[0], -100);
    const rmsDb = sanitize(stats[3], -100);
    const peakDb = sanitize(stats[2], -100);

    this.meteringData = {
        ...this.meteringData,
        levels: [dbToLinear(rmsDb), dbToLinear(rmsDb)],
        peakLevels: [dbToLinear(peakDb), dbToLinear(peakDb)],
        stats: {
            lufs: lufs,
            lra: sanitize(stats[1]),
            crest: sanitize(stats[4]),
            correlation: sanitize(stats[5], 1),
            width: sanitize(stats[6]),
            balance: sanitize(stats[7]),
            specLow: sanitize(stats[9], 0.33),
            specMid: sanitize(stats[10], 0.33),
            specHigh: sanitize(stats[11], 0.33)
        }
    };

    const fftWindowSize = 1024;
    if (chunk.length >= fftWindowSize) {
        const monoSlice = new Float32Array(fftWindowSize);
        if (this.numChannels === 2) {
            for (let i = 0; i < fftWindowSize; i++) {
                monoSlice[i] = (chunk[i * 2] + chunk[i * 2 + 1]) * 0.5;
            }
        } else {
            monoSlice.set(chunk.slice(0, fftWindowSize));
        }
        this.meteringData.fftData = this.sdk.getFFTMagnitudes(monoSlice);
    }
  }

  async setMasterVolume(val: number) {
    // Volume scaling could be applied in the pump loop or applyRack
  }

  async seek(time: number) {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) this.stopPlayback();
    this.currentTime = Math.max(0, Math.min(time, this.duration));
    if (wasPlaying) this.startPlayback();
  }

  async getRack() {
    return this.rack;
  }

  async getPlaybackState(): Promise<PlaybackState> {
    return {
      isPlaying: this.isPlaying,
      currentTime: this.currentTime,
      duration: this.duration
    };
  }

  async getSuggestions() {
    if (!this.sourceBuffer || !this.sdk) return [];
    const analyzer = new ProfileAnalyzer(this.sdk as any);
    const profile = analyzer.analyze(this.sourceBuffer, this.numChannels, this.sampleRate);
    return analyzer.suggestRack(profile);
  }

  async getMetering(): Promise<MeteringData> {
    const rackReduction: Record<string, number> = {};
    const sampleIndex = Math.floor(this.currentTime * this.sampleRate);
    
    for (const [id, env] of this.grEnvelopes) {
        if (sampleIndex < env.length) {
            rackReduction[id] = env[sampleIndex];
        } else {
            rackReduction[id] = 0;
        }
    }

    return {
      ...this.meteringData,
      rackReduction
    };
  }

  async exportAudio(outputPath: string): Promise<boolean> {
    if (!this.processedBuffer) return false;
    
    try {
      const wavBuffer = encodeWAV(
        this.processedBuffer, 
        this.numChannels, 
        this.sampleRate, 
        1, // Format 1 is PCM
        16 // Default to 16-bit for now
      );
      
      fs.writeFileSync(outputPath, Buffer.from(wavBuffer));
      return true;
    } catch (e) {
      console.error('Export error:', e);
      return false;
    }
  }

  async close() {
    this.stopPlayback();
  }

  setABMode(mode: 'A' | 'B') {
    this.abMode = mode;
  }
}
