
import fs from 'fs';
import path from 'path';
import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { BatchProcessOptions, FileProcessResult, DirectorManifest } from '../../packages/sonic-core/src/director-types.ts';
import { NativeEngine } from './native-engine.ts';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface TrackAnalysis {
  lufs: number;
  truePeak: number;
  spectralProfile?: Float32Array;
  analysisPtr?: number; // Pointer to WASM analysis result
}

export class Director {
  private wasmPath: string;
  constructor(wasmPath: string) {
    this.wasmPath = wasmPath;
  }

  async processBatch(options: BatchProcessOptions): Promise<FileProcessResult[]> {
    const { inputDir, outputDir, manifest, parallel = 4 } = options;

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const files = fs.readdirSync(inputDir)
      .filter(f => f.endsWith('.wav') || f.endsWith('.mp3'));

    if (files.length === 0) return [];

    // --- PHASE 1: Discovery & Analysis ---
    console.log(`[Director] Starting Phase 1: Analysis of ${files.length} tracks...`);
    const analyses: Map<string, TrackAnalysis> = new Map();
    
    // 1. Parallel FFmpeg analysis (fast/stable)
    const ffmpegTasks = files.map(async (file) => {
      const filePath = path.join(inputDir, file);
      // Capture both stdout and stderr
      const { stderr } = await execAsync(`ffmpeg -nostats -i "${filePath}" -filter_complex ebur128=peak=true -f null -`);
      
      // Look for the Integrated loudness section in the summary
      const lufsSummaryMatch = stderr.match(/Integrated loudness:\s+I:\s+([-+]?\d+\.\d+)\s+LUFS/i);
      // Look for the True peak section in the summary
      const tpSummaryMatch = stderr.match(/True peak:\s+Peak:\s+([-+]?\d+\.\d+)\s+dBFS/i);
      
      const lufs = lufsSummaryMatch ? parseFloat(lufsSummaryMatch[1]) : -14;
      const truePeak = tpSummaryMatch ? parseFloat(tpSummaryMatch[1]) : 0;
      
      return {
        file,
        lufs,
        truePeak
      };
    });

    const ffmpegResults = await Promise.all(ffmpegTasks);
    ffmpegResults.forEach(r => {
      analyses.set(r.file, { lufs: r.lufs, truePeak: r.truePeak });
    });

    // 2. Sequential Sonic-Core analysis (avoids audio-decode/WASM race conditions)
    if (manifest.spectralMatch?.enabled) {
      console.log(`[Director] Capturing spectral profiles...`);
      for (const file of files) {
        const filePath = path.join(inputDir, file);
        const engine = new NativeEngine(this.wasmPath);
        await engine.init();
        const buffer = fs.readFileSync(filePath);
        await engine.loadAudio(buffer);
        
        const sdk = (engine as any).sdk;
        const analysisPtr = sdk.spectralMatchAnalyze((engine as any).processedBuffer);
        const analysis = analyses.get(file)!;
        analysis.spectralProfile = sdk.spectralMatchGetProfile(analysisPtr);
        sdk.spectralMatchFree(analysisPtr);
        
        await engine.close();
      }
    }

    // --- PHASE 2: Calculation & Aggregation ---
    console.log(`[Director] Starting Phase 2: Album aggregation...`);
    
    // 1. Album Loudness
    let albumEnergySum = 0;
    analyses.forEach(a => albumEnergySum += Math.pow(10, a.lufs / 10));
    const albumLufs = 10 * Math.log10(albumEnergySum / analyses.size);
    
    // 2. Album Spectral Profile
    let albumProfile: Float32Array | undefined;
    if (manifest.spectralMatch?.enabled) {
      const profiles = Array.from(analyses.values()).map(a => a.spectralProfile).filter(p => !!p);
      if (profiles.length > 0) {
        const binCount = profiles[0]!.length;
        albumProfile = new Float32Array(binCount);
        for (let i = 0; i < binCount; i++) {
          let binSum = 0;
          for (const p of profiles) binSum += p![i];
          albumProfile[i] = binSum / profiles.length;
        }
      }
    }

    // 3. Hybrid Gain Calculation
    const targetLufs = manifest.normalize?.targetLufs ?? -14;
    const weight = manifest.normalize?.albumMode?.weight ?? 0.3;
    const albumDelta = targetLufs - albumLufs;

    const trackGains: Map<string, number> = new Map();
    files.forEach(file => {
      const a = analyses.get(file)!;
      const independentDelta = targetLufs - a.lufs;
      // Formula: ΔG = (W * ΔG_independent) + ((1 - W) * ΔG_album)
      const hybridDelta = (weight * independentDelta) + ((1 - weight) * albumDelta);
      trackGains.set(file, Math.pow(10, hybridDelta / 20));
    });

    // --- PHASE 3: Execution (Rendering) ---
    console.log(`[Director] Starting Phase 3: Rendering with iterative True-Peak protection...`);
    
    const results: FileProcessResult[] = [];
    const queue = [...files];
    let activeWorkers = 0;

    return new Promise((resolve) => {
      const processNext = () => {
        if (queue.length === 0 && activeWorkers === 0) {
          resolve(results);
          return;
        }

        while (activeWorkers < parallel && queue.length > 0) {
          const file = queue.shift()!;
          const inputPath = path.join(inputDir, file);
          const baseName = path.basename(file, path.extname(file));
          const outputExt = manifest.format || 'wav';
          const outputPath = path.join(outputDir, `${baseName}.${outputExt}`);

          activeWorkers++;
          
          // Modify manifest for this specific track
          const profileData = manifest.spectralMatch?.albumProfile ? albumProfile : analyses.get(file)?.spectralProfile;

          const trackManifest: DirectorManifest = {
            ...manifest,
            rack: [
              // 1. Spectral Match (if enabled)
              ...(manifest.spectralMatch?.enabled ? [{
                id: 'album-spectral-match',
                name: 'Album Spectral Match',
                type: 'SPECTRAL_MATCH' as any,
                parameters: { 
                    amount: manifest.spectralMatch.amount,
                    profileData: profileData
                }
              }] : []),
              
              // 2. Hybrid Gain
              {
                id: 'hybrid-gain',
                name: 'Hybrid Normalization Gain',
                type: 'GAIN' as any,
                parameters: { gain: trackGains.get(file) ?? 1.0 }
              },

              // 3. Original Rack
              ...manifest.rack,

              // 4. Safety Limiter
              {
                id: 'album-limiter',
                name: 'Album True Peak Limiter',
                type: 'LIMITER' as any,
                parameters: { 
                  threshold: manifest.normalize?.albumMode?.truePeakCeiling ?? -1.0,
                  release: 0.05
                }
              }
            ]
          };

          let workerPath = path.resolve(__dirname, 'director-worker.ts');
          if (!fs.existsSync(workerPath)) {
              workerPath = path.resolve(__dirname, 'director-worker.ts');
          }

          const worker = new Worker(workerPath, {
            execArgv: workerPath.endsWith('.ts') ? ['--import', 'tsx'] : [],
            workerData: {
              inputPath,
              outputPath,
              manifest: trackManifest,
              wasmPath: this.wasmPath
            }
          });

          worker.on('message', (result: FileProcessResult) => {
            results.push(result);
          });

          worker.on('error', (err) => {
            results.push({
              inputPath,
              outputPath,
              success: false,
              error: err.message
            });
          });

          worker.on('exit', () => {
            activeWorkers--;
            processNext();
          });
        }
      };

      processNext();
    });
  }
}
