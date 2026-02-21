// src/services/visualizer/templates/types.ts

// Re-export VisualizerTemplate from main types, or define specific template properties here.
// For now, let's keep it simple.

export interface RenderContext {
  canvas: OffscreenCanvas;
  ctx: OffscreenCanvasRenderingContext2D;
  width: number;
  height: number;
  data: Float32Array; // FFT or Waveform data
  time: number;
}

export type VisualizerRenderer = (ctx: OffscreenCanvasRenderingContext2D, width: number, height: number, data: Float32Array, time: number) => void;
