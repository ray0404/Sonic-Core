import { IAudioContext, IOfflineAudioContext, IAudioNode, IGainNode } from "standardized-audio-context";
import { TunerEngine } from "../creative/tools/TunerEngine";

export class TunerNode {
    public context: IAudioContext | IOfflineAudioContext;
    public input: IGainNode<IAudioContext | IOfflineAudioContext>;
    private engine: TunerEngine;

    constructor(context: IAudioContext | IOfflineAudioContext) {
        this.context = context;
        this.input = context.createGain();
        this.engine = new TunerEngine();
        // Tuner uses microphone input usually.
        // If we want it to tune the SIGNAL flowing through it:
        // We need to connect this.input to the engine's analyser.
        
        // TunerEngine.ts uses MediaStreamSource.
        // We should add a method to TunerEngine to accept an AudioNode source.
    }

    setParam(param: string, value: any) {
        if (param === 'enabled' && value) {
            this.engine.init();
        }
    }

    connect(destination: IAudioNode<IAudioContext | IOfflineAudioContext>) {
        // Pass through
        this.input.connect(destination as any);
    }

    disconnect() {
        this.input.disconnect();
    }
}
