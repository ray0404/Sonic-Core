import { AudioWorkletNode, IAudioContext, IOfflineAudioContext, TAudioWorkletNodeConstructor } from "standardized-audio-context";

const AudioWorkletNodeBase = AudioWorkletNode as TAudioWorkletNodeConstructor;

export interface PsychoDynamicEQOptions {
    intensity?: number;
    refDb?: number;
}
  
/**
 * Node for the PsychoDynamicEQ effect.
 * Uses Zig-powered WASM for level-dependent psychoacoustic EQ.
 */
export class PsychoDynamicEQNode extends AudioWorkletNodeBase<IAudioContext | IOfflineAudioContext> {
    constructor(context: IAudioContext | IOfflineAudioContext) {
        super(context, 'psycho-dynamic-eq-processor');
    }

    static get parameterDescriptors() {
        return [
            { name: 'intensity', defaultValue: 0.5, minValue: 0, maxValue: 1 },
            { name: 'refDb', defaultValue: -24, minValue: -60, maxValue: 0 }
        ];
    }

    setParam(param: keyof PsychoDynamicEQOptions, value: number) {
        const p = this.parameters.get(param);
        if (p) {
            p.setTargetAtTime(value, this.context.currentTime, 0.05);
        }
    }
}
