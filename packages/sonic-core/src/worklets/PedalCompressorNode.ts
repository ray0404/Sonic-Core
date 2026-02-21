import { IAudioContext, IOfflineAudioContext, IAudioNode, IGainNode } from "standardized-audio-context";
import { CompressorPedal } from "../creative/guitar/pedals/CompressorPedal";

export class PedalCompressorNode {
    public context: IAudioContext | IOfflineAudioContext;
    public input: IGainNode<IAudioContext | IOfflineAudioContext>;
    public output: IGainNode<IAudioContext | IOfflineAudioContext>;
    private pedal: CompressorPedal;
    private _params: any = {
        threshold: -24,
        ratio: 4
    };

    constructor(context: IAudioContext | IOfflineAudioContext) {
        this.context = context;
        this.input = context.createGain();
        this.output = context.createGain();
        this.pedal = new CompressorPedal(context as unknown as BaseAudioContext);
        
        (this.input as any).connect(this.pedal.input);
        (this.pedal.output as any).connect(this.output);
    }

    setParam(param: string, value: any) {
        this._params[param] = value;
        const effectParams: any = {
            enableCompressor: true,
            compressorThreshold: this._params.threshold,
            compressorRatio: this._params.ratio
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
