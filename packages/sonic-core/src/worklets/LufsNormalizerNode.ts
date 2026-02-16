import { AudioWorkletNode, IAudioContext, IOfflineAudioContext, TAudioWorkletNodeConstructor } from "standardized-audio-context";

const AudioWorkletNodeBase = AudioWorkletNode as TAudioWorkletNodeConstructor;

export interface LufsNormalizerOptions {
    targetLufs?: number;
}
  
export class LufsNormalizerNode extends AudioWorkletNodeBase<IAudioContext | IOfflineAudioContext> {
    constructor(context: IAudioContext | IOfflineAudioContext) {
        super(context, 'lufs-normalizer-processor');
    }

    static get parameterDescriptors() {
        return [
            { name: 'targetLufs', defaultValue: -14, minValue: -24, maxValue: -6 }
        ];
    }

    setParam(param: keyof LufsNormalizerOptions, value: number) {
        const p = this.parameters.get(param);
        if (p) {
            p.setTargetAtTime(value, this.context.currentTime, 0.05);
        }
    }
}
