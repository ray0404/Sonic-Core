import React, { useState } from 'react';
import { VideoExporter } from '@/services/visualizer/VideoExporter';
import { RenderProgress } from '@/services/visualizer/types';

export const VisualizerExport: React.FC = () => {
  const [status, setStatus] = useState<string>('Idle');
  const [progress, setProgress] = useState<number>(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [template, setTemplate] = useState<string>('waveform');

  // Generate simple 2s silence for testing
  const generateDummyAudio = async () => {
      const sampleRate = 44100;
      const duration = 2;
      const numSamples = sampleRate * duration;
      const buffer = new ArrayBuffer(44 + numSamples * 2);
      const view = new DataView(buffer);
      
      // Minimal WAV Header
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

      return new Blob([buffer], { type: 'audio/wav' });
  };

  const handleExport = async () => {
    try {
      const audioBlob = await generateDummyAudio();
      
      setStatus('Initializing FFmpeg...');
      await VideoExporter.init();

      setStatus('Starting Render & Encode...');
      const blob = await VideoExporter.renderAndEncode(audioBlob, {
        width: 1080, // Portrait HD
        height: 1920,
        fps: 30,
        bitrate: 4000
      }, template, (p: RenderProgress) => {
        setStatus(`Stage: ${p.stage} - ${(p.progress * 100).toFixed(1)}%`);
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
      
      <div className="mb-6 space-y-4">
          <div>
              <label className="block text-sm font-medium mb-1 text-slate-400">Template</label>
              <select 
                value={template} 
                onChange={e => setTemplate(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              >
                  <option value="waveform">Neon Waveform</option>
                  <option value="spectrum">Spectrum Bars</option>
              </select>
          </div>
      </div>

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
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-semibold disabled:opacity-50 w-full"
        disabled={status.startsWith('Stage') || status.startsWith('Initializing') || status.startsWith('Starting')}
      >
        Render 5s Preview
      </button>

      {videoUrl && (
        <div className="mt-6">
          <h3 className="font-bold mb-2">Result:</h3>
          <video src={videoUrl} controls className="w-full max-w-xs mx-auto border border-slate-600 rounded aspect-[9/16]" />
          <a 
            href={videoUrl} 
            download="visualizer_test.mp4"
            className="block mt-2 text-center text-blue-400 hover:underline"
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
