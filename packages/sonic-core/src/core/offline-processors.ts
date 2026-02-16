
// --- Helper Classes (Ported from dsp-helpers.js) ---

export class BiquadFilter {
    private x1 = 0; private x2 = 0;
    private y1 = 0; private y2 = 0;
    private b0 = 0; private b1 = 0; private b2 = 0;
    private a1 = 0; private a2 = 0;

    constructor() {
        this.reset();
    }

    reset() {
        this.x1 = 0; this.x2 = 0;
        this.y1 = 0; this.y2 = 0;
    }

    setParams(frequency: number, gain: number, Q: number, sampleRate: number, type: string) {
        const w0 = (2 * Math.PI * frequency) / sampleRate;
        const cosw0 = Math.cos(w0);
        const alpha = Math.sin(w0) / (2 * Q);
        
        const A = Math.pow(10, gain / 40);
        let b0, b1, b2, a0, a1, a2;

        switch (type) {
            case 'lowpass':
                b0 = (1 - cosw0) / 2; b1 = 1 - cosw0; b2 = (1 - cosw0) / 2;
                a0 = 1 + alpha; a1 = -2 * cosw0; a2 = 1 - alpha;
                break;
            case 'highpass':
                b0 = (1 + cosw0) / 2; b1 = -(1 + cosw0); b2 = (1 + cosw0) / 2;
                a0 = 1 + alpha; a1 = -2 * cosw0; a2 = 1 - alpha;
                break;
            case 'peaking':
                b0 = 1 + alpha * A; b1 = -2 * cosw0; b2 = 1 - alpha * A;
                a0 = 1 + alpha / A; a1 = -2 * cosw0; a2 = 1 - alpha / A;
                break;
            case 'lowshelf':
                b0 = A * ((A + 1) - (A - 1) * cosw0 + 2 * Math.sqrt(A) * alpha);
                b1 = 2 * A * ((A - 1) - (A + 1) * cosw0);
                b2 = A * ((A + 1) - (A - 1) * cosw0 - 2 * Math.sqrt(A) * alpha);
                a0 = (A + 1) + (A - 1) * cosw0 + 2 * Math.sqrt(A) * alpha;
                a1 = -2 * ((A - 1) + (A + 1) * cosw0);
                a2 = (A + 1) + (A - 1) * cosw0 - 2 * Math.sqrt(A) * alpha;
                break;
            case 'highshelf':
                b0 = A * ((A + 1) + (A - 1) * cosw0 + 2 * Math.sqrt(A) * alpha);
                b1 = -2 * A * ((A - 1) + (A + 1) * cosw0);
                b2 = A * ((A + 1) + (A - 1) * cosw0 - 2 * Math.sqrt(A) * alpha);
                a0 = (A + 1) - (A - 1) * cosw0 + 2 * Math.sqrt(A) * alpha;
                a1 = 2 * ((A - 1) + (A + 1) * cosw0);
                a2 = (A + 1) + (A - 1) * cosw0 - 2 * Math.sqrt(A) * alpha;
                break;
            default:
                b0 = 1; b1 = 0; b2 = 0; a0 = 1; a1 = 0; a2 = 0;
        }

        this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0;
        this.a1 = a1 / a0; this.a2 = a2 / a0;
    }

    process(input: number): number {
        const output = this.b0 * input + this.b1 * this.x1 + this.b2 * this.x2
                     - this.a1 * this.y1 - this.a2 * this.y2;
        this.x2 = this.x1; this.x1 = input;
        this.y2 = this.y1; this.y1 = output;
        return output;
    }
}

// --- Offline Processors ---

export function applyBitCrusher(buffer: Float32Array, bits: number, normFreq: number, mix: number): Float32Array {
    const output = new Float32Array(buffer.length);
    const step = Math.pow(2, bits);
    let phasor = 0;
    let holdL = 0;
    let holdR = 0;

    for (let i = 0; i < buffer.length; i += 2) {
        phasor += normFreq;
        if (phasor >= 1.0) {
            phasor -= 1.0;
            holdL = Math.floor(buffer[i] * step) / step;
            holdR = Math.floor(buffer[i + 1] * step) / step;
        }
        output[i] = holdL * mix + buffer[i] * (1 - mix);
        output[i + 1] = holdR * mix + buffer[i + 1] * (1 - mix);
    }
    return output;
}

