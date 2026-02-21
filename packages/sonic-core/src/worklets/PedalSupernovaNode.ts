import { IAudioContext, IOfflineAudioContext, IAudioNode, IGainNode } from "standardized-audio-context";
import { SupernovaPedal } from "../creative/guitar/pedals/SupernovaPedal";

export class PedalSupernovaNode {
    public context: IAudioContext | IOfflineAudioContext;
    public input: IGainNode<IAudioContext | IOfflineAudioContext>;
    public output: IGainNode<IAudioContext | IOfflineAudioContext>;
    private pedal: SupernovaPedal;
    private _params: any = {
        drive: 50,
        tone: 50,
        level: 0.8
    };

    constructor(context: IAudioContext | IOfflineAudioContext) {
        this.context = context;
        this.input = context.createGain();
        this.output = context.createGain();
        this.pedal = new SupernovaPedal(context as unknown as BaseAudioContext);
        
        (this.input as any).connect(this.pedal.input);
        (this.pedal.output as any).connect(this.output);
    }

    setParam(param: string, value: any) {
        this._params[param] = value;
        const effectParams: any = {
            enableSupernova: true,
            supernovaDrive: this._params.drive,
            supernovaTone: this._params.tone,
            supernovaLevel: this._params.level
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
