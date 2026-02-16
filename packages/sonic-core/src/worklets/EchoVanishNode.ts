import { AudioWorkletNode, IAudioContext, IOfflineAudioContext, TAudioWorkletNodeConstructor } from "standardized-audio-context";

const AudioWorkletNodeBase = AudioWorkletNode as TAudioWorkletNodeConstructor;

export interface EchoVanishOptions {
    amount?: number;
    tailMs?: number;
}
  
/**
 * Node for the EchoVanish effect.
 * Uses Zig-powered WASM for echo reduction.
 */
export class EchoVanishNode extends AudioWorkletNodeBase<IAudioContext | IOfflineAudioContext> {
    constructor(context: IAudioContext | IOfflineAudioContext) {
        super(context, 'echo-vanish-processor');
    }

    static get parameterDescriptors() {
        return [
            { name: 'amount', defaultValue: 0.5, minValue: 0, maxValue: 1 },
            { name: 'tailMs', defaultValue: 500, minValue: 10, maxValue: 2000 }
        ];
    }

    setParam(param: keyof EchoVanishOptions, value: number) {
        const p = this.parameters.get(param);
        if (p) {
            p.setTargetAtTime(value, this.context.currentTime, 0.05);
        }
    }
}