export function applySaturation(buffer: Float32Array, drive: number, type: number, outGainDb: number, mix: number): Float32Array {
    const output = new Float32Array(buffer.length);
    const gain = Math.pow(10, outGainDb / 20);
    const driveGain = 1.0 + drive;

    for (let i = 0; i < buffer.length; i++) {
        const x = buffer[i] * driveGain;
        let saturated = 0;

        if (type === 1) { // Tube
            saturated = (x >= 0) ? Math.tanh(x) : x / (1 + Math.abs(x));
        } else if (type === 2) { // Fuzz
            saturated = Math.max(-1, Math.min(1, x));
        } else { // Tape/Default
            saturated = Math.tanh(x);
        }

        const wet = saturated * gain;
        output[i] = buffer[i] * (1 - mix) + wet * mix;
    }
    return output;
}

export function applyDistortion(buffer: Float32Array, drive: number, type: number, outputGain: number, mix: number): Float32Array {
    // Similar to saturation but more aggressive
    const output = new Float32Array(buffer.length);
    const gain = Math.pow(10, outputGain / 20);
    const driveGain = 1.0 + drive * 5.0;

    for (let i = 0; i < buffer.length; i++) {
        const x = buffer[i] * driveGain;
        let dist = 0;
        if (type === 1) { // Hard Clipping
            dist = Math.max(-1, Math.min(1, x));
        } else if (type === 2) { // Rectifier
            dist = Math.abs(x);
        } else { // Soft Clipping
            dist = (2 / Math.PI) * Math.atan(x);
        }
        output[i] = buffer[i] * (1 - mix) + (dist * gain) * mix;
    }
    return output;
}

export function applyParametricEQ(
    buffer: Float32Array, 
    sampleRate: number,
    params: {
        lowFreq: number, lowGain: number,
        midFreq: number, midGain: number, midQ: number,
        highFreq: number, highGain: number
    }
): Float32Array {
    const output = new Float32Array(buffer.length);
    const filtersL = [new BiquadFilter(), new BiquadFilter(), new BiquadFilter()];
    const filtersR = [new BiquadFilter(), new BiquadFilter(), new BiquadFilter()];

    filtersL[0].setParams(params.lowFreq, params.lowGain, 0.707, sampleRate, 'lowshelf');
    filtersL[1].setParams(params.midFreq, params.midGain, params.midQ, sampleRate, 'peaking');
    filtersL[2].setParams(params.highFreq, params.highGain, 0.707, sampleRate, 'highshelf');

    filtersR[0].setParams(params.lowFreq, params.lowGain, 0.707, sampleRate, 'lowshelf');
    filtersR[1].setParams(params.midFreq, params.midGain, params.midQ, sampleRate, 'peaking');
    filtersR[2].setParams(params.highFreq, params.highGain, 0.707, sampleRate, 'highshelf');

    for (let i = 0; i < buffer.length; i += 2) {
        let sL = buffer[i];
        let sR = buffer[i + 1];

        for (let j = 0; j < 3; j++) {
            sL = filtersL[j].process(sL);
            sR = filtersR[j].process(sR);
        }

        output[i] = sL;
        output[i + 1] = sR;
    }
    return output;
}

