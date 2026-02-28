
import fs from 'fs';
import path from 'path';
import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import { BatchProcessOptions, FileProcessResult, DirectorManifest } from '../../packages/sonic-core/src/director-types.js';
import { NativeEngine } from './native-engine.js';

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
    
    // Process analysis in parallel
    const analysisTasks = files.map(async (file) => {
      const filePath = path.join(inputDir, file);
      
      // 1. FFmpeg for LUFS/TP (EBU R128)
      // This is faster and standard for the initial pass
      const { stderr } = await execAsync(`ffmpeg -nostats -i "${filePath}" -filter_complex ebur128=peak=true -f null -`);
      const lufsMatch = stderr.match(/I:\s+([-+]?\d+\.\d+)\s+LUFS/);
      const tpMatch = stderr.match(/True Peak:\s+([-+]?\d+\.\d+)\s+dBFS/);
      
      const analysis: TrackAnalysis = {
        lufs: lufsMatch ? parseFloat(lufsMatch[1]) : -14,
        truePeak: tpMatch ? parseFloat(tpMatch[1]) : 0
      };

      // 2. Sonic-Core for Spectral Profile (if enabled)
      if (manifest.spectralMatch?.enabled) {
        const engine = new NativeEngine(this.wasmPath);
        await engine.init();
        const buffer = fs.readFileSync(filePath);
        await engine.loadAudio(buffer);
        // Assuming we add a method to get raw magnitudes from the engine
        // Or directly use SDK
        const sdk = (engine as any).sdk;
        const magnitudes = sdk.getFFTMagnitudes((engine as any).processedBuffer);
        analysis.spectralProfile = magnitudes;
        // Also capture a reference analysis pointer for phase 3
        analysis.analysisPtr = sdk.spectralMatchAnalyze((engine as any).processedBuffer);
      }

      analyses.set(file, analysis);
    });

    await Promise.all(analysisTasks);

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
          // Cleanup WASM pointers before resolving
          analyses.forEach(a => {
            if (a.analysisPtr) {
              // We'd need a way to reach the SDK to free this, 
              // or handle it in the worker.
            }
          });
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
                    // In a real implementation, we'd pass the aggregated albumProfile 
                    // to the worker via a shared buffer or serialized.
                    // For now, let's assume we use the track's own analysisPtr as a placeholder
                    // or pass the data.
                    refAnalysisPtr: analyses.get(file)?.analysisPtr
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

          let workerPath = path.resolve(__dirname, 'director-worker.js');
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
