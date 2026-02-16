class LufsNormalizerProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'targetLufs', defaultValue: -14, minValue: -24, maxValue: -6 }
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
            const { instance } = await WebAssembly.instantiate(bytes, { env: {} });
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

        const targetLufs = parameters.targetLufs[0];
        const { alloc, free, process_lufs_normalize } = this.wasmInstance.exports;
        const frames = input[0].length;

        // Process per channel
        for (let ch = 0; ch < input.length; ch++) {
            const inCh = input[ch];
            const outCh = output[ch];

            const ptr = alloc(frames);
            if (ptr !== 0) {
                const wasmView = new Float32Array(this.memory.buffer, ptr, frames);
                wasmView.set(inCh);

                process_lufs_normalize(ptr, frames, targetLufs);

                const resView = new Float32Array(this.memory.buffer, ptr, frames);
                outCh.set(resView);
                free(ptr, frames);
            } else {
                outCh.set(inCh);
            }
        }

        return true;
    }
}

registerProcessor('lufs-normalizer-processor', LufsNormalizerProcessor);