export function applyCompressor(
    buffer: Float32Array,
    sampleRate: number,
    params: {
        threshold: number, ratio: number, attack: number, release: number, makeupGain: number, mix: number
    }
): { output: Float32Array, grEnvelope: Float32Array } {
    const output = new Float32Array(buffer.length);
    const grEnvelope = new Float32Array(buffer.length / 2);
    const makeup = Math.pow(10, params.makeupGain / 20);
    const attCoeff = Math.exp(-1.0 / (Math.max(0.0001, params.attack) * sampleRate));
    const relCoeff = Math.exp(-1.0 / (Math.max(0.001, params.release) * sampleRate));

    let gr = 0; // Current Gain Reduction in dB (linked)

    for (let i = 0; i < buffer.length; i += 2) {
        const sL = buffer[i];
        const sR = buffer[i + 1];

        // Level detection (max of L/R for linked compression)
        const absMax = Math.max(Math.abs(sL), Math.abs(sR));
        const envDb = 20 * Math.log10(absMax + 1e-6);

        let targetGR = 0;
        const overshoot = envDb - params.threshold;
        if (overshoot > 0) {
            targetGR = overshoot * (1 - 1 / Math.max(1, params.ratio));
        }

        // Ballistics
        if (targetGR > gr) {
            gr = attCoeff * gr + (1 - attCoeff) * targetGR;
        } else {
            gr = relCoeff * gr + (1 - relCoeff) * targetGR;
        }

        const gain = Math.pow(10, -gr / 20);
        
        output[i] = sL * (1 - params.mix) + (sL * gain * makeup) * params.mix;
        output[i + 1] = sR * (1 - params.mix) + (sR * gain * makeup) * params.mix;
        grEnvelope[i / 2] = gr;
    }
    return { output, grEnvelope };
}

export function applyLimiter(
    buffer: Float32Array,
    sampleRate: number,
    threshold: number,
    release: number
): { output: Float32Array, grEnvelope: Float32Array } {
    // 20:1 ratio, 1ms attack
    return applyCompressor(buffer, sampleRate, {
        threshold,
        ratio: 20,
        attack: 0.001,
        release,
        makeupGain: 0,
        mix: 1
    });
}

export function applyFeedbackDelay(
    buffer: Float32Array,
    sampleRate: number,
    delayTime: number,
    feedback: number,
    wet: number
): Float32Array {
    const output = new Float32Array(buffer.length);
    const delaySamples = Math.floor(delayTime * sampleRate);
    const delayBufferL = new Float32Array(delaySamples + 1);
    const delayBufferR = new Float32Array(delaySamples + 1);
    let ptr = 0;

    for (let i = 0; i < buffer.length; i += 2) {
        const sL = buffer[i];
        const sR = buffer[i + 1];

        const delayedL = delayBufferL[ptr];
        const delayedR = delayBufferR[ptr];

        delayBufferL[ptr] = sL + delayedL * feedback;
        delayBufferR[ptr] = sR + delayedR * feedback;

        output[i] = sL * (1 - wet) + delayedL * wet;
        output[i + 1] = sR * (1 - wet) + delayedR * wet;

        ptr = (ptr + 1) % delaySamples;
    }
    return output;
}

export function applyChorus(
    buffer: Float32Array,
    sampleRate: number,
    frequency: number,
    delayTime: number,
    depth: number,
    feedback: number,
    wet: number
): Float32Array {
    const output = new Float32Array(buffer.length);
    const maxDelaySamples = Math.floor((delayTime + depth) * sampleRate) + 100;
    const delayBufferL = new Float32Array(maxDelaySamples);
    const delayBufferR = new Float32Array(maxDelaySamples);
    let writePtr = 0;

    for (let i = 0; i < buffer.length; i += 2) {
        const sL = buffer[i];
        const sR = buffer[i + 1];

        // LFOs
        const t = (i / 2) / sampleRate;
        const lfoL = Math.sin(2 * Math.PI * frequency * t);
        const lfoR = Math.sin(2 * Math.PI * frequency * t + Math.PI / 2); // 90 deg phase shift

        const curDelayL = (delayTime + depth * lfoL) * sampleRate;
        const curDelayR = (delayTime + depth * lfoR) * sampleRate;

        // Read interpolated
        const readPtrL = (writePtr - curDelayL + maxDelaySamples) % maxDelaySamples;
        const readPtrR = (writePtr - curDelayR + maxDelaySamples) % maxDelaySamples;
        
        const iL = Math.floor(readPtrL);
        const fL = readPtrL - iL;
        const delayedL = delayBufferL[iL] * (1 - fL) + delayBufferL[(iL + 1) % maxDelaySamples] * fL;

        const iR = Math.floor(readPtrR);
        const fR = readPtrR - iR;
        const delayedR = delayBufferR[iR] * (1 - fR) + delayBufferR[(iR + 1) % maxDelaySamples] * fR;

        delayBufferL[writePtr] = sL + delayedL * feedback;
        delayBufferR[writePtr] = sR + delayedR * feedback;

        output[i] = sL * (1 - wet) + delayedL * wet;
        output[i + 1] = sR * (1 - wet) + delayedR * wet;

        writePtr = (writePtr + 1) % maxDelaySamples;
    }
    return output;
}

