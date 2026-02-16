class ZigDeEsserProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'frequency', defaultValue: 6000, minValue: 2000, maxValue: 10000 },
            { name: 'threshold', defaultValue: -20, minValue: -60, maxValue: 0 },
            { name: 'ratio', defaultValue: 4, minValue: 1, maxValue: 20 },
            { name: 'attack', defaultValue: 0.005, minValue: 0.001, maxValue: 0.1 },
            { name: 'release', defaultValue: 0.05, minValue: 0.01, maxValue: 0.5 }
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

        const frequency = parameters.frequency[0];
        const threshold = parameters.threshold[0];
        const ratio = parameters.ratio[0];
        const attack = parameters.attack[0];
        const release = parameters.release[0];

        const { alloc, free, process_de_esser } = this.wasmInstance.exports;
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

            process_de_esser(ptr, totalLen, sampleRate, frequency, threshold, ratio, attack, release);

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

registerProcessor('zig-de-esser-processor', ZigDeEsserProcessor);
