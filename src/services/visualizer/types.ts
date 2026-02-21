export interface RenderProgress {
  stage: 'analyzing' | 'rendering' | 'encoding' | 'complete' | 'error';
  progress: number; // 0-1
  message?: string;
}

export interface RenderOptions {
  width: number;
  height: number;
  fps: number;
  bitrate: number; // kbps, e.g. 5000
}

export interface VisualizerTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  renderFrame: (ctx: OffscreenCanvasRenderingContext2D, width: number, height: number, fft: Float32Array, time: number) => void;
}

export interface EncodeJob {
  frames: Blob[]; // Array of image blobs (PNG/JPEG)
  audio: Blob;    // Audio blob (WAV/MP3)
  options: RenderOptions;
}
