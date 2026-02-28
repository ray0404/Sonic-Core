import { RackModule } from './types.js';

export interface DirectorManifest {
  rack: RackModule[];
  sampleRate?: number;
  bitDepth?: 16 | 24 | 32;
  format?: 'wav' | 'flac' | 'mp3';
  normalize?: {
    enabled: boolean;
    targetLufs: number;
    albumMode?: {
      weight: number; // 0.0 = Pure Album, 1.0 = Pure Track
      truePeakCeiling?: number; // e.g. -1.0
    };
  };
  spectralMatch?: {
    enabled: boolean;
    amount: number; // 0.0 to 1.0 (fractional match)
    albumProfile?: boolean; // Use album average as reference
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
