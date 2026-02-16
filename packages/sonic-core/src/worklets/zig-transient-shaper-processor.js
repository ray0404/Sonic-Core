class ZigTransientShaperProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'attackGain', defaultValue: 0, minValue: -24, maxValue: 24 },
            { name: 'sustainGain', defaultValue: 0, minValue: -24, maxValue: 24 },
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

        const attackGain = parameters.attackGain[0];
        const sustainGain = parameters.sustainGain[0];
        const mix = parameters.mix[0];

        const { alloc, free, process_transient_shaper } = this.wasmInstance.exports;
        const frames = input[0].length;
        const chanCount = input.length;
        const totalLen = frames * chanCount;

        const ptr = alloc(totalLen);
        if (ptr === 0) return true;

        try {
            const wasmView = new Float32Array(this.memory.buffer, ptr, totalLen);
            for (let i = 0; i < frames; i++) {
                for (let ch = 0; ch < chanCount; ch++) {
                    wasmView[i * chanCount + ch] = input[ch][i];
                }
            }

            process_transient_shaper(ptr, totalLen, sampleRate, attackGain, sustainGain, mix);

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

registerProcessor('zig-transient-shaper-processor', ZigTransientShaperProcessor);
