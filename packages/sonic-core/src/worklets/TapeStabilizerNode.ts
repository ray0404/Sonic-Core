import * as SAC from "standardized-audio-context";

const AudioWorkletNodeBase = SAC.AudioWorkletNode as SAC.TAudioWorkletNodeConstructor;

export interface TapeStabilizerOptions {
    nominalFreq?: number;
    scanMin?: number;
    scanMax?: number;
    amount?: number;
}
  
/**
 * Node for the TapeStabilizer effect.
 * Uses Zig-powered WASM for Wow & Flutter correction.
 */
export class TapeStabilizerNode extends AudioWorkletNodeBase<SAC.IAudioContext | SAC.IOfflineAudioContext> {
    constructor(context: SAC.IAudioContext | SAC.IOfflineAudioContext) {
        super(context, 'tape-stabilizer-processor');
    }

    static get parameterDescriptors() {
        return [
            { name: 'nominalFreq', defaultValue: 3150, minValue: 1000, maxValue: 5000 },
            { name: 'scanMin', defaultValue: 3000, minValue: 1000, maxValue: 5000 },
            { name: 'scanMax', defaultValue: 3300, minValue: 1000, maxValue: 5000 },
            { name: 'amount', defaultValue: 0.5, minValue: 0, maxValue: 1 }
        ];
    }

    setParam(param: keyof TapeStabilizerOptions, value: number) {
        const p = this.parameters.get(param);
        if (p) {
            p.setTargetAtTime(value, this.context.currentTime, 0.05);
        }
    }
}
