class DeBleedProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'sensitivity', defaultValue: 0.5, minValue: 0, maxValue: 1 },
            { name: 'threshold', defaultValue: -40, minValue: -100, maxValue: 0 }
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
        const inputTarget = inputs[0];
        const inputSource = inputs[1]; // Sidechain
        const output = outputs[0];

        if (!inputTarget || !output || inputTarget.length === 0) return true;

        if (!this.isWasmReady || !inputSource || inputSource.length === 0) {
            for (let ch = 0; ch < inputTarget.length; ch++) output[ch].set(inputTarget[ch]);
            return true;
        }

        const sensitivity = parameters.sensitivity[0];
        const threshold = parameters.threshold[0];
        const { alloc, free, process_debleed } = this.wasmInstance.exports;
        const frames = inputTarget[0].length;

        // Process per channel
        for (let ch = 0; ch < inputTarget.length; ch++) {
            const targetCh = inputTarget[ch];
            const sourceCh = inputSource[ch] || inputSource[0]; // Fallback if sidechain has fewer channels

            const ptrT = alloc(frames);
            const ptrS = alloc(frames);
            if (ptrT === 0 || ptrS === 0) continue;

            try {
                const viewT = new Float32Array(this.memory.buffer, ptrT, frames);
                const viewS = new Float32Array(this.memory.buffer, ptrS, frames);
                viewT.set(targetCh);
                viewS.set(sourceCh);

                process_debleed(ptrT, ptrS, frames, sensitivity, threshold);

                const resView = new Float32Array(this.memory.buffer, ptrT, frames);
                output[ch].set(resView);
            } finally {
                free(ptrT, frames);
                free(ptrS, frames);
            }
        }

        return true;
    }
}

registerProcessor('de-bleed-processor', DeBleedProcessor);
