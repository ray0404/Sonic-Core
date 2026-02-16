#!/usr/bin/env node
import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..', '..');

const program = new Command();

interface ExportOptions {
  format: 'vst3' | 'au';
  plugin: string;
  output: string;
  target: string;
}

const AVAILABLE_PLUGINS = [
  { id: 'gain', name: 'SonicGain', description: 'Basic gain control' },
  { id: 'plosiveguard', name: 'SonicPlosiveGuard', description: 'Plosive removal' },
  { id: 'voice_isolate', name: 'SonicVoiceIsolate', description: 'Voice isolation' },
  { id: 'debleed', name: 'SonicDebleed', description: 'Guitar bleed removal' },
  { id: 'echovanish', name: 'SonicEchoVanish', description: 'Echo/reverb reduction' },
  { id: 'smart_level', name: 'SonicSmartLevel', description: 'Adaptive leveling' },
  { id: 'spectralmatch', name: 'SonicSpectralMatch', description: 'EQ fingerprint matching' },
  { id: 'tape_stabilizer', name: 'SonicTapeStabilizer', description: 'Pitch drift correction' },
  { id: 'compressor', name: 'SonicCompressor', description: 'Dynamics compression' },
  { id: 'parametriceq', name: 'SonicParametricEQ', description: '3-band parametric EQ' },
  { id: 'distortion', name: 'SonicDistortion', description: 'Harmonic distortion' },
  { id: 'chorus', name: 'SonicChorus', description: 'Stereo chorus effect' },
  { id: 'limiter', name: 'SonicLimiter', description: 'Brickwall limiter' },
  { id: 'deesser', name: 'SonicDeEsser', description: 'Sibilance reduction' },
  { id: 'transientshaper', name: 'SonicTransientShaper', description: 'Transient control' },
  { id: 'midsideeq', name: 'SonicMidSideEQ', description: 'Mid/Side equalization' },
  { id: 'stereoimager', name: 'SonicStereoImager', description: 'Stereo width control' },
  { id: 'tremolo', name: 'SonicTremolo', description: 'Amplitude modulation' },
  { id: 'phaser', name: 'SonicPhaser', description: 'Phase-shifted modulation' },
  { id: 'saturation', name: 'SonicSaturation', description: 'Tube/Tape saturation' },
  { id: 'bitcrusher', name: 'SonicBitcrusher', description: 'Lo-fi reduction' },
  { id: 'dithering', name: 'SonicDithering', description: 'Word length reduction' },
  { id: 'feedbackdelay', name: 'SonicFeedbackDelay', description: 'Echo delay effect' },
  { id: 'lufsnorm', name: 'SonicLufsNorm', description: 'Loudness normalization' },
  { id: 'phaserotate', name: 'SonicPhaseRotate', description: 'Phase alignment' },
  { id: 'declip', name: 'SonicDeClip', description: 'Clipped peak repair' },
  { id: 'denoise', name: 'SonicDenoise', description: 'Spectral noise reduction' },
  { id: 'monobass', name: 'SonicMonoBass', description: 'Low-frequency centering' },
  { id: 'psychodynamic', name: 'SonicPsychoDynamic', description: 'Adaptive psycho-EQ' },
];

function detectPlatform(): 'windows' | 'macos' | 'linux' {
  const platform = process.platform;
  if (platform === 'win32') return 'windows';
  if (platform === 'darwin') return 'macos';
  return 'linux';
}

function getTargetTriple(format: string, platform: string, targetArch?: string): string {
  const arch = targetArch || (platform === 'macos' ? 'aarch64' : 'x86_64');
  
  if (format === 'vst3') {
    if (platform === 'windows') return `${arch}-windows-gnu`;
    if (platform === 'macos') return `${arch}-macos`;
    return `${arch}-linux-gnu`;
  }
  
  if (format === 'au') {
    if (platform !== 'macos') {
      console.error('Audio Units are only supported on macOS');
      process.exit(1);
    }
    return `${arch}-macos`;
  }
  
  return `${arch}-linux-gnu`;
}

