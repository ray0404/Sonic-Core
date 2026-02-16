class MonoBassProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'frequency', defaultValue: 120, minValue: 20, maxValue: 500 }
        ];
    }

    constructor() {
        super();
        this.wasmInstance = null;
        this.memory = null;
        this.isWasmReady = false;
        this.initWasm();
    }

    async initWasm() {
        try {
            const response = await fetch('/wasm/dsp.wasm');
            const bytes = await response.arrayBuffer();
            const { instance } = await WebAssembly.instantiate(bytes, {
                env: {
                    print: (ptr, len) => {
                        const view = new Uint8Array(instance.exports.memory.buffer, ptr, len);
                        const decoder = new TextDecoder();
                        console.log(decoder.decode(view));
                    }
                }
            });
            this.wasmInstance = instance;
            this.memory = instance.exports.memory;
            this.isWasmReady = true;
        } catch (e) {}
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        if (!input || !output || input.length === 0) return true;

        if (!this.isWasmReady) {
            for (let ch = 0; ch < input.length; ch++) output[ch].set(input[ch]);
            return true;
        }

        const frequency = parameters.frequency[0];
        const { alloc, free, process_mono_bass } = this.wasmInstance.exports;
        const frames = input[0].length;
        const chanCount = input.length;
        const totalLen = frames * chanCount;

        const ptr = alloc(totalLen);
        if (ptr === 0) return true;

        try {
            const wasmView = new Float32Array(this.memory.buffer, ptr, totalLen);
            
            // Interleave
            for (let i = 0; i < frames; i++) {
                for (let ch = 0; ch < chanCount; ch++) {
                    wasmView[i * chanCount + ch] = input[ch][i];
                }
            }

            process_mono_bass(ptr, totalLen, sampleRate, frequency);

            const resView = new Float32Array(this.memory.buffer, ptr, totalLen);
            for (let i = 0; i < frames; i++) {
                for (let ch = 0; ch < chanCount; ch++) {
                    output[ch][i] = resView[i * chanCount + ch];
                }
            }
        } finally {
            free(ptr, totalLen);
        }

        return true;
    }
}

registerProcessor('mono-bass-processor', MonoBassProcessor);
