import { IAudioContext, IOfflineAudioContext, IAudioNode, IGainNode } from "standardized-audio-context";
import { ChorusPedal } from "../creative/guitar/pedals/ChorusPedal";

export class PedalChorusNode {
    public context: IAudioContext | IOfflineAudioContext;
    public input: IGainNode<IAudioContext | IOfflineAudioContext>;
    public output: IGainNode<IAudioContext | IOfflineAudioContext>;
    private pedal: ChorusPedal;
    private _params: any = {
        rate: 1.5,
        depth: 30
    };

    constructor(context: IAudioContext | IOfflineAudioContext) {
        this.context = context;
        this.input = context.createGain();
        this.output = context.createGain();
        this.pedal = new ChorusPedal(context as unknown as BaseAudioContext);
        
        (this.input as any).connect(this.pedal.input);
        (this.pedal.output as any).connect(this.output);
    }

    setParam(param: string, value: any) {
        this._params[param] = value;
        const effectParams: any = {
            enableChorus: true,
            chorusRate: this._params.rate,
            chorusDepth: this._params.depth
        };
        this.pedal.update(effectParams, this.context.currentTime);
    }

    connect(destination: IAudioNode<IAudioContext | IOfflineAudioContext>) {
        this.output.connect(destination as any);
    }

    disconnect() {
        this.output.disconnect();
    }
}