export function applyTremolo(
    buffer: Float32Array,
    sampleRate: number,
    frequency: number,
    depth: number,
    _spread: number,
    waveform: number,
    mix: number
): Float32Array {
    const output = new Float32Array(buffer.length);
    const twoPi = 2 * Math.PI;
    
    for (let i = 0; i < buffer.length; i += 2) {
        const t = (i / 2) / sampleRate;
        const phase = twoPi * frequency * t;
        
        let lfo: number;
        switch (Math.floor(waveform)) {
            case 1: // Triangle
                lfo = 2 * Math.abs((phase % twoPi) / twoPi - 0.5);
                break;
            case 2: // Sawtooth
                lfo = (phase % twoPi) / twoPi;
                break;
            case 3: // Square
                lfo = (phase % twoPi) < Math.PI ? 1 : 0;
                break;
            default: // Sine
                lfo = 0.5 + 0.5 * Math.sin(phase);
        }
        
        const gain = 1.0 - depth * lfo;
        output[i] = buffer[i] * (1 - mix) + buffer[i] * gain * mix;
        output[i + 1] = buffer[i + 1] * (1 - mix) + buffer[i + 1] * gain * mix;
    }
    return output;
}

export function applyPhaser(
    buffer: Float32Array,
    sampleRate: number,
    stages: number,
    frequency: number,
    baseFrequency: number,
    octaves: number,
    wet: number
): Float32Array {
    const output = new Float32Array(buffer.length);
    const filters: { x1: number, x2: number, y1: number, y2: number }[] = [];
    
    for (let s = 0; s < stages; s++) {
        filters.push({ x1: 0, x2: 0, y1: 0, y2: 0 });
    }
    
    for (let i = 0; i < buffer.length; i += 2) {
        let sL = buffer[i];
        let sR = buffer[i + 1];
        
        const t = (i / 2) / sampleRate;
        const lfo = baseFrequency + frequency * Math.sin(2 * Math.PI * t * 0.5);
        
        for (let s = 0; s < stages; s++) {
            const fc = lfo * Math.pow(2, s * octaves / stages);
            const w0 = (2 * Math.PI * fc) / sampleRate;
            const alpha = Math.sin(w0) / 2;
            
            const b0 = 1 + alpha;
            const b1 = -2 * Math.cos(w0);
            const b2 = 1 - alpha;
            const a0 = 1 + alpha / 1;
            const a1 = -2 * Math.cos(w0);
            const a2 = 1 - alpha / 1;
            
            const f = filters[s];
            const outL = (b0 * sL + b1 * f.x1 + b2 * f.x2 - a1 * f.y1 - a2 * f.y2) / a0;
            f.x2 = f.x1; f.x1 = sL;
            f.y2 = f.y1; f.y1 = outL;
            sL = outL;
            
            const outR = (b0 * sR + b1 * f.x1 + b2 * f.x2 - a1 * f.y1 - a2 * f.y2) / a0;
            f.x2 = f.x1; f.x1 = sR;
            f.y2 = f.y1; f.y1 = outR;
            sR = outR;
        }
        
        output[i] = buffer[i] * (1 - wet) + sL * wet;
        output[i + 1] = buffer[i + 1] * (1 - wet) + sR * wet;
    }
    return output;
}

