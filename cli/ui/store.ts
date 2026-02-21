import { create } from 'zustand';

// --- Types ---
export type View = 'MAIN' | 'RACK' | 'ADD_MODULE' | 'MODULE_EDIT' | 'LOAD_FILE' | 'EXPORT' | 'ANALYZER' | 'SMART_ASSIST';

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

export interface MeteringState {
  input: number;
  output: number;
  gainReduction: number;
  rack: Record<string, any>;
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

export interface ModuleDescriptor {
  type: string;
  params: {
    name: string;
    defaultValue: number;
    minValue: number;
    maxValue: number;
  }[];
}

export interface TUIState {
  view: View;
  rack: any[];
  playback: PlaybackState;
  metering: MeteringState;
  selectedModuleId: string | null;
  message: string;
  isExporting: boolean;
  moduleDescriptors: Record<string, ModuleDescriptor>;
  showAnalyzerStats: boolean;
  suggestions: any[] | null;
  
  // Actions
  setView: (view: View) => void;
  setRack: (rack: any[]) => void;
  setPlayback: (playback: PlaybackState) => void;
  setMetering: (metering: MeteringState) => void;
  setSelectedModuleId: (id: string | null) => void;
  setMessage: (message: string, duration?: number) => void;
  setIsExporting: (isExporting: boolean) => void;
  setModuleDescriptors: (descriptors: Record<string, ModuleDescriptor>) => void;
  setShowAnalyzerStats: (show: boolean) => void;
  setSuggestions: (suggestions: any[] | null) => void;
}

export const useTUIStore = create<TUIState>((set, get) => ({
  // --- State ---
  view: 'MAIN',
  rack: [],
  playback: { isPlaying: false, currentTime: 0, duration: 0 },
  metering: { input: -60, output: -60, gainReduction: 0, rack: {}, fftData: new Float32Array(0) },
  selectedModuleId: null,
  message: '',
  isExporting: false,
  moduleDescriptors: {},
  showAnalyzerStats: true,
  suggestions: null,

  // --- Actions ---
  setView: (view) => set({ view }),
  setRack: (rack) => set({ rack }),
  setPlayback: (playback) => set({ playback }),
  setMetering: (metering) => set({ metering }),
  setSelectedModuleId: (id) => set({ selectedModuleId: id }),
  setMessage: (message, duration) => {
    set({ message });
    if (duration) {
      setTimeout(() => {
        if (get().message === message) {
          set({ message: '' });
        }
      }, duration);
    }
  },
  setIsExporting: (isExporting) => set({ isExporting }),
  setModuleDescriptors: (descriptors) => set({ moduleDescriptors: descriptors }),
  setShowAnalyzerStats: (show) => set({ showAnalyzerStats: show }),
  setSuggestions: (suggestions) => set({ suggestions }),
}));
