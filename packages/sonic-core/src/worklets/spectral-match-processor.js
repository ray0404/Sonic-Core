class SpectralMatchProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'amount', defaultValue: 0.5, minValue: 0, maxValue: 1 },
            { name: 'isLearning', defaultValue: 0, minValue: 0, maxValue: 1 }
        ];
    }

    constructor() {
        super();
        this.wasmInstance = null;
        this.memory = null;
        this.isWasmReady = false;
        this.initWasm();

        this.refAnalysisPtr = 0;
        this.captureBuffer = null;
        this.captureIdx = 0;
        this.wasLearning = false;
        
        // Capture 5 seconds of audio for reference (at 48k ~ 240,000 samples)
        this.maxCaptureSamples = 5 * sampleRate;
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

        const amount = parameters.amount[0];
        const isLearning = parameters.isLearning[0] > 0.5;
        const frames = input[0].length;

        const { alloc, free, spectralmatch_analyze_ref, spectralmatch_free_analysis, process_spectralmatch } = this.wasmInstance.exports;

        // 1. Handle Learning Transition
        if (isLearning && !this.wasLearning) {
            // Start Learning: Reset capture buffer
            this.captureBuffer = new Float32Array(this.maxCaptureSamples);
            this.captureIdx = 0;
            
            // Free old analysis if exists
            if (this.refAnalysisPtr) {
                spectralmatch_free_analysis(this.refAnalysisPtr);
                this.refAnalysisPtr = 0;
            }
        } 
        else if (!isLearning && this.wasLearning) {
            // End Learning: Perform Analysis
            if (this.captureIdx > 4096) { // Minimum required for FFT
                const validCapture = this.captureBuffer.subarray(0, this.captureIdx);
                const ptr = alloc(validCapture.length);
                if (ptr !== 0) {
                    new Float32Array(this.memory.buffer, ptr, validCapture.length).set(validCapture);
                    this.refAnalysisPtr = spectralmatch_analyze_ref(ptr, validCapture.length);
                    free(ptr, validCapture.length);
                }
            }
            this.captureBuffer = null; // Free memory
        }

        this.wasLearning = isLearning;

        // 2. Accumulate Capture
        if (isLearning && this.captureBuffer) {
            const inL = input[0];
            const remaining = this.maxCaptureSamples - this.captureIdx;
            const toCopy = Math.min(frames, remaining);
            
            if (toCopy > 0) {
                this.captureBuffer.set(inL.subarray(0, toCopy), this.captureIdx);
                this.captureIdx += toCopy;
            }
        }

        // 3. Process Audio
        for (let ch = 0; ch < input.length; ch++) {
            const inCh = input[ch];
            const outCh = output[ch];

            if (this.refAnalysisPtr && !isLearning) {
                const ptr = alloc(frames);
                if (ptr !== 0) {
                    const wasmView = new Float32Array(this.memory.buffer, ptr, frames);
                    wasmView.set(inCh);

                    process_spectralmatch(ptr, frames, this.refAnalysisPtr, amount, 0.5);

                    const resView = new Float32Array(this.memory.buffer, ptr, frames);
                    outCh.set(resView);
                    free(ptr, frames);
                } else {
                    outCh.set(inCh);
                }
            } else {
                outCh.set(inCh);
            }
        }

        return true;
    }
}

registerProcessor('spectral-match-processor', SpectralMatchProcessor);
