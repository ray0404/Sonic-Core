import * as SAC from "standardized-audio-context";

const AudioWorkletNodeBase = SAC.AudioWorkletNode as SAC.TAudioWorkletNodeConstructor;

/**
 * Node for the SpectralDenoise effect.
 * Uses Zig-powered WASM for spectral noise reduction.
 */
export class SpectralDenoiseNode extends AudioWorkletNodeBase<SAC.IAudioContext | SAC.IOfflineAudioContext> {
    constructor(context: SAC.IAudioContext | SAC.IOfflineAudioContext) {
        super(context, 'spectral-denoise-processor');
    }

    setParam(_param: string, _value: number) {
        // No params for now
    }
}
