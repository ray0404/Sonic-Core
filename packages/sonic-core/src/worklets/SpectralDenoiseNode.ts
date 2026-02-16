import { AudioWorkletNode, IAudioContext, IOfflineAudioContext, TAudioWorkletNodeConstructor } from "standardized-audio-context";

const AudioWorkletNodeBase = AudioWorkletNode as TAudioWorkletNodeConstructor;

/**
 * Node for the SpectralDenoise effect.
 * Uses Zig-powered WASM for spectral noise reduction.
 */
export class SpectralDenoiseNode extends AudioWorkletNodeBase<IAudioContext | IOfflineAudioContext> {
    constructor(context: IAudioContext | IOfflineAudioContext) {
        super(context, 'spectral-denoise-processor');
    }

    setParam(_param: string, _value: number) {
        // No params for now
    }
}
