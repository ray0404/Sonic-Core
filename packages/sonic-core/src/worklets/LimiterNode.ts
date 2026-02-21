import * as SAC from "standardized-audio-context";

const AudioWorkletNodeBase = SAC.AudioWorkletNode as SAC.TAudioWorkletNodeConstructor;

/**
 * Node for the Mastering-grade Lookahead Limiter.
 * Bridges the LimiterProcessor (DSP) to the main thread.
 */
export class LimiterNode extends AudioWorkletNodeBase<SAC.IAudioContext | SAC.IOfflineAudioContext> {
    /** Current gain reduction in dB, reported from the audio thread. */
    public currentGainReduction: number = 0;
  
    /**
     * @param {IAudioContext | IOfflineAudioContext} context - The audio context.
     */
    constructor(context: SAC.IAudioContext | SAC.IOfflineAudioContext) {
      super(context, 'limiter-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [2], // Stereo
        parameterData: {
          threshold: -0.5,
          ceiling: -0.1,
          release: 0.1,
          lookahead: 5
        }
      });
  
      this.port.onmessage = (event) => {
        if (event.data.type === 'debug') {
          this.currentGainReduction = event.data.gainReduction;
        }
      };
    }
  
    /**
     * Updates a limiter parameter with smoothing.
     * @param {'threshold' | 'ceiling' | 'release' | 'lookahead'} paramName - The parameter to update.
     * @param {number} value - The new value.
     */
    /** Updates a module parameter with smoothing. */
  setParam(paramName: 'threshold' | 'ceiling' | 'release' | 'lookahead', value: number) {
      const param = this.parameters.get(paramName);
      if (param) {
        param.setTargetAtTime(value, this.context.currentTime, 0.01);
      }
    }
  }
