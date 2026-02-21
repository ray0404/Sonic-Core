import { IAudioContext, IOfflineAudioContext, IAudioNode, IGainNode } from "standardized-audio-context";
import { DelayPedal } from "../creative/guitar/pedals/DelayPedal";

export class PedalDelayNode {
    public context: IAudioContext | IOfflineAudioContext;
    public input: IGainNode<IAudioContext | IOfflineAudioContext>;
    public output: IGainNode<IAudioContext | IOfflineAudioContext>;
    private pedal: DelayPedal;
    private _params: any = {
        time: 0.3,
        feedback: 0.3
    };

    constructor(context: IAudioContext | IOfflineAudioContext) {
        this.context = context;
        this.input = context.createGain();
        this.output = context.createGain();
        this.pedal = new DelayPedal(context as unknown as BaseAudioContext);
        
        (this.input as any).connect(this.pedal.input);
        (this.pedal.output as any).connect(this.output);
    }

    setParam(param: string, value: any) {
        this._params[param] = value;
        const effectParams: any = {
            enableDelay: true,
            delayTime: this._params.time,
            delayFeedback: this._params.feedback
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
