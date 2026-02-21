import * as SAC from "standardized-audio-context";

const AudioWorkletNodeBase = SAC.AudioWorkletNode as SAC.TAudioWorkletNodeConstructor;

export interface DeClipOptions {
    threshold?: number;
}
  
/**
 * Node for the DeClip effect.
 * Uses Zig-powered WASM for declipping via cubic interpolation.
 */
export class DeClipNode extends AudioWorkletNodeBase<SAC.IAudioContext | SAC.IOfflineAudioContext> {
    constructor(context: SAC.IAudioContext | SAC.IOfflineAudioContext) {
        super(context, 'de-clip-processor');
    }

    static get parameterDescriptors() {
        return [
            { name: 'threshold', defaultValue: 0.99, minValue: 0.1, maxValue: 1.0 }
        ];
    }

    setParam(param: keyof DeClipOptions, value: number) {
        const p = this.parameters.get(param);
        if (p) {
            p.setTargetAtTime(value, this.context.currentTime, 0.05);
        }
    }
}
