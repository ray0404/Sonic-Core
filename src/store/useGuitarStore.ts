import { create } from 'zustand';
import { EffectParams } from '@sonic-core/creative/guitar/types';

export interface GuitarState {
  params: EffectParams;
  setParam: <K extends keyof EffectParams>(key: K, value: EffectParams[K]) => void;
  setParams: (params: Partial<EffectParams>) => void;
  reset: () => void;
}

export const DEFAULT_GUITAR_PARAMS: EffectParams = {
  ampModel: 'clean',
  cabinetModel: 'modern-4x12',
  gain: 1.0,
  distortion: 0,
  eqLow: 0,
  eqMid: 0,
  eqHigh: 0,
  
  // 9-Band EQ
  eq63: 0, eq125: 0, eq250: 0, eq500: 0, eq1k: 0, eq2k: 0, eq4k: 0, eq8k: 0, eq16k: 0,

  enableCompressor: false,
  enableChorus: false,
  enableDelay: false,
  enableReverb: true,
  enableSupernova: false, 
  enableOverdrive: false,
  enableTremolo: false,

  compressorThreshold: -24,
  compressorRatio: 4,
  chorusRate: 1.5,
  chorusDepth: 0,
  reverbMix: 0.1,
  reverbDecay: 1.5,
  delayTime: 0.3,
  delayFeedback: 0.3,
  
  supernovaDrive: 20,
  supernovaTone: 50,
  supernovaLevel: 0.8,
  
  overdriveDrive: 30,
  overdriveTone: 50,
  overdriveLevel: 1.0,

  tremoloRate: 4,
  tremoloDepth: 50
};

export const useGuitarStore = create<GuitarState>((set) => ({
  params: DEFAULT_GUITAR_PARAMS,
  setParam: (key, value) => set((state) => ({ params: { ...state.params, [key]: value } })),
  setParams: (newParams) => set((state) => ({ params: { ...state.params, ...newParams } })),
  reset: () => set({ params: DEFAULT_GUITAR_PARAMS })
}));
