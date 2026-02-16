
import fs from 'fs';
import path from 'path';
import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import { BatchProcessOptions, FileProcessResult } from '../../packages/sonic-core/src/director-types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
          
          let workerPath = path.resolve(__dirname, 'director-worker.js');
          if (!fs.existsSync(workerPath)) {
              workerPath = path.resolve(__dirname, 'director-worker.ts');
          }

          console.log(`[Director] Processing: ${file} -> ${path.basename(outputPath)}`);

          const worker = new Worker(workerPath, {
            execArgv: workerPath.endsWith('.ts') ? ['--import', 'tsx'] : [],
            workerData: {
              inputPath,
              outputPath,
              manifest,
              wasmPath: this.wasmPath
            }
          });

          worker.on('message', (result: FileProcessResult) => {
            if (result.success) {
                console.log(`[Director] Success: ${path.basename(result.inputPath)} (${result.duration}ms)`);
            }
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
