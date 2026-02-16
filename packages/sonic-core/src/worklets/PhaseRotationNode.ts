import { AudioWorkletNode, IAudioContext, IOfflineAudioContext, TAudioWorkletNodeConstructor } from "standardized-audio-context";

const AudioWorkletNodeBase = AudioWorkletNode as TAudioWorkletNodeConstructor;

/**
 * Node for the PhaseRotation effect.
 * Uses Zig-powered WASM for phase rotation via all-pass filters.
 */
export class PhaseRotationNode extends AudioWorkletNodeBase<IAudioContext | IOfflineAudioContext> {
    constructor(context: IAudioContext | IOfflineAudioContext) {
        super(context, 'phase-rotation-processor');
    }

    setParam(_param: string, _value: number) {}
}
