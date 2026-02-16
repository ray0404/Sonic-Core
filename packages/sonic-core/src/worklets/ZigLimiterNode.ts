import { AudioWorkletNode, IAudioContext, IOfflineAudioContext, TAudioWorkletNodeConstructor } from "standardized-audio-context";

const AudioWorkletNodeBase = AudioWorkletNode as TAudioWorkletNodeConstructor;

export interface ZigLimiterOptions {
    threshold?: number;
    release?: number;
}
  
export class ZigLimiterNode extends AudioWorkletNodeBase<IAudioContext | IOfflineAudioContext> {
    constructor(context: IAudioContext | IOfflineAudioContext) {
        super(context, 'zig-limiter-processor');
    }

    static get parameterDescriptors() {
        return [
            { name: 'threshold', defaultValue: -6, minValue: -60, maxValue: 0 },
            { name: 'release', defaultValue: 0.05, minValue: 0.001, maxValue: 2 }
        ];
    }

    setParam(param: keyof ZigLimiterOptions, value: number) {
        const p = this.parameters.get(param);
        if (p) {
            p.setTargetAtTime(value, this.context.currentTime, 0.01);
        }
    }
}
