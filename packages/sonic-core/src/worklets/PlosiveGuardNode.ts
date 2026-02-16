import { AudioWorkletNode, IAudioContext, IOfflineAudioContext, TAudioWorkletNodeConstructor } from "standardized-audio-context";

const AudioWorkletNodeBase = AudioWorkletNode as TAudioWorkletNodeConstructor;

export interface PlosiveGuardOptions {
    sensitivity?: number;
    strength?: number;
    cutoff?: number;
}
  
/**
 * Node for the PlosiveGuard effect.
 * Uses Zig-powered WASM for plosive detection and suppression.
 */
export class PlosiveGuardNode extends AudioWorkletNodeBase<IAudioContext | IOfflineAudioContext> {
    constructor(context: IAudioContext | IOfflineAudioContext) {
        super(context, 'plosive-guard-processor');
    }

    static get parameterDescriptors() {
        return [
            { name: 'sensitivity', defaultValue: 0.5, minValue: 0, maxValue: 1 },
            { name: 'strength', defaultValue: 0.5, minValue: 0, maxValue: 1 },
            { name: 'cutoff', defaultValue: 120, minValue: 80, maxValue: 200 }
        ];
    }

    setParam(param: keyof PlosiveGuardOptions, value: number) {
        const p = this.parameters.get(param);
        if (p) {
            p.setTargetAtTime(value, this.context.currentTime, 0.05);
        }
    }
}
