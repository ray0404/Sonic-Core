import { IAudioContext, IOfflineAudioContext, IAudioNode, IGainNode } from "standardized-audio-context";
import { TremoloPedal } from "../creative/guitar/pedals/TremoloPedal";

export class PedalTremoloNode {
    public context: IAudioContext | IOfflineAudioContext;
    public input: IGainNode<IAudioContext | IOfflineAudioContext>;
    public output: IGainNode<IAudioContext | IOfflineAudioContext>;
    private pedal: TremoloPedal;
    private _params: any = {
        rate: 4,
        depth: 50
    };

    constructor(context: IAudioContext | IOfflineAudioContext) {
        this.context = context;
        this.input = context.createGain();
        this.output = context.createGain();
        this.pedal = new TremoloPedal(context as unknown as BaseAudioContext);
        
        (this.input as any).connect(this.pedal.input);
        (this.pedal.output as any).connect(this.output);
    }

    setParam(param: string, value: any) {
        this._params[param] = value;
        const effectParams: any = {
            enableTremolo: true,
            tremoloRate: this._params.rate,
            tremoloDepth: this._params.depth
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
