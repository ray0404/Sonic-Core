import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import type { RenderOptions } from '../services/visualizer/types';
import { renderWaveform, renderSpectrum } from '../services/visualizer/templates/index';

let ffmpeg: FFmpeg | null = null;
let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;

self.onmessage = async (e) => {
  const { type, payload } = e.data;

  try {
    switch (type) {
      case 'init':
        await initFFmpeg();
        self.postMessage({ type: 'ready' });
        break;
      case 'encode':
        // Legacy blob-based encode
        await encodeVideo(payload.frames, payload.audio, payload.options);
        break;
      case 'renderAndEncode':
        // New render-loop based encode
        await renderAndEncode(payload.audio, payload.options, payload.templateId);
        break;
      default:
        console.warn('Unknown message type:', type);
    }
  } catch (err: any) {
    self.postMessage({ type: 'error', error: err.message });
  }
};

async function initFFmpeg() {
  if (ffmpeg) return;

  ffmpeg = new FFmpeg();
  ffmpeg.on('log', ({ message }) => console.log('[FFmpeg]', message));
  ffmpeg.on('progress', ({ progress, time }) => self.postMessage({ type: 'progress', progress, time }));
  await ffmpeg.load();
}

// Helper to generate dummy analysis data (Step 2 placeholder)
function getMockAnalysisData(time: number, length: number): Float32Array {
    const data = new Float32Array(length);
    for (let i = 0; i < length; i++) {
        // Simple sine wave + noise
        data[i] = Math.sin(i * 0.1 + time * 10) * 0.5 + Math.random() * 0.1;
    }
    return data;
}

async function renderAndEncode(audioBlob: Blob, options: RenderOptions, templateId: string) {
    if (!ffmpeg) throw new Error('FFmpeg not initialized');
    const { width, height, fps } = options;
    
    // 1. Setup Canvas
    if (!canvas || canvas.width !== width || canvas.height !== height) {
        canvas = new OffscreenCanvas(width, height);
        ctx = canvas.getContext('2d');
    }
    if (!ctx) throw new Error('Failed to get canvas context');

    // 2. Prepare Audio
    console.log('Writing audio...');
    const audioName = 'input.wav';
    const audioData = await fetchFile(audioBlob);
    await ffmpeg.writeFile(audioName, audioData);

    // 3. Render Loop
    // Determine duration from audio size (rough estimate for PCM 16bit stereo 44.1k)
    // 1 sec = 44100 * 2 * 2 = 176400 bytes
    // This is just an estimate for the progress bar if we don't parse the header.
    // For now, let's render 5 seconds fixed for testing if duration isn't passed.
    const duration = 5; // TODO: Parse WAV header or pass duration
    const totalFrames = duration * fps;
    
    console.log(`Rendering ${totalFrames} frames for template ${templateId}...`);

    for (let i = 0; i < totalFrames; i++) {
        const time = i / fps;
        const data = getMockAnalysisData(time, 128); // 128 bins
        
        // Select Renderer
        if (templateId === 'spectrum') {
            renderSpectrum(ctx, width, height, data, time);
        } else {
            renderWaveform(ctx, width, height, data, time);
        }

        // Extract Frame
        const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.8 });
        const frameName = `frame_${String(i).padStart(4, '0')}.jpg`;
        const frameData = await fetchFile(blob);
        await ffmpeg.writeFile(frameName, frameData);

        if (i % 10 === 0) {
            self.postMessage({ 
                type: 'progress', 
                stage: 'rendering', 
                progress: i / totalFrames 
            });
        }
    }

    // 4. Encode
    console.log('Encoding...');
    const outputName = 'output.mp4';
    const cmd = [
        '-framerate', String(fps),
        '-i', 'frame_%04d.jpg',
        '-i', audioName,
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-t', String(duration), // Limit to duration
        outputName
    ];

    await ffmpeg.exec(cmd);

    // 5. Output
    const data = await ffmpeg.readFile(outputName);
    // Ensure we copy to a standard ArrayBuffer if it's shared, or just pass it if supported.
    // TS complains about SharedArrayBuffer in Blob, so we cast to any or copy.
    const resultBlob = new Blob([data as any], { type: 'video/mp4' });
    self.postMessage({ type: 'complete', blob: resultBlob });
}


async function encodeVideo(frames: Blob[], audio: Blob, options: RenderOptions) {
  if (!ffmpeg) throw new Error('FFmpeg not initialized');

  const { fps } = options;

  console.log('Writing frames...');
  for (let i = 0; i < frames.length; i++) {
    const frameName = `frame_${String(i).padStart(4, '0')}.png`;
    const data = await fetchFile(frames[i]);
    await ffmpeg.writeFile(frameName, data);
    
    if (i % 10 === 0) {
        self.postMessage({ 
            type: 'progress', 
            stage: 'writing',
            progress: (i / frames.length) * 0.5 
        });
    }
  }

  console.log('Writing audio...');
  const audioName = 'input.wav';
  await ffmpeg.writeFile(audioName, await fetchFile(audio));

  console.log('Encoding...');
  const outputName = 'output.mp4';
  
  const cmd = [
    '-framerate', String(fps),
    '-i', 'frame_%04d.png',
    '-i', audioName,
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-shortest',
    outputName
  ];

  await ffmpeg.exec(cmd);

  console.log('Reading output...');
  const data = await ffmpeg.readFile(outputName);
  const blob = new Blob([data as any], { type: 'video/mp4' });
  
  self.postMessage({ type: 'complete', blob });
}