export function applyAutowah(
    buffer: Float32Array,
    sampleRate: number,
    baseFrequency: number,
    sensitivity: number,
    octaves: number,
    Q: number,
    attack: number,
    release: number,
    wet: number
): Float32Array {
    const output = new Float32Array(buffer.length);
    let env = 0;
    const attCoeff = Math.exp(-1.0 / (attack * sampleRate));
    const relCoeff = Math.exp(-1.0 / (release * sampleRate));
    
    const fL = { x1: 0, x2: 0, y1: 0, y2: 0 };
    const fR = { x1: 0, x2: 0, y1: 0, y2: 0 };
    
    for (let i = 0; i < buffer.length; i += 2) {
        const sL = buffer[i];
        const sR = buffer[i + 1];
        
        const absMax = Math.max(Math.abs(sL), Math.abs(sR));
        const targetEnv = Math.min(1, absMax * sensitivity * 10);
        
        if (targetEnv > env) {
            env = attCoeff * env + (1 - attCoeff) * targetEnv;
        } else {
            env = relCoeff * env + (1 - relCoeff) * targetEnv;
        }
        
        const fc = baseFrequency * Math.pow(2, env * octaves);
        const w0 = (2 * Math.PI * fc) / sampleRate;
        const alpha = Math.sin(w0) / (2 * Q);
        
        const b0 = 1 + alpha;
        const b1 = -2 * Math.cos(w0);
        const b2 = 1 - alpha;
        const a0 = 1 + alpha;
        const a1 = -2 * Math.cos(w0);
        const a2 = 1 - alpha;
        
        const outL = (b0 * sL + b1 * fL.x1 + b2 * fL.x2 - a1 * fL.y1 - a2 * fL.y2) / a0;
        fL.x2 = fL.x1; fL.x1 = sL;
        fL.y2 = fL.y1; fL.y1 = outL;
        
        const outR = (b0 * sR + b1 * fR.x1 + b2 * fR.x2 - a1 * fR.y1 - a2 * fR.y2) / a0;
        fR.x2 = fR.x1; fR.x1 = sR;
        fR.y2 = fR.y1; fR.y1 = outR;
        
        output[i] = buffer[i] * (1 - wet) + outL * wet;
        output[i + 1] = buffer[i + 1] * (1 - wet) + outR * wet;
    }
    return output;
}

export function applyStereoImager(
    buffer: Float32Array,
    sampleRate: number,
    lowFreq: number,
    highFreq: number,
    widthLow: number,
    widthMid: number,
    widthHigh: number
): Float32Array {
    const output = new Float32Array(buffer.length);
    
    const lowFilterL = new BiquadFilter();
    const lowFilterR = new BiquadFilter();
    const highFilterL = new BiquadFilter();
    const highFilterR = new BiquadFilter();
    const midFilterL = new BiquadFilter();
    const midFilterR = new BiquadFilter();
    
    lowFilterL.setParams(lowFreq, 0, 0.707, sampleRate, 'lowpass');
    lowFilterR.setParams(lowFreq, 0, 0.707, sampleRate, 'lowpass');
    highFilterL.setParams(highFreq, 0, 0.707, sampleRate, 'highpass');
    highFilterR.setParams(highFreq, 0, 0.707, sampleRate, 'highpass');
    midFilterL.setParams((lowFreq + highFreq) / 2, 0, 0.707, sampleRate, 'bandpass');
    midFilterR.setParams((lowFreq + highFreq) / 2, 0, 0.707, sampleRate, 'bandpass');
    
    for (let i = 0; i < buffer.length; i += 2) {
        const sL = buffer[i];
        const sR = buffer[i + 1];
        
        const mid = (sL + sR) * 0.5;
        const side = (sL - sR) * 0.5;
        
        const lowL = lowFilterL.process(sL);
        const lowR = lowFilterR.process(sR);
        const highL = highFilterL.process(sL);
        const highR = highFilterR.process(sR);
        
        const sideLow = (lowL - lowR) * widthLow;
        const sideMid = side * widthMid;
        const sideHigh = (highL - highR) * widthHigh;
        
        output[i] = mid + sideLow + sideMid + sideHigh;
        output[i + 1] = mid - sideLow - sideMid - sideHigh;
    }
    return output;
}

