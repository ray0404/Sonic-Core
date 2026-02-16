import { AudioWorkletNode, IAudioContext, IOfflineAudioContext, TAudioWorkletNodeConstructor } from "standardized-audio-context";

const AudioWorkletNodeBase = AudioWorkletNode as TAudioWorkletNodeConstructor;

export interface VoiceIsolateOptions {
    amount?: number;
}
  
/**
 * Node for the VoiceIsolate effect.
 * Uses Zig-powered WASM for AI-based voice isolation.
 */
export class VoiceIsolateNode extends AudioWorkletNodeBase<IAudioContext | IOfflineAudioContext> {
    constructor(context: IAudioContext | IOfflineAudioContext) {
        super(context, 'voice-isolate-processor');
    }

    static get parameterDescriptors() {
        return [
            { name: 'amount', defaultValue: 0.5, minValue: 0, maxValue: 1 }
        ];
    }

    setParam(param: keyof VoiceIsolateOptions, value: number) {
        const p = this.parameters.get(param);
        if (p) {
            p.setTargetAtTime(value, this.context.currentTime, 0.05);
        }
    }
}
