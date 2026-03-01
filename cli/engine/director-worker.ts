
import { parentPort, workerData } from 'worker_threads';
import fs from 'fs';
import path from 'path';
import { NativeEngine } from './native-engine.ts';
import type { DirectorManifest, FileProcessResult } from '../../packages/sonic-core/src/director-types.ts';

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
        await engine.addModule(mod.type, mod.id);
        const newRack = await engine.getRack();
        const lastMod = newRack[newRack.length - 1];
        
        for (const [key, val] of Object.entries(mod.parameters)) {
            await engine.updateParam(lastMod.id, key, val as number);
        }
        if (mod.bypass) {
            await engine.toggleModuleBypass(lastMod.id);
        }
    }

    // --- Iterative Convergence Loop ---
    if (manifest.normalize?.enabled) {
        const targetLufs = manifest.normalize.targetLufs;
        const targetLra = manifest.normalize.targetLra;
        const lufsTolerance = 0.2;
        const lraTolerance = 0.5;
        let iterations = 0;
        const maxIterations = 5;

        while (iterations < maxIterations) {
            // 1. Measure current output
            const processedBuffer = (engine as any).processedBuffer;
            const stats = (engine as any).sdk.analyzeAudio(processedBuffer, 2, (engine as any).sampleRate);
            const currentLufs = stats[0];
            const currentLra = stats[1];

            const lufsError = targetLufs - currentLufs;
            const lraError = targetLra ? currentLra - targetLra : 0;

            // Check if we're done
            if (Math.abs(lufsError) <= lufsTolerance && (!targetLra || Math.abs(lraError) <= lraTolerance)) break;

            // 2. Adjust LRA via Compressor (if needed)
            if (targetLra && Math.abs(lraError) > lraTolerance) {
                const compMod = (await engine.getRack()).find(m => m.id === 'album-compressor');
                if (compMod) {
                    // Adjust threshold based on LRA error (empirical nudge)
                    const currentThreshold = compMod.parameters.threshold;
                    // Lower threshold (increase value toward 0.0) means more compression
                    const nudge = (lraError / 15.0); // Simple proportional nudge
                    const newThreshold = Math.max(0.0, Math.min(1.0, currentThreshold - nudge));
                    await engine.updateParam(compMod.id, 'threshold', newThreshold);
                }
            }

            // 3. Adjust Gain for LUFS
            const gainMod = (await engine.getRack()).find(m => m.id === 'hybrid-gain');
            if (gainMod) {
                const currentLinearGain = gainMod.parameters.gain;
                const currentDbGain = 20 * Math.log10(currentLinearGain);
                const newDbGain = currentDbGain + lufsError;
                const newLinearGain = Math.pow(10, newDbGain / 20);
                await engine.updateParam(gainMod.id, 'gain', newLinearGain);
            }

            iterations++;
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