export function applyTransientShaper(
    buffer: Float32Array,
    sampleRate: number,
    attackGain: number,
    sustainGain: number,
    mix: number
): Float32Array {
    const output = new Float32Array(buffer.length);
    const attackCoeff = Math.exp(-1.0 / (0.001 * sampleRate));
    const releaseCoeff = Math.exp(-1.0 / (0.05 * sampleRate));
    
    let env = 0;
    let isAttack = false;
    
    for (let i = 0; i < buffer.length; i += 2) {
        const sL = buffer[i];
        const sR = buffer[i + 1];
        
        const absMax = Math.max(Math.abs(sL), Math.abs(sR));
        
        if (absMax > env) {
            isAttack = true;
            env = attackCoeff * env + (1 - attackCoeff) * absMax;
        } else {
            isAttack = false;
            env = releaseCoeff * env + (1 - releaseCoeff) * absMax;
        }
        
        const gain = isAttack 
            ? Math.pow(10, attackGain / 20)
            : Math.pow(10, sustainGain / 20);
        
        output[i] = buffer[i] * (1 - mix) + buffer[i] * gain * mix;
        output[i + 1] = buffer[i + 1] * (1 - mix) + buffer[i + 1] * gain * mix;
    }
    return output;
}

export function applyMidSideEQ(
    buffer: Float32Array,
    sampleRate: number,
    midGain: number,
    midFreq: number,
    sideGain: number,
    sideFreq: number
): Float32Array {
    const output = new Float32Array(buffer.length);
    
    const midFilterL = new BiquadFilter();
    const midFilterR = new BiquadFilter();
    const sideFilterL = new BiquadFilter();
    const sideFilterR = new BiquadFilter();
    
    midFilterL.setParams(midFreq, midGain, 1.0, sampleRate, 'peaking');
    midFilterR.setParams(midFreq, midGain, 1.0, sampleRate, 'peaking');
    sideFilterL.setParams(sideFreq, sideGain, 1.0, sampleRate, 'peaking');
    sideFilterR.setParams(sideFreq, sideGain, 1.0, sampleRate, 'peaking');
    
    for (let i = 0; i < buffer.length; i += 2) {
        const sL = buffer[i];
        const sR = buffer[i + 1];
        
        const mid = (sL + sR) * 0.5;
        const side = (sL - sR) * 0.5;
        
        const processedMid = midFilterL.process(mid);
        const processedSide = sideFilterL.process(side);
        
        output[i] = (processedMid + processedSide);
        output[i + 1] = (processedMid - processedSide);
    }
    return output;
}

export function applyDynamicEQ(
    buffer: Float32Array,
    sampleRate: number,
    params: {
        frequency: number, Q: number, gain: number,
        threshold: number, ratio: number, attack: number, release: number
    }
): Float32Array {
    const output = new Float32Array(buffer.length);
    
    const filterL = new BiquadFilter();
    const filterR = new BiquadFilter();
    
    filterL.setParams(params.frequency, 0, params.Q, sampleRate, 'peaking');
    filterR.setParams(params.frequency, 0, params.Q, sampleRate, 'peaking');
    
    const attCoeff = Math.exp(-1.0 / (Math.max(0.0001, params.attack) * sampleRate));
    const relCoeff = Math.exp(-1.0 / (Math.max(0.001, params.release) * sampleRate));
    
    let gr = 0;
    
    for (let i = 0; i < buffer.length; i += 2) {
        const sL = buffer[i];
        const sR = buffer[i + 1];
        
        const absMax = Math.max(Math.abs(sL), Math.abs(sR));
        const envDb = 20 * Math.log10(absMax + 1e-6);
        
        let targetGR = 0;
        const overshoot = envDb - params.threshold;
        if (overshoot > 0) {
            targetGR = overshoot * (1 - 1 / Math.max(1, params.ratio));
        }
        
        if (targetGR > gr) {
            gr = attCoeff * gr + (1 - attCoeff) * targetGR;
        } else {
            gr = relCoeff * gr + (1 - relCoeff) * targetGR;
        }
        
        const currentGain = params.gain * (1 - gr / 20);
        
        filterL.setParams(params.frequency, currentGain, params.Q, sampleRate, 'peaking');
        filterR.setParams(params.frequency, currentGain, params.Q, sampleRate, 'peaking');
        
        output[i] = filterL.process(sL);
        output[i + 1] = filterR.process(sR);
    }
    return output;
}

