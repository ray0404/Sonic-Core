import * as SAC from "standardized-audio-context";

const AudioWorkletNodeBase = SAC.AudioWorkletNode as SAC.TAudioWorkletNodeConstructor;

export interface MonoBassOptions {
    frequency?: number;
}
  
/**
 * Node for the MonoBass effect.
 * Uses Zig-powered WASM for summing low frequencies to mono.
 */
export class MonoBassNode extends AudioWorkletNodeBase<SAC.IAudioContext | SAC.IOfflineAudioContext> {
    constructor(context: SAC.IAudioContext | SAC.IOfflineAudioContext) {
        super(context, 'mono-bass-processor');
    }

    static get parameterDescriptors() {
        return [
            { name: 'frequency', defaultValue: 120, minValue: 20, maxValue: 500 }
        ];
    }

    setParam(param: keyof MonoBassOptions, value: number) {
        const p = this.parameters.get(param);
        if (p) {
            p.setTargetAtTime(value, this.context.currentTime, 0.05);
        }
    }
}