async function buildZigPlugin(options: ExportOptions): Promise<string> {
  const platform = detectPlatform();
  const target = getTargetTriple(options.format, platform, options.target);
  
  const pluginConfig = AVAILABLE_PLUGINS.find(p => p.id === options.plugin) || AVAILABLE_PLUGINS[0];
  
  console.log(`Building ${options.format.toUpperCase()} plugin: ${pluginConfig.name}`);
  console.log(`Target: ${target}`);
  console.log(`Output: ${options.output}`);
  
  const dspKernelPath = path.join(rootDir, 'libs', 'sonic-dsp-kernel');
  
  if (!fs.existsSync(dspKernelPath)) {
    throw new Error(`DSP Kernel not found at ${dspKernelPath}`);
  }
  
  const buildStep = options.format === 'au' ? 'au' : 'plugin';
  const buildCommand = [
    'zig', 'build',
    `-Dplugin-name=${pluginConfig.name}`,
    `-Dtarget=${target}`,
    buildStep
  ];
  
  console.log(`\nRunning: ${buildCommand.join(' ')}`);
  console.log(`Working directory: ${dspKernelPath}\n`);
  
  return new Promise((resolve, reject) => {
    const child = spawn(buildCommand[0], buildCommand.slice(1), {
      cwd: dspKernelPath,
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code: number) => {
      if (code === 0) {
        resolve(`Successfully built ${options.format.toUpperCase()} plugin`);
      } else {
        reject(new Error(`Build failed with code ${code}`));
      }
    });
    
    child.on('error', (err: Error) => {
      reject(err);
    });
  });
}

export async function exportPlugin(options: ExportOptions): Promise<string> {
  const platform = detectPlatform();
  const target = getTargetTriple(options.format, platform, options.target);
  
  const pluginConfig = AVAILABLE_PLUGINS.find(p => p.id === options.plugin) || AVAILABLE_PLUGINS[0];
  
  console.log(`Building ${options.format.toUpperCase()} plugin: ${pluginConfig.name}`);
  console.log(`Target: ${target}`);
  console.log(`Output: ${options.output}`);
  
  const dspKernelPath = path.join(rootDir, 'libs', 'sonic-dsp-kernel');
  
  if (!fs.existsSync(dspKernelPath)) {
    throw new Error(`DSP Kernel not found at ${dspKernelPath}`);
  }
  
  const buildStep = options.format === 'au' ? 'au' : 'plugin';
  const buildCommand = [
    'zig', 'build',
    `-Dplugin-name=${pluginConfig.name}`,
    `-Dtarget=${target}`,
    buildStep
  ];
  
  console.log(`\nRunning: ${buildCommand.join(' ')}`);
  console.log(`Working directory: ${dspKernelPath}\n`);
  
  return new Promise((resolve, reject) => {
    const child = spawn(buildCommand[0], buildCommand.slice(1), {
      cwd: dspKernelPath,
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code: number) => {
      if (code === 0) {
        resolve(`Successfully built ${options.format.toUpperCase()} plugin`);
      } else {
        reject(new Error(`Build failed with code ${code}`));
      }
    });
    
    child.on('error', (err: Error) => {
      reject(err);
    });
  });
}

function validateOutputDir(outputPath: string): void {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  program
    .name('export')
    .description('Export DSP modules as native plugin formats (VST3, AU)')
    .option('-f, --format <format>', 'Plugin format: vst3 or au', 'vst3')
    .option('-p, --plugin <plugin>', 'Plugin to export (ID)', 'gain')
    .option('-o, --output <path>', 'Output directory', 'dist/plugins')
    .option('-t, --target <arch>', 'Target architecture (x86_64, aarch64)', '')
    .action(async (cliOptions) => {
      try {
        const format = cliOptions.format.toLowerCase() as 'vst3' | 'au';
        
        if (format !== 'vst3' && format !== 'au') {
          console.error('Invalid format. Use "vst3" or "au"');
          process.exit(1);
        }
        
        if (format === 'au' && detectPlatform() !== 'macos') {
          console.error('Audio Units can only be built on macOS');
          process.exit(1);
        }
        
        const outputPath = path.resolve(cliOptions.output);
        validateOutputDir(outputPath);
        
        const exportOptions: ExportOptions = {
          format,
          plugin: cliOptions.plugin,
          output: outputPath,
          target: cliOptions.target || ''
        };
        
        const result = await exportPlugin(exportOptions);
        console.log(`\n✅ ${result}`);
        console.log(`Output directory: ${outputPath}`);
        
      } catch (error: any) {
        console.error(`\n❌ Export failed: ${error.message}`);
        process.exit(1);
      }
    });

  program.parse();
}
