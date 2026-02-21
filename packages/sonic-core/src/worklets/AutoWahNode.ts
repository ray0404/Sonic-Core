import * as SAC from "standardized-audio-context";

const AudioWorkletNodeBase = SAC.AudioWorkletNode as SAC.TAudioWorkletNodeConstructor;

/**
 * Node for the AutoWahNode effect.
 * Follows the Trinity Pattern.
 */
export class AutoWahNode extends AudioWorkletNodeBase<SAC.IAudioContext | SAC.IOfflineAudioContext> {
    constructor(context: SAC.IAudioContext | SAC.IOfflineAudioContext) {
        super(context, 'autowah-processor', {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            parameterData: { baseFrequency: 100, sensitivity: 0.5, octaves: 4, Q: 2, attack: 0.01, release: 0.1, wet: 1 }
        });
    }
    /** Updates a module parameter with smoothing. */
  setParam(param: string, value: number) {
        const p = this.parameters.get(param);
        if (p) p.setTargetAtTime(value, this.context.currentTime, 0.01);
    }
}
