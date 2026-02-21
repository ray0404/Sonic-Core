import * as SAC from "standardized-audio-context";

const AudioWorkletNodeBase = SAC.AudioWorkletNode as SAC.TAudioWorkletNodeConstructor;

/**
 * Node for the MeteringNode effect.
 * Follows the Trinity Pattern.
 */
export class MeteringNode extends AudioWorkletNodeBase<SAC.IAudioContext | SAC.IOfflineAudioContext> {
    public momentary: number = -100;
    public shortTerm: number = -100;
  
    constructor(context: SAC.IAudioContext | SAC.IOfflineAudioContext) {
      super(context, 'lufs-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        outputChannelCount: [2]
      });
  
      this.port.onmessage = (event) => {
        if (event.data.type === 'meter') {
          this.momentary = event.data.momentary;
          this.shortTerm = event.data.shortTerm;
        }
      };
    }
  }
