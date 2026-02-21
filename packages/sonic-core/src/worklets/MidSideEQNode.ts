import * as SAC from "standardized-audio-context";

const AudioWorkletNodeBase = SAC.AudioWorkletNode as SAC.TAudioWorkletNodeConstructor;

/**
 * Node for the MidSideEQNode effect.
 * Follows the Trinity Pattern.
 */
export class MidSideEQNode extends AudioWorkletNodeBase<SAC.IAudioContext | SAC.IOfflineAudioContext> {
    constructor(context: SAC.IAudioContext | SAC.IOfflineAudioContext) {
      super(context, 'midside-eq-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [2], // Stereo
        parameterData: {
          midGain: 0,
          midFreq: 1000,
          sideGain: 0,
          sideFreq: 1000
        }
      });
    }
  
    /** Updates a module parameter with smoothing. */
  setParam(paramName: 'midGain' | 'midFreq' | 'sideGain' | 'sideFreq', value: number) {
      const param = this.parameters.get(paramName);
      if (param) {
        param.setTargetAtTime(value, this.context.currentTime, 0.01);
      }
    }
  }
