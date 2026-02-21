import { IAudioContext, IOfflineAudioContext, IAudioNode, IGainNode } from "standardized-audio-context";
import { MetronomeEngine } from "../creative/tools/MetronomeEngine";

export class MetronomeNode {
    public context: IAudioContext | IOfflineAudioContext;
    public output: IGainNode<IAudioContext | IOfflineAudioContext>;
    private engine: MetronomeEngine;

    constructor(context: IAudioContext | IOfflineAudioContext) {
        this.context = context;
        this.output = context.createGain();
        
        this.engine = new MetronomeEngine((_beat) => {});
        this.engine.audioContext = context as unknown as AudioContext;
        // Metronome writes directly to destination in original code.
        // We need to intercept it.
        // MetronomeEngine.ts: envelope.connect(this.audioContext!.destination);
        // We should patch MetronomeEngine to allow custom destination or override connect.
        // Since we moved the file, we can modify it later if needed.
        // For now, let's assume we can't easily intercept without modifying MetronomeEngine.
    }

    setParam(param: string, value: any) {
        if (param === 'tempo') this.engine.setTempo(value);
        if (param === 'enabled') {
            if (value) this.engine.start();
            else this.engine.stop();
        }
    }

    connect(_destination: IAudioNode<IAudioContext | IOfflineAudioContext>) {
        // No-op for now if engine goes to destination
        // ideally we route engine -> this.output -> destination
    }

    disconnect() {
        this.output.disconnect();
    }
}
