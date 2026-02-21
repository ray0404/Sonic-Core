import * as SAC from "standardized-audio-context";

const AudioWorkletNodeBase = SAC.AudioWorkletNode as SAC.TAudioWorkletNodeConstructor;

/**
 * Node for the PhaserNode effect.
 * Follows the Trinity Pattern.
 */
export class PhaserNode extends AudioWorkletNodeBase<SAC.IAudioContext | SAC.IOfflineAudioContext> {
    constructor(context: SAC.IAudioContext | SAC.IOfflineAudioContext) {
        super(context, 'phaser-processor', {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            parameterData: { stages: 4, frequency: 0.5, baseFrequency: 1000, octaves: 2, wet: 0.5 }
        });
    }
    /** Updates a module parameter with smoothing. */
  setParam(param: string, value: number) {
        const p = this.parameters.get(param);
        if (p) p.setTargetAtTime(value, this.context.currentTime, 0.01);
    }
}
