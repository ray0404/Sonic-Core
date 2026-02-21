import * as SAC from "standardized-audio-context";

const AudioWorkletNodeBase = SAC.AudioWorkletNode as SAC.TAudioWorkletNodeConstructor;

/**
 * Node for the TremoloNode effect.
 * Follows the Trinity Pattern.
 */
export class TremoloNode extends AudioWorkletNodeBase<SAC.IAudioContext | SAC.IOfflineAudioContext> {
    constructor(context: SAC.IAudioContext | SAC.IOfflineAudioContext) {
        super(context, 'tremolo-processor', {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            parameterData: { frequency: 4, depth: 0.5, spread: 0, waveform: 0, mix: 1 }
        });
    }
    /** Updates a module parameter with smoothing. */
  setParam(param: string, value: number) {
        const p = this.parameters.get(param);
        if (p) p.setTargetAtTime(value, this.context.currentTime, 0.01);
    }
}
