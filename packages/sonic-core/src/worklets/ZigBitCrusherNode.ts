import * as SAC from "standardized-audio-context";

const AudioWorkletNodeBase = SAC.AudioWorkletNode as SAC.TAudioWorkletNodeConstructor;

export interface ZigBitCrusherOptions {
    bits?: number;
    normFreq?: number;
    mix?: number;
}
  
export class ZigBitCrusherNode extends AudioWorkletNodeBase<SAC.IAudioContext | SAC.IOfflineAudioContext> {
    constructor(context: SAC.IAudioContext | SAC.IOfflineAudioContext) {
        super(context, 'zig-bitcrusher-processor');
    }

    static get parameterDescriptors() {
        return [
            { name: 'bits', defaultValue: 8, minValue: 1, maxValue: 16 },
            { name: 'normFreq', defaultValue: 1, minValue: 0.01, maxValue: 1 },
            { name: 'mix', defaultValue: 1, minValue: 0, maxValue: 1 }
        ];
    }

    setParam(param: keyof ZigBitCrusherOptions, value: number) {
        const p = this.parameters.get(param);
        if (p) {
            p.setTargetAtTime(value, this.context.currentTime, 0.01);
        }
    }
}
