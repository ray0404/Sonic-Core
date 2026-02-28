export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

export interface MeteringData {
  levels: number[];
  peakLevels: number[];
  rackReduction?: Record<string, number>;
  fftData?: Float32Array;
  stats?: {
    lufs: number;
    lra: number;
    crest: number;
    correlation: number;
    width: number;
    balance: number;
    specLow: number;
    specMid: number;
    specHigh: number;
  };
}

import type { RackModule, RackModuleType } from './types.ts';
import type { ModuleDescriptor } from './module-descriptors.ts';

export interface SonicEngine {
  init(): Promise<void>;
  getModuleDescriptors(): Promise<Record<string, ModuleDescriptor>>;
  loadAudio(buffer: ArrayBuffer | Buffer): Promise<void>;
  updateParam(moduleId: string, paramId: string, value: number): Promise<void>;
  addModule(type: RackModuleType): Promise<void>;
  removeModule(id: string): Promise<void>;
  reorderRack(start: number, end: number): Promise<void>;
  toggleModuleBypass(id: string): Promise<void>;
  togglePlay(): Promise<void>;
  stop(): Promise<void>;
  setMasterVolume(val: number): Promise<void>;
  seek(time: number): Promise<void>;
  getRack(): Promise<RackModule[]>;
  getPlaybackState(): Promise<PlaybackState>;
  getMetering(): Promise<MeteringData>;
  getSuggestions(): Promise<Omit<RackModule, 'id'>[]>;
  exportAudio(outputPath: string): Promise<boolean>;
  close(): Promise<void>;
}
