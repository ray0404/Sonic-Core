import { AudioWorkletNode, IAudioContext, IOfflineAudioContext, TAudioWorkletNodeConstructor } from "standardized-audio-context";

const AudioWorkletNodeBase = AudioWorkletNode as TAudioWorkletNodeConstructor;

export interface ZigTransientShaperOptions {
    attackGain?: number;
    sustainGain?: number;
    mix?: number;
}
  
export class ZigTransientShaperNode extends AudioWorkletNodeBase<IAudioContext | IOfflineAudioContext> {
    constructor(context: IAudioContext | IOfflineAudioContext) {
        super(context, 'zig-transient-shaper-processor');
    }

    static get parameterDescriptors() {
        return [
            { name: 'attackGain', defaultValue: 0, minValue: -24, maxValue: 24 },
            { name: 'sustainGain', defaultValue: 0, minValue: -24, maxValue: 24 },
            { name: 'mix', defaultValue: 1, minValue: 0, maxValue: 1 }
        ];
    }

    setParam(param: keyof ZigTransientShaperOptions, value: number) {
        const p = this.parameters.get(param);
        if (p) {
            p.setTargetAtTime(value, this.context.currentTime, 0.01);
        }
    }
}
