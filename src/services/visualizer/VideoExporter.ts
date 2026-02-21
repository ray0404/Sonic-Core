import { RenderOptions, RenderProgress } from './types';

class VideoExporterService {
  private worker: Worker | null = null;
  private onProgressCallback: ((progress: RenderProgress) => void) | null = null;

  constructor() {
      // Lazy initialization in init()
  }

  public async init(): Promise<void> {
    if (this.worker) return;

    this.worker = new Worker(new URL('../../workers/video-encoder.worker.ts', import.meta.url), {
      type: 'module',
    });

    return new Promise((resolve, reject) => {
      const handler = (e: MessageEvent) => {
        const { type, error } = e.data;
        if (type === 'ready') {
          this.worker?.removeEventListener('message', handler);
          resolve();
        } else if (type === 'error') {
          this.worker?.removeEventListener('message', handler);
          reject(new Error(error));
        }
      };

      this.worker?.addEventListener('message', handler);
      this.worker?.postMessage({ type: 'init' });
    });
  }

  public async renderAndEncode(
      audio: Blob, 
      options: RenderOptions, 
      templateId: string, 
      analysisData?: Float32Array[],
      onProgress?: (p: RenderProgress) => void
  ): Promise<Blob> {
    if (!this.worker) await this.init();
    
    this.onProgressCallback = onProgress || null;

    return new Promise((resolve, reject) => {
      const handler = (e: MessageEvent) => {
        const { type, blob, error, progress, stage } = e.data;

        if (type === 'complete') {
          this.worker?.removeEventListener('message', handler);
          resolve(blob);
        } else if (type === 'error') {
          this.worker?.removeEventListener('message', handler);
          reject(new Error(error));
        } else if (type === 'progress') {
            if (this.onProgressCallback) {
                this.onProgressCallback({
                    stage: stage || 'rendering',
                    progress: progress || 0,
                    message: stage
                });
            }
        }
      };

      this.worker?.addEventListener('message', handler);
      this.worker?.postMessage({
        type: 'renderAndEncode',
        payload: { audio, options, templateId, analysisData }
      });
    });
  }

  public async encode(frames: Blob[], audio: Blob, options: RenderOptions, onProgress?: (p: RenderProgress) => void): Promise<Blob> {
    if (!this.worker) await this.init();
    
    this.onProgressCallback = onProgress || null;

    return new Promise((resolve, reject) => {
      const handler = (e: MessageEvent) => {
        const { type, blob, error, progress, stage } = e.data;

        if (type === 'complete') {
          this.worker?.removeEventListener('message', handler);
          resolve(blob);
        } else if (type === 'error') {
          this.worker?.removeEventListener('message', handler);
          reject(new Error(error));
        } else if (type === 'progress') {
            if (this.onProgressCallback) {
                this.onProgressCallback({
                    stage: stage || 'encoding',
                    progress: progress || 0,
                    message: stage
                });
            }
        }
      };

      this.worker?.addEventListener('message', handler);
      this.worker?.postMessage({
        type: 'encode',
        payload: { frames, audio, options }
      });
    });
  }

  public terminate() {
    this.worker?.terminate();
    this.worker = null;
  }
}

export const VideoExporter = new VideoExporterService();
