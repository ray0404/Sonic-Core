class ZigSaturationProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'drive', defaultValue: 0.5, minValue: 0, maxValue: 1 },
            { name: 'type', defaultValue: 0, minValue: 0, maxValue: 2 },
            { name: 'outputGain', defaultValue: 0, minValue: -24, maxValue: 24 },
            { name: 'mix', defaultValue: 1, minValue: 0, maxValue: 1 }
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

        const drive = parameters.drive[0];
        const type = Math.round(parameters.type[0]);
        const outputGain = parameters.outputGain[0];
        const mix = parameters.mix[0];

        const { alloc, free, process_saturation } = this.wasmInstance.exports;
        const frames = input[0].length;

        for (let ch = 0; ch < input.length; ch++) {
            const ptr = alloc(frames);
            if (ptr === 0) continue;

            try {
                const wasmView = new Float32Array(this.memory.buffer, ptr, frames);
                wasmView.set(input[ch]);

                process_saturation(ptr, frames, drive, type, outputGain, mix);

                const resView = new Float32Array(this.memory.buffer, ptr, frames);
                output[ch].set(resView);
            } finally {
                free(ptr, frames);
            }
        }

        return true;
    }
}

registerProcessor('zig-saturation-processor', ZigSaturationProcessor);
