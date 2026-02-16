class PhaseRotationProcessor extends AudioWorkletProcessor {
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

    process(inputs, outputs) {
        const input = inputs[0];
        const output = outputs[0];
        if (!input || !output || input.length === 0) return true;

        if (!this.isWasmReady) {
            for (let ch = 0; ch < input.length; ch++) output[ch].set(input[ch]);
            return true;
        }

        const { alloc, free, process_phase_rotation } = this.wasmInstance.exports;
        const frames = input[0].length;

        for (let ch = 0; ch < input.length; ch++) {
            const ptr = alloc(frames);
            if (ptr === 0) continue;

            try {
                const wasmView = new Float32Array(this.memory.buffer, ptr, frames);
                wasmView.set(input[ch]);

                process_phase_rotation(ptr, frames);

                const resView = new Float32Array(this.memory.buffer, ptr, frames);
                output[ch].set(resView);
            } finally {
                free(ptr, frames);
            }
        }

        return true;
    }
}

registerProcessor('phase-rotation-processor', PhaseRotationProcessor);
