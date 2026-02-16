import { RackModule } from './types.js';

export interface DirectorManifest {
  rack: RackModule[];
  sampleRate?: number;
  bitDepth?: 16 | 24 | 32;
  format?: 'wav' | 'flac' | 'mp3';
  normalize?: {
    enabled: boolean;
    targetLufs: number;
  };
}

export interface BatchProcessOptions {
  inputDir: string;
  outputDir: string;
  manifest: DirectorManifest;
  parallel?: number;
}

export interface FileProcessResult {
  inputPath: string;
  outputPath: string;
  success: boolean;
  error?: string;
  duration?: number;
}
