import * as SAC from "standardized-audio-context";

const AudioWorkletNodeBase = SAC.AudioWorkletNode as SAC.TAudioWorkletNodeConstructor;

export interface ZigSaturationOptions {
    drive?: number;
    type?: number;
    outputGain?: number;
    mix?: number;
}
  
export class ZigSaturationNode extends AudioWorkletNodeBase<SAC.IAudioContext | SAC.IOfflineAudioContext> {
    constructor(context: SAC.IAudioContext | SAC.IOfflineAudioContext) {
        super(context, 'zig-saturation-processor');
    }

    static get parameterDescriptors() {
        return [
            { name: 'drive', defaultValue: 0.5, minValue: 0, maxValue: 1 },
            { name: 'type', defaultValue: 0, minValue: 0, maxValue: 2 },
            { name: 'outputGain', defaultValue: 0, minValue: -24, maxValue: 24 },
            { name: 'mix', defaultValue: 1, minValue: 0, maxValue: 1 }
        ];
    }

    setParam(param: keyof ZigSaturationOptions, value: number) {
        const p = this.parameters.get(param);
        if (p) {
            p.setTargetAtTime(value, this.context.currentTime, 0.01);
        }
    }
}
