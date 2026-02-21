import * as SAC from "standardized-audio-context";

const AudioWorkletNodeBase = SAC.AudioWorkletNode as SAC.TAudioWorkletNodeConstructor;

/**
 * Node for the FeedbackDelayNode effect.
 * Follows the Trinity Pattern.
 */
export class FeedbackDelayNode extends AudioWorkletNodeBase<SAC.IAudioContext | SAC.IOfflineAudioContext> {
    constructor(context: SAC.IAudioContext | SAC.IOfflineAudioContext) {
        super(context, 'feedback-delay-processor', {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            parameterData: { delayTime: 0.5, feedback: 0.3, wet: 0.5 }
        });
    }
    /** Updates a module parameter with smoothing. */
  setParam(param: string, value: number) {
        const p = this.parameters.get(param);
        if (p) p.setTargetAtTime(value, this.context.currentTime, 0.01);
    }
}
