import { IAudioContext, IOfflineAudioContext, IAudioNode, IGainNode } from "standardized-audio-context";
import { DrumEngine } from "../creative/tools/DrumEngine";

export class DrumMachineNode {
    public context: IAudioContext | IOfflineAudioContext;
    public output: IGainNode<IAudioContext | IOfflineAudioContext>;
    private engine: DrumEngine;

    constructor(context: IAudioContext | IOfflineAudioContext) {
        this.context = context;
        this.output = context.createGain();
        
        // DrumEngine expects to manage its own context or take one.
        // We updated it to have an 'init' but it creates context if missing.
        // We should modify DrumEngine to accept context in constructor or init.
        // For now, we'll try to inject it if possible or wrap it.
        
        // The ported DrumEngine has: audioContext: AudioContext | null = null;
        // We should probably modify DrumEngine to accept the context.
        
        this.engine = new DrumEngine((_step) => {
            // Callback for visualizer - might need to emit event
        });
        
        this.engine.audioContext = context as unknown as AudioContext;
        this.engine.init().then(() => {
             // Connect engine master bus to our output
             if (this.engine.masterBus) {
                 this.engine.masterBus.disconnect();
                 (this.engine.masterBus as any).connect(this.output);
             }
        });
    }

    setParam(param: string, value: any) {
        if (param === 'tempo') this.engine.setTempo(value);
        if (param === 'volume') this.output.gain.value = value;
        if (param === 'play') {
            if (value) this.engine.start();
            else this.engine.stop();
        }
        // TODO: Map other params
    }

    connect(destination: IAudioNode<IAudioContext | IOfflineAudioContext>) {
        this.output.connect(destination as any);
    }

    disconnect() {
        this.output.disconnect();
    }
}
