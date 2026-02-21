import * as SAC from "standardized-audio-context";

const AudioWorkletNodeBase = SAC.AudioWorkletNode as SAC.TAudioWorkletNodeConstructor;

export interface ZigDeEsserOptions {
    frequency?: number;
    threshold?: number;
    ratio?: number;
    attack?: number;
    release?: number;
}
  
export class ZigDeEsserNode extends AudioWorkletNodeBase<SAC.IAudioContext | SAC.IOfflineAudioContext> {
    constructor(context: SAC.IAudioContext | SAC.IOfflineAudioContext) {
        super(context, 'zig-de-esser-processor');
    }

    static get parameterDescriptors() {
        return [
            { name: 'frequency', defaultValue: 6000, minValue: 2000, maxValue: 10000 },
            { name: 'threshold', defaultValue: -20, minValue: -60, maxValue: 0 },
            { name: 'ratio', defaultValue: 4, minValue: 1, maxValue: 20 },
            { name: 'attack', defaultValue: 0.005, minValue: 0.001, maxValue: 0.1 },
            { name: 'release', defaultValue: 0.05, minValue: 0.01, maxValue: 0.5 }
        ];
    }

    setParam(param: keyof ZigDeEsserOptions, value: number) {
        const p = this.parameters.get(param);
        if (p) {
            p.setTargetAtTime(value, this.context.currentTime, 0.01);
        }
    }
}
