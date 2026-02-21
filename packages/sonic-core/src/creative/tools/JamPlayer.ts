import { JamBlueprint } from '../guitar/types';

export type JamGroove = 'Basic' | 'Rock' | 'Funk' | 'Jazz';

export class JamPlayer {
    audioContext: AudioContext | null = null;
    blueprint: JamBlueprint | null = null;
    isPlaying: boolean = false;
    currentChordIdx: number = -1;
    onChordChange: (idx: number) => void;
    tempo: number = 120;
    groove: JamGroove = 'Basic';
    nextNoteTime: number = 0;
    timerID: number | undefined;
    
    aiTracks: Record<string, AudioBuffer> = {};
    aiSources: Record<string, AudioBufferSourceNode> = {};
    trackVolumes: Record<string, number> = { drums: 1, bass: 1, chord: 1, melody: 1 };
    
    analyser: AnalyserNode | null = null;
    masterGain: GainNode | null = null;

    constructor(onChordChange: (idx: number) => void) {
        this.onChordChange = onChordChange;
    }

    async init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') await this.audioContext.resume();
        
        if (!this.masterGain) {
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
        }
        if (!this.analyser) {
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.masterGain.connect(this.analyser);
        }
    }

    connect(destination: AudioNode) {
        if (this.masterGain) {
            this.masterGain.disconnect();
            this.masterGain.connect(destination);
            if (this.analyser) {
                this.masterGain.connect(this.analyser);
            }
        }
    }

    async loadAiTrack(trackName: string, base64PCM: string) {
        await this.init();
        if (!this.audioContext) return;
        
        const byteCharacters = atob(base64PCM);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
        const byteArray = new Uint8Array(byteNumbers);
        
        try {
            const blob = new Blob([byteArray], { type: 'audio/wav' });
            const arrayBuffer = await blob.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.aiTracks[trackName] = audioBuffer;
        } catch (e) {
            console.warn("WAV decode failed, ignoring track", e);
        }
    }

    loadBlueprint(bp: JamBlueprint) {
        this.blueprint = bp;
        this.tempo = bp.tempo;
    }

    setTempo(t: number) { this.tempo = t; }
    setGroove(g: JamGroove) { this.groove = g; }
    setTrackVolume(track: string, vol: number) { 
        this.trackVolumes[track] = vol; 
    }

    async start() {
        await this.init();
        if (this.isPlaying || !this.audioContext || !this.blueprint) return;
        this.isPlaying = true;
        
        Object.keys(this.aiTracks).forEach(track => {
            if (this.trackVolumes[track] > 0) {
                this.playAiLoop(track);
            }
        });

        this.currentChordIdx = -1;
        this.nextNoteTime = this.audioContext.currentTime + 0.1;
        this.scheduler();
    }

    playAiLoop(track: string) {
        if (!this.audioContext || !this.aiTracks[track]) return;
        const source = this.audioContext.createBufferSource();
        source.buffer = this.aiTracks[track];
        source.loop = true;
        const gain = this.audioContext.createGain();
        gain.gain.value = this.trackVolumes[track];
        source.connect(gain).connect(this.masterGain!);
        source.start();
        this.aiSources[track] = source;
    }

    stop() {
        this.isPlaying = false;
        window.clearTimeout(this.timerID);
        this.onChordChange(-1);
        
        Object.values(this.aiSources).forEach(src => {
            try { src.stop(); } catch(e){}
        });
        this.aiSources = {};
    }

    private scheduler() {
        if (!this.audioContext) return;
        const secondsPerBeat = 60.0 / this.tempo;
        while (this.nextNoteTime < this.audioContext.currentTime + 0.1) {
             this.currentChordIdx = (this.currentChordIdx + 1) % (this.blueprint?.chordProgression.length || 1);
             this.scheduleChord(this.currentChordIdx, this.nextNoteTime);
             this.nextNoteTime += 4 * secondsPerBeat; 
        }
        this.timerID = window.setTimeout(() => this.scheduler(), 25);
    }

    private scheduleChord(idx: number, time: number) {
        const chord = this.blueprint?.chordProgression[idx];
        setTimeout(() => {
            if(this.isPlaying) this.onChordChange(idx);
        }, (time - this.audioContext!.currentTime) * 1000);
        
        if (this.trackVolumes['chord'] > 0 && chord) {
            const root = chord.charAt(0).toUpperCase();
            const freqs: any = { 'C': 261.6, 'D': 293.6, 'E': 329.6, 'F': 349.2, 'G': 392.0, 'A': 440.0, 'B': 493.8 };
            let f = freqs[root] || 440;
            if (chord.includes('#')) f *= 1.059;
            
            const isMinor = chord.includes('m');
            const third = f * (isMinor ? 1.189 : 1.259);
            const fifth = f * 1.498;
            
            [f, third, fifth].forEach((freq, _i) => {
                const osc = this.audioContext!.createOscillator();
                osc.type = 'triangle';
                osc.frequency.value = freq;
                const gain = this.audioContext!.createGain();
                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(0.1 * this.trackVolumes['chord'], time + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 2); 
                
                osc.connect(gain).connect(this.masterGain!);
                osc.start(time);
                osc.stop(time + 2.5);
            });
        }
    }
    
    getVisualizerData(array: Uint8Array) {
        if (this.analyser) this.analyser.getByteFrequencyData(array as any); // Cast for type compat
    }
}
