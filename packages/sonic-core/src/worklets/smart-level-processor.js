import { BiquadFilter } from './lib/dsp-helpers.js';

class SmartLevelProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'targetLufs', defaultValue: -14, minValue: -24, maxValue: -6 },
            { name: 'maxGainDb', defaultValue: 12, minValue: 0, maxValue: 24 },
            { name: 'gateThresholdDb', defaultValue: -60, minValue: -100, maxValue: -30 }
        ];
    }

    constructor() {
        super();
        this.sampleRate = sampleRate;
        
        // Detection Filter (approx K-weighting Stage 2: HPF @ 38Hz)
        this.filterL = new BiquadFilter();
        this.filterR = new BiquadFilter();
        this.filterL.setParams(38, 0, 0.707, sampleRate, 'highpass');
        this.filterR.setParams(38, 0, 0.707, sampleRate, 'highpass');

        // Sliding Window RMS (300ms)
        this.windowSize = Math.floor(0.3 * sampleRate);
        this.historyL = new Float32Array(this.windowSize);
        this.historyR = new Float32Array(this.windowSize);
        this.idx = 0;
        this.sumSqL = 0;
        this.sumSqR = 0;

        // Gain Smoothing
        this.currentGainDb = 0;
        this.lastRawGainDb = 0;

        // Time Constants
        // Attack: 500ms (Rise), Release: 1000ms (Fall)
        this.alphaAttack = 1.0 / (0.5 * sampleRate + 1.0);
        this.alphaRelease = 1.0 / (1.0 * sampleRate + 1.0);
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        if (!input || !output || input.length === 0) return true;

        const targetLufs = parameters.targetLufs[0];
        const maxGainDb = parameters.maxGainDb[0];
        const gateThresholdDb = parameters.gateThresholdDb[0];

        const inL = input[0];
        const inR = input.length > 1 ? input[1] : input[0];
        const outL = output[0];
        const outR = output.length > 1 ? output[1] : output[0];

        for (let i = 0; i < inL.length; i++) {
            const xL = inL[i];
            const xR = inR[i];

            // 1. Detection Filter
            const fL = this.filterL.process(xL);
            const fR = this.filterR.process(xR);

            // 2. Sliding RMS
            const sqL = fL * fL;
            const sqR = fR * fR;

            this.sumSqL = this.sumSqL + sqL - this.historyL[this.idx];
            this.sumSqR = this.sumSqR + sqR - this.historyR[this.idx];
            if (this.sumSqL < 0) this.sumSqL = 0;
            if (this.sumSqR < 0) this.sumSqR = 0;

            this.historyL[this.idx] = sqL;
            this.historyR[this.idx] = sqR;
            this.idx = (this.idx + 1) % this.windowSize;

            const meanSq = (this.sumSqL + this.sumSqR) / (2 * this.windowSize);
            const rms = Math.sqrt(meanSq);
            const rmsDb = 20 * Math.log10(rms + 1e-9);

            // 3. Gain Computer
            let rawGainDb = targetLufs - rmsDb;

            // Gating
            if (rmsDb < gateThresholdDb) {
                rawGainDb = this.lastRawGainDb;
            } else {
                // Clamping
                if (rawGainDb > maxGainDb) rawGainDb = maxGainDb;
                if (rawGainDb < -maxGainDb) rawGainDb = -maxGainDb;
                this.lastRawGainDb = rawGainDb;
            }

            // 4. Inertia (Smoothing)
            const alpha = rawGainDb > this.currentGainDb ? this.alphaAttack : this.alphaRelease;
            this.currentGainDb += alpha * (rawGainDb - this.currentGainDb);

            // 5. Apply
            const gain = Math.pow(10, this.currentGainDb / 20);
            outL[i] = xL * gain;
            if (output.length > 1) outR[i] = xR * gain;
        }

        return true;
    }
}

registerProcessor('smart-level-processor', SmartLevelProcessor);
