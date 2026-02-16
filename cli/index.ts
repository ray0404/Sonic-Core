#!/usr/bin/env node
import { Command } from 'commander';
import path from 'path';
import { fileURLToPath } from 'url';
import { NativeEngine } from './engine/native-engine.js';
import { runTUI } from './ui/index.js';
import fs from 'fs';
import { exportPlugin } from './plugins/export.js';
import { Director } from './engine/director.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const program = new Command();

program
  .name('sonicforge')
  .description('Sonic Forge CLI & TUI')
  .version('0.1.0');

function getWasmPath() {
    const isRunningFromDist = __dirname.includes(path.join('dist', 'cli'));
    if (isRunningFromDist) {
        // Prefer the localized WASM copied during build:cli
        return path.resolve(__dirname, 'wasm', 'dsp.wasm');
    } else {
        return path.resolve(__dirname, '..', 'public', 'wasm', 'dsp.wasm');
    }
}

program
  .command('start')
  .description('Start the Interactive TUI')
  .option('-d, --debug', 'Enable debug logging')
  .action(async (options) => {
    console.log('Starting Sonic Forge TUI...');

    const wasmPath = getWasmPath();

    if (!fs.existsSync(wasmPath)) {
        console.error(`Error: Could not find DSP WASM at "${wasmPath}".`);
        console.error('Hint: You might need to run "npm run build:wasm" first.');
        process.exit(1);
    }

    try {
      const engine = new NativeEngine(wasmPath);
      await engine.init();
      if (options.debug) console.log('Engine Connected.');

      await runTUI(engine);

      await engine.close();
      process.exit(0);

    } catch (error) {
      console.error('Fatal Error:', error);
      process.exit(1);
    }
  });

program
  .command('director')
  .description('Batch process audio files using a .sonic manifest')
  .argument('<manifest>', 'Path to .sonic manifest file (JSON)')
  .argument('<input>', 'Input directory')
  .argument('<output>', 'Output directory')
  .option('-p, --parallel <number>', 'Number of parallel workers', '4')
  .action(async (manifestPath, inputDir, outputDir, options) => {
    console.log(`Director: Batch processing from ${inputDir} to ${outputDir}...`);
    
    const wasmPath = getWasmPath();
    if (!fs.existsSync(wasmPath)) {
        console.error(`Error: Could not find DSP WASM at "${wasmPath}".`);
        process.exit(1);
    }

    if (!fs.existsSync(manifestPath)) {
        console.error(`Error: Manifest file not found at "${manifestPath}".`);
        process.exit(1);
    }

    try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const director = new Director(wasmPath);
        
        const results = await director.processBatch({
            inputDir,
            outputDir,
            manifest,
            parallel: parseInt(options.parallel)
        });

        console.log('\nBatch Processing Complete:');
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        
        console.log(`- Total: ${results.length}`);
        console.log(`- Success: ${successful}`);
        console.log(`- Failed: ${failed}`);

        if (failed > 0) {
            console.log('\nErrors:');
            results.filter(r => !r.success).forEach(r => {
                console.log(`  - ${path.basename(r.inputPath)}: ${r.error}`);
            });
            process.exit(1);
        }
        process.exit(0);

    } catch (error) {
        console.error('Director Error:', error);
        process.exit(1);
    }
  });

const modules = [
  'compressor',
  'tremolo',
  'transient-shaper',
  'stereo-imager',
  'saturation',
  'phaser',
  'parametric-eq',
  'multiband-compressor',
  'midside-eq',
  'metering',
  'limiter',
  'feedback-delay',
  'dynamic-eq',
  'dithering',
  'distortion',
  'deesser',
  'convolution',
  'chorus',
  'bitcrusher',
  'autowah',
];

const modulesCommand = program.command('modules')
  .description('Interact with audio effect modules.');

modulesCommand
  .command('list')
  .description('List all available audio modules.')
  .action(() => {
    console.log('Available SonicForge Modules:');
    modules.forEach(m => console.log(`- ${m}`));
  });

const exportCommand = program.command('export')
  .description('Export DSP modules as native plugin formats (VST3, AU)');

exportCommand
  .command('vst3')
  .description('Export as VST3 plugin')
  .option('-p, --plugin <id>', 'Plugin ID to export', 'gain')
  .option('-o, --output <path>', 'Output directory', 'dist/plugins')
  .option('-t, --target <arch>', 'Target architecture (x86_64, aarch64)', '')
  .action(async (options) => {
    console.log('Building VST3 plugin...');
    await exportPlugin({
      format: 'vst3',
      plugin: options.plugin,
      output: options.output,
      target: options.target
    });
  });

exportCommand
  .command('au')
  .description('Export as Audio Unit plugin (macOS only)')
  .option('-p, --plugin <id>', 'Plugin ID to export', 'gain')
  .option('-o, --output <path>', 'Output directory', 'dist/plugins')
  .option('-t, --target <arch>', 'Target architecture (aarch64, x86_64)', '')
  .action(async (options) => {
    if (process.platform !== 'darwin') {
      console.error('Audio Units can only be built on macOS');
      process.exit(1);
    }
    console.log('Building Audio Unit plugin...');
    await exportPlugin({
      format: 'au',
      plugin: options.plugin,
      output: options.output,
      target: options.target
    });
  });

program.parse();
