import React, { useState } from 'react';
import { VideoExporter } from '@/services/visualizer/VideoExporter';
import { RenderProgress } from '@/services/visualizer/types';

export const VisualizerExport: React.FC = () => {
  const [status, setStatus] = useState<string>('Idle');
  const [progress, setProgress] = useState<number>(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const generateDummyContent = async () => {
    setStatus('Generating content...');
    const frames: Blob[] = [];
    const width = 640;
    const height = 360;
    const fps = 30;
    const duration = 2; // seconds

    // 1. Generate Frames
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    for (let i = 0; i < duration * fps; i++) {
      // Draw background
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, width, height);

      // Draw moving box
      ctx.fillStyle = `hsl(${(i * 5) % 360}, 50%, 50%)`;
      ctx.fillRect(i * 5, 100, 50, 50);

      // Text
      ctx.fillStyle = '#fff';
      ctx.font = '20px sans-serif';
      ctx.fillText(`Frame ${i}`, 20, 40);

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (blob) frames.push(blob);
    }

    // 2. Generate Audio (Silent 2s WAV)
    // Simplified WAV header for 2s silence
    // Actually, let's just make a very simple valid WAV blob
    // 44.1kHz, 16-bit, Mono
    const sampleRate = 44100;
    const numSamples = sampleRate * duration;
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);
    
    // RIFF
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, numSamples * 2, true);
    
    // Silence (0s)
    
    const audioBlob = new Blob([buffer], { type: 'audio/wav' });

    return { frames, audioBlob };
  };

  const handleExport = async () => {
    try {
      const { frames, audioBlob } = await generateDummyContent();
      
      setStatus('Initializing FFmpeg...');
      await VideoExporter.init();

      setStatus('Encoding...');
      const blob = await VideoExporter.encode(frames, audioBlob, {
        width: 640,
        height: 360,
        fps: 30,
        bitrate: 1000
      }, (p: RenderProgress) => {
        setStatus(`Stage: ${p.stage}`);
        setProgress(p.progress);
      });

      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setStatus('Complete!');
    } catch (e: any) {
      console.error(e);
      setStatus(`Error: ${e.message}`);
    }
  };

  return (
    <div className="p-4 bg-slate-800 text-white rounded-lg h-full overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Social Visualizer Export (Preview)</h2>
      
      <div className="mb-4 space-y-2">
        <p>Status: <span className="text-blue-400">{status}</span></p>
        <div className="w-full bg-slate-700 h-4 rounded overflow-hidden">
          <div 
            className="bg-blue-500 h-full transition-all duration-200"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="text-xs text-slate-400">{Math.round(progress * 100)}%</p>
      </div>

      <button
        onClick={handleExport}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-semibold disabled:opacity-50"
        disabled={status.startsWith('Encoding') || status.startsWith('Initializing')}
      >
        Test Render (2s Video)
      </button>

      {videoUrl && (
        <div className="mt-6">
          <h3 className="font-bold mb-2">Result:</h3>
          <video src={videoUrl} controls className="w-full max-w-md border border-slate-600 rounded" />
          <a 
            href={videoUrl} 
            download="visualizer_test.mp4"
            className="block mt-2 text-blue-400 hover:underline"
          >
            Download MP4
          </a>
        </div>
      )}
    </div>
  );
};

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
