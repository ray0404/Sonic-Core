import * as SAC from "standardized-audio-context";

const AudioWorkletNodeBase = SAC.AudioWorkletNode as SAC.TAudioWorkletNodeConstructor;

/**
 * Node for the PhaseRotation effect.
 * Uses Zig-powered WASM for phase rotation via all-pass filters.
 */
export class PhaseRotationNode extends AudioWorkletNodeBase<SAC.IAudioContext | SAC.IOfflineAudioContext> {
    constructor(context: SAC.IAudioContext | SAC.IOfflineAudioContext) {
        super(context, 'phase-rotation-processor');
    }

    setParam(_param: string, _value: number) {}
}
