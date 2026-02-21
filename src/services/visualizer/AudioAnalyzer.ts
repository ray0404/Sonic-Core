// src/services/visualizer/AudioAnalyzer.ts
import { OfflineAudioContext } from 'standardized-audio-context';

/**
 * Decodes audio blob and performs FFT analysis at video frame intervals.
 * Returns an array of Float32Arrays, where each array represents the frequency data for a video frame.
 */
export class AudioAnalyzer {
    
    static async analyze(audioBlob: Blob, fps: number, fftSize: number = 256): Promise<Float32Array[]> {
        // 1. Decode Audio
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioContext = new AudioContext(); // Main thread context for decoding
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        const duration = audioBuffer.duration;
        const totalFrames = Math.floor(duration * fps);
        const analysisData: Float32Array[] = new Array(totalFrames);
        
        // 2. Setup Offline Context for Analysis
        // We use an OfflineAudioContext to process the audio faster than real-time
        const offlineCtx = new OfflineAudioContext(1, audioBuffer.length, audioBuffer.sampleRate);
        
        const source = offlineCtx.createBufferSource();
        source.buffer = audioBuffer;
        
        const analyser = offlineCtx.createAnalyser();
        analyser.fftSize = fftSize;
        analyser.smoothingTimeConstant = 0.5; // Smooth out jitter
        
        source.connect(analyser);
        analyser.connect(offlineCtx.destination);
        source.start(0);

        // 3. Schedule Analysis using suspend/resume
        // Note: standard OfflineAudioContext.suspend() takes time in seconds
        
        for (let i = 0; i < totalFrames; i++) {
            const time = i / fps;
            (offlineCtx as any).suspend(time).then(() => {
                const data = new Float32Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(new Uint8Array(analyser.frequencyBinCount)); // Flush
                analyser.getFloatFrequencyData(data);
                
                // Convert dB to normalized 0-1 range approx (-100dB to -30dB range typically)
                // Let's normalize: val = (db + 100) / 70 clamped 0-1
                const normalized = new Float32Array(data.length);
                for(let j=0; j<data.length; j++) {
                    const db = data[j];
                    let val = (db + 100) / 70; 
                    if(val < 0) val = 0;
                    if(val > 1) val = 1;
                    normalized[j] = val;
                }
                
                analysisData[i] = normalized;
            });
        }

        // 4. Run Rendering
        await offlineCtx.startRendering();
        
        return analysisData;
    }
}