export function applyDeesser(
    buffer: Float32Array,
    sampleRate: number,
    frequency: number,
    threshold: number,
    ratio: number,
    attack: number,
    release: number,
    _monitor: number
): Float32Array {
    const output = new Float32Array(buffer.length);
    
    const highpassFilter = new BiquadFilter();
    highpassFilter.setParams(frequency, 0, 5.0, sampleRate, 'highpass');
    
    const attCoeff = Math.exp(-1.0 / (attack * sampleRate));
    const relCoeff = Math.exp(-1.0 / (release * sampleRate));
    
    let gr = 0;
    
    for (let i = 0; i < buffer.length; i += 2) {
        const hpL = highpassFilter.process(buffer[i]);
        const hpR = highpassFilter.process(buffer[i + 1]);
        
        const env = Math.max(Math.abs(hpL), Math.abs(hpR));
        const envDb = 20 * Math.log10(env + 1e-6);
        
        let targetGR = 0;
        const overshoot = envDb - threshold;
        if (overshoot > 0) {
            targetGR = overshoot * (1 - 1 / ratio);
        }
        
        if (targetGR > gr) {
            gr = attCoeff * gr + (1 - attCoeff) * targetGR;
        } else {
            gr = relCoeff * gr + (1 - relCoeff) * targetGR;
        }
        
        const gain = Math.pow(10, -gr / 20);
        
        output[i] = buffer[i] * gain;
        output[i + 1] = buffer[i + 1] * gain;
    }
    return output;
}

export function applyMultibandCompressor(
    buffer: Float32Array,
    sampleRate: number,
    params: {
        lowFreq: number, highFreq: number,
        threshLow: number, ratioLow: number, gainLow: number,
        threshMid: number, ratioMid: number, gainMid: number,
        threshHigh: number, ratioHigh: number, gainHigh: number
    }
): Float32Array {
    const output = new Float32Array(buffer.length);
    
    const lowFilterL = new BiquadFilter();
    const lowFilterR = new BiquadFilter();
    const highFilterL = new BiquadFilter();
    const highFilterR = new BiquadFilter();
    const midFilterL = new BiquadFilter();
    const midFilterR = new BiquadFilter();
    
    lowFilterL.setParams(params.lowFreq, 0, 0.707, sampleRate, 'lowpass');
    lowFilterR.setParams(params.lowFreq, 0, 0.707, sampleRate, 'lowpass');
    highFilterL.setParams(params.highFreq, 0, 0.707, sampleRate, 'highpass');
    highFilterR.setParams(params.highFreq, 0, 0.707, sampleRate, 'highpass');
    midFilterL.setParams((params.lowFreq + params.highFreq) / 2, 0, 0.707, sampleRate, 'bandpass');
    midFilterR.setParams((params.lowFreq + params.highFreq) / 2, 0, 0.707, sampleRate, 'bandpass');
    
    function compress(signal: number, threshold: number, ratio: number, makeup: number): number {
        const db = 20 * Math.log10(Math.abs(signal) + 1e-6);
        if (db > threshold) {
            const overshoot = db - threshold;
            const compressed = threshold + overshoot / ratio;
            const gain = compressed - db + makeup;
            return signal * Math.pow(10, gain / 20);
        }
        return signal * Math.pow(10, makeup / 20);
    }
    
    for (let i = 0; i < buffer.length; i += 2) {
        const sL = buffer[i];
        const sR = buffer[i + 1];
        
        const lowL = lowFilterL.process(sL);
        const lowR = lowFilterR.process(sR);
        const midL = midFilterL.process(sL);
        const midR = midFilterR.process(sR);
        const highL = highFilterL.process(sL);
        const highR = highFilterR.process(sR);
        
        output[i] = compress(lowL, params.threshLow, params.ratioLow, params.gainLow) +
                    compress(midL, params.threshMid, params.ratioMid, params.gainMid) +
                    compress(highL, params.threshHigh, params.ratioHigh, params.gainHigh);
        output[i + 1] = compress(lowR, params.threshLow, params.ratioLow, params.gainLow) +
                        compress(midR, params.threshMid, params.ratioMid, params.gainMid) +
                        compress(highR, params.threshHigh, params.ratioHigh, params.gainHigh);
    }
    return output;
}
