import * as SAC from "standardized-audio-context";

const AudioWorkletNodeBase = SAC.AudioWorkletNode as SAC.TAudioWorkletNodeConstructor;

export interface DeBleedOptions {
    sensitivity?: number;
    threshold?: number;
}
  
/**
 * Node for the DeBleed effect.
 * Uses Zig-powered WASM for spectral bleed reduction.
 * Requires a sidechain input on the second input port.
 */
export class DeBleedNode extends AudioWorkletNodeBase<SAC.IAudioContext | SAC.IOfflineAudioContext> {
    constructor(context: SAC.IAudioContext | SAC.IOfflineAudioContext) {
        super(context, 'de-bleed-processor', {
            numberOfInputs: 2,
            numberOfOutputs: 1,
            outputChannelCount: [2]
        });
    }

    static get parameterDescriptors() {
        return [
            { name: 'sensitivity', defaultValue: 0.5, minValue: 0, maxValue: 1 },
            { name: 'threshold', defaultValue: -40, minValue: -100, maxValue: 0 }
        ];
    }

    setParam(param: keyof DeBleedOptions, value: number) {
        const p = this.parameters.get(param);
        if (p) {
            p.setTargetAtTime(value, this.context.currentTime, 0.05);
        }
    }
}
