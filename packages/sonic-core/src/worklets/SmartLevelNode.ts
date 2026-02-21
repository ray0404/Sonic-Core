import * as SAC from "standardized-audio-context";

const AudioWorkletNodeBase = SAC.AudioWorkletNode as SAC.TAudioWorkletNodeConstructor;

export interface SmartLevelOptions {
    targetLufs?: number;
    maxGainDb?: number;
    gateThresholdDb?: number;
}
  
/**
 * Node for the SmartLevel effect.
 * Uses Zig-powered WASM for level detection and gain calculation.
 */
export class SmartLevelNode extends AudioWorkletNodeBase<SAC.IAudioContext | SAC.IOfflineAudioContext> {
    constructor(context: SAC.IAudioContext | SAC.IOfflineAudioContext) {
        super(context, 'smart-level-processor');
    }

    static get parameterDescriptors() {
        return [
            { name: 'targetLufs', defaultValue: -14, minValue: -24, maxValue: -6 },
            { name: 'maxGainDb', defaultValue: 12, minValue: 0, maxValue: 24 },
            { name: 'gateThresholdDb', defaultValue: -60, minValue: -100, maxValue: -30 }
        ];
    }

    setParam(param: keyof SmartLevelOptions, value: number) {
        const p = this.parameters.get(param);
        if (p) {
            p.setTargetAtTime(value, this.context.currentTime, 0.05);
        }
    }
}
