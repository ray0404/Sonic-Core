import * as SAC from "standardized-audio-context";

const AudioWorkletNodeBase = SAC.AudioWorkletNode as SAC.TAudioWorkletNodeConstructor;

/**
 * Node for the TransientShaperNode effect.
 * Follows the Trinity Pattern.
 */
export class TransientShaperNode extends AudioWorkletNodeBase<SAC.IAudioContext | SAC.IOfflineAudioContext> {
    constructor(context: SAC.IAudioContext | SAC.IOfflineAudioContext) {
        super(context, 'transient-processor', {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            parameterData: {
                attackGain: 0,
                sustainGain: 0,
                mix: 1
            },
        });
    }

    /** Updates a module parameter with smoothing. */
  setParam(param: 'attackGain' | 'sustainGain' | 'mix', value: number) {
        const paramNode = this.parameters.get(param);
        if (paramNode) {
            paramNode.setTargetAtTime(value, this.context.currentTime, 0.01);
        }
    }
}
