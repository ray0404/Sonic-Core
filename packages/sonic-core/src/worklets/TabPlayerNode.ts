import { IAudioContext, IOfflineAudioContext, IAudioNode, IGainNode } from "standardized-audio-context";
import { TabEngine } from "../creative/tools/TabEngine";

export class TabPlayerNode {
    public context: IAudioContext | IOfflineAudioContext;
    public output: IGainNode<IAudioContext | IOfflineAudioContext>;
    private engine: TabEngine;

    constructor(context: IAudioContext | IOfflineAudioContext) {
        this.context = context;
        this.output = context.createGain();
        
        this.engine = new TabEngine(120, []); // Empty init
        this.engine.audioContext = context as unknown as AudioContext;
        
        this.engine.init().then(() => {
            // Connect engine master to our output
            // TabEngine has connect() method now!
            // But types might clash (standardized vs native).
            // We'll cast.
            this.engine.connect(this.output as unknown as AudioNode);
        });
    }

    setParam(param: string, value: any) {
        if (param === 'tempo') this.engine.tempo = value;
        if (param === 'mode') this.engine.setInstrumentMode(value === 0 ? 'acoustic' : value === 1 ? 'clean' : 'distorted');
        if (param === 'play') {
            if (value) this.engine.play();
            else this.engine.stop();
        }
        if (param === 'tabs') {
            this.engine.notes = value;
        }
    }

    connect(destination: IAudioNode<IAudioContext | IOfflineAudioContext>) {
        this.output.connect(destination as any);
    }

    disconnect() {
        this.output.disconnect();
    }
}
