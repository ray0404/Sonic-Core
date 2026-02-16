import { AudioWorkletNode, IAudioContext, IOfflineAudioContext, TAudioWorkletNodeConstructor } from "standardized-audio-context";

const AudioWorkletNodeBase = AudioWorkletNode as TAudioWorkletNodeConstructor;

export interface SpectralMatchOptions {
    amount?: number;
    isLearning?: number; // 0 or 1
}
  
export class SpectralMatchNode extends AudioWorkletNodeBase<IAudioContext | IOfflineAudioContext> {
    constructor(context: IAudioContext | IOfflineAudioContext) {
        super(context, 'spectral-match-processor');
    }

    static get parameterDescriptors() {
        return [
            { name: 'amount', defaultValue: 0.5, minValue: 0, maxValue: 1 },
            { name: 'isLearning', defaultValue: 0, minValue: 0, maxValue: 1 }
        ];
    }

    setParam(param: keyof SpectralMatchOptions, value: number) {
        const p = this.parameters.get(param);
        if (p) {
            // isLearning should update immediately to start/stop capture
            const ramp = param === 'isLearning' ? 0 : 0.05;
            p.setTargetAtTime(value, this.context.currentTime, ramp);
        }
    }
}
