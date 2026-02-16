import { AudioWorkletNode, IAudioContext, IOfflineAudioContext, TAudioWorkletNodeConstructor } from "standardized-audio-context";

const AudioWorkletNodeBase = AudioWorkletNode as TAudioWorkletNodeConstructor;

export interface ZigCompressorOptions {
    threshold?: number;
    ratio?: number;
    attack?: number;
    release?: number;
    makeup?: number;
    mix?: number;
    mode?: number;
}
  
export class ZigCompressorNode extends AudioWorkletNodeBase<IAudioContext | IOfflineAudioContext> {
    constructor(context: IAudioContext | IOfflineAudioContext) {
        super(context, 'zig-compressor-processor');
    }

    static get parameterDescriptors() {
        return [
            { name: 'threshold', defaultValue: -24, minValue: -60, maxValue: 0 },
            { name: 'ratio', defaultValue: 4, minValue: 1, maxValue: 20 },
            { name: 'attack', defaultValue: 0.01, minValue: 0.0001, maxValue: 1 },
            { name: 'release', defaultValue: 0.1, minValue: 0.001, maxValue: 2 },
            { name: 'makeup', defaultValue: 0, minValue: 0, maxValue: 24 },
            { name: 'mix', defaultValue: 1, minValue: 0, maxValue: 1 },
            { name: 'mode', defaultValue: 0, minValue: 0, maxValue: 3 }
        ];
    }

    setParam(param: keyof ZigCompressorOptions, value: number) {
        const p = this.parameters.get(param);
        if (p) {
            p.setTargetAtTime(value, this.context.currentTime, 0.01);
        }
    }
}
