class TapeStabilizerProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'nominalFreq', defaultValue: 3150, minValue: 1000, maxValue: 5000 },
            { name: 'scanMin', defaultValue: 3000, minValue: 1000, maxValue: 5000 },
            { name: 'scanMax', defaultValue: 3300, minValue: 1000, maxValue: 5000 },
            { name: 'amount', defaultValue: 0.5, minValue: 0, maxValue: 1 }
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
            // AudioWorklet can fetch in some environments, or we might need to pass the module via port.
            // For now, try fetching from root.
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
        } catch (e) {
            // console.error("WASM Load Failed in Worklet:", e);
        }
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        if (!input || !output || input.length === 0) return true;

        if (!this.isWasmReady) {
            // Pass through if WASM not ready
            for (let ch = 0; ch < input.length; ch++) {
                output[ch].set(input[ch]);
            }
            return true;
        }

        const nominalFreq = parameters.nominalFreq[0];
        const scanMin = parameters.scanMin[0];
        const scanMax = parameters.scanMax[0];
        const amount = parameters.amount[0];

        const { alloc, free, process_tapestabilizer } = this.wasmInstance.exports;
        const frames = input[0].length;
        const chanCount = input.length;
        const totalLen = frames * chanCount;

        // Allocate WASM memory
        const ptr = alloc(totalLen);
        if (ptr === 0) return true;

        try {
            const wasmView = new Float32Array(this.memory.buffer, ptr, totalLen);
            
            // Interleave inputs
            for (let i = 0; i < frames; i++) {
                for (let ch = 0; ch < chanCount; ch++) {
                    wasmView[i * chanCount + ch] = input[ch][i];
                }
            }

            // Process
            process_tapestabilizer(ptr, totalLen, sampleRate, nominalFreq, scanMin, scanMax, amount);

            // De-interleave outputs
            // Re-acquire view in case memory grew
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

registerProcessor('tape-stabilizer-processor', TapeStabilizerProcessor);
