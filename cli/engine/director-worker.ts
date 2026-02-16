
import { parentPort, workerData } from 'worker_threads';
import fs from 'fs';
import { NativeEngine } from './native-engine.js';
import { DirectorManifest, FileProcessResult } from '../../packages/sonic-core/src/director-types.js';

async function processFile() {
  const { inputPath, outputPath, manifest, wasmPath } = workerData as {
    inputPath: string;
    outputPath: string;
    manifest: DirectorManifest;
    wasmPath: string;
  };

  const startTime = Date.now();

  try {
    const engine = new NativeEngine(wasmPath);
    await engine.init();

    const audioBuffer = fs.readFileSync(inputPath);
    await engine.loadAudio(audioBuffer);

    // Apply rack from manifest
    // Clear existing rack
    const currentRack = await engine.getRack();
    for (const mod of currentRack) {
        await engine.removeModule(mod.id);
    }

    for (const mod of manifest.rack) {
        await engine.addModule(mod.type);
        const newRack = await engine.getRack();
        const lastMod = newRack[newRack.length - 1];
        
        for (const [key, val] of Object.entries(mod.parameters)) {
            await engine.updateParam(lastMod.id, key, val as number);
        }
        if (mod.bypass) {
            await engine.toggleModuleBypass(lastMod.id);
        }
    }

    // Export result
    const success = await engine.exportAudio(outputPath);

    if (!success) {
        throw new Error('Export failed');
    }

    const result: FileProcessResult = {
        inputPath,
        outputPath,
        success: true,
        duration: Date.now() - startTime
    };

    parentPort?.postMessage(result);

  } catch (error: any) {
    const result: FileProcessResult = {
        inputPath,
        outputPath,
        success: false,
        error: error.message,
        duration: Date.now() - startTime
    };
    parentPort?.postMessage(result);
  }
}

processFile();
