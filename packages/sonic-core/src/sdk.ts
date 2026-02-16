export class SonicForgeSDK {
  private wasmInstance: WebAssembly.Instance | null = null;
  private memory: WebAssembly.Memory | null = null;
  private wasmBinary: ArrayBuffer;

  constructor(wasmBinary: ArrayBuffer) {
    this.wasmBinary = wasmBinary;
  }

  async init() {
    const module = await WebAssembly.compile(this.wasmBinary);
    this.wasmInstance = await WebAssembly.instantiate(module, {
      env: {
        print: (ptr: number, len: number) => {
          const view = new Uint8Array(this.memory!.buffer, ptr, len);
          const decoder = new TextDecoder();
          console.log(decoder.decode(view));
        },
      }
    });
    this.memory = this.wasmInstance.exports.memory as WebAssembly.Memory;
  }

  /**
   * Universal processing wrapper for Zig DSP functions.
   * Handles allocation, memory copy, execution, and cleanup.
   */
  private processBuffer(
    channelData: Float32Array,
    processFn: (ptr: number, len: number, ...args: any[]) => void,
    ...extraArgs: any[]
  ): Float32Array {
    if (!this.wasmInstance || !this.memory) {
      throw new Error('SDK not initialized. Call init() first.');
    }

    const { alloc, free } = this.wasmInstance.exports as any;
    
    // 1. Allocate memory in WASM
    const ptr = alloc(channelData.length);
    
    try {
      // 2. Copy data to WASM
      const wasmSlice = new Float32Array(this.memory.buffer, ptr, channelData.length);
      wasmSlice.set(channelData);

      // 3. Process
      processFn(ptr, channelData.length, ...extraArgs);

      // 4. Return processed data (copying out of WASM memory)
      // Note: We must access memory.buffer again in case WASM memory grew during execution
      const outputView = new Float32Array(this.memory.buffer, ptr, channelData.length);
      return new Float32Array(outputView);
    } finally {
      // 5. Cleanup
      free(ptr, channelData.length);
    }
  }

  processDeclip(channelData: Float32Array, threshold: number): Float32Array {
    const { process_declip } = this.wasmInstance!.exports as any;
    return this.processBuffer(channelData, (ptr, len) => process_declip(ptr, len, threshold));
  }

  processLufsNormalize(channelData: Float32Array, targetLufs: number): Float32Array {
    const { process_lufs_normalize } = this.wasmInstance!.exports as any;
    return this.processBuffer(channelData, (ptr, len) => process_lufs_normalize(ptr, len, targetLufs));
  }

  processPhaseRotation(channelData: Float32Array): Float32Array {
    const { process_phase_rotation } = this.wasmInstance!.exports as any;
    return this.processBuffer(channelData, process_phase_rotation);
  }

  processSpectralDenoise(channelData: Float32Array, noiseProfile?: Float32Array): Float32Array {
    if (!this.wasmInstance || !this.memory) {
      throw new Error('SDK not initialized. Call init() first.');
    }
    const { alloc, free, process_spectral_denoise } = this.wasmInstance.exports as any;

    const len = channelData.length;
    const ptr = alloc(len);
    
    // Optional Noise Profile
    let noisePtr = 0;
    const noiseLen = noiseProfile ? noiseProfile.length : 0;
    if (noiseProfile && noiseLen > 0) {
        noisePtr = alloc(noiseLen);
        new Float32Array(this.memory.buffer, noisePtr, noiseLen).set(noiseProfile);
    }

    try {
      // Copy target data
      new Float32Array(this.memory.buffer, ptr, len).set(channelData);

      // Process
      process_spectral_denoise(ptr, len, noisePtr, noiseLen);

      // Read back result
      const outputView = new Float32Array(this.memory.buffer, ptr, len);
      return new Float32Array(outputView);
    } finally {
      free(ptr, len);
      if (noisePtr) {
        free(noisePtr, noiseLen);
      }
    }
  }

  processMonoBass(channelData: Float32Array, sampleRate: number, cutoffFreq: number): Float32Array {
    const { process_mono_bass } = this.wasmInstance!.exports as any;
    return this.processBuffer(channelData, (ptr, len) => process_mono_bass(ptr, len, sampleRate, cutoffFreq));
  }

  processPlosiveGuard(
    channelData: Float32Array,
    sampleRate: number,
    sensitivity: number,
    strength: number,
    cutoff: number
  ): Float32Array {
    const { process_plosiveguard } = this.wasmInstance!.exports as any;
    return this.processBuffer(channelData, (ptr, len) =>
      process_plosiveguard(ptr, len, sampleRate, sensitivity, strength, cutoff)
    );
  }

  processVoiceIsolate(channelData: Float32Array, amount: number): Float32Array {
    const { process_voiceisolate } = this.wasmInstance!.exports as any;
    return this.processBuffer(channelData, (ptr, len) => process_voiceisolate(ptr, len, amount));
  }

  processPsychodynamic(channelData: Float32Array, sampleRate: number, intensity: number, refDb: number): Float32Array {
    const { process_psychodynamic } = this.wasmInstance!.exports as any;
    return this.processBuffer(channelData, (ptr, len) => process_psychodynamic(ptr, len, sampleRate, intensity, refDb));
  }

  processSmartLevel(channelData: Float32Array, targetLufs: number, maxGainDb: number, gateThresholdDb: number): Float32Array {
    const { process_smartlevel } = this.wasmInstance!.exports as any;
    return this.processBuffer(channelData, (ptr, len) => process_smartlevel(ptr, len, targetLufs, maxGainDb, gateThresholdDb));
  }

  processDebleed(target: Float32Array, source: Float32Array, sensitivity: number, threshold: number): Float32Array {
    if (!this.wasmInstance || !this.memory) {
      throw new Error('SDK not initialized. Call init() first.');
    }
    const { alloc, free, process_debleed } = this.wasmInstance.exports as any;

    const len = target.length;
    if (source.length !== len) throw new Error('Target and Source length mismatch');

    const ptrTarget = alloc(len);
    const ptrSource = alloc(len);

    try {
      // Copy inputs
      new Float32Array(this.memory.buffer, ptrTarget, len).set(target);
      new Float32Array(this.memory.buffer, ptrSource, len).set(source);

      process_debleed(ptrTarget, ptrSource, len, sensitivity, threshold);

      // Read back result
      const resultView = new Float32Array(this.memory.buffer, ptrTarget, len);
      return new Float32Array(resultView);
    } finally {
      free(ptrTarget, len);
      free(ptrSource, len);
    }
  }

  processTapeStabilizer(
    channelData: Float32Array,
    sampleRate: number,
    nominalFreq: number,
    scanMin: number,
    scanMax: number,
    amount: number
  ): Float32Array {
    const { process_tapestabilizer } = this.wasmInstance!.exports as any;
    return this.processBuffer(channelData, (ptr, len) =>
      process_tapestabilizer(ptr, len, sampleRate, nominalFreq, scanMin, scanMax, amount)
    );
  }

  spectralMatchAnalyze(channelData: Float32Array): number {
    if (!this.wasmInstance || !this.memory) throw new Error('SDK not initialized');
    const { alloc, free, spectralmatch_analyze_ref } = this.wasmInstance.exports as any;
    const ptr = alloc(channelData.length);
    try {
      new Float32Array(this.memory.buffer, ptr, channelData.length).set(channelData);
      return spectralmatch_analyze_ref(ptr, channelData.length);
    } finally {
      free(ptr, channelData.length);
    }
  }

  spectralMatchFree(analysisPtr: number): void {
    const { spectralmatch_free_analysis } = this.wasmInstance!.exports as any;
    spectralmatch_free_analysis(analysisPtr);
  }

  processSpectralMatch(channelData: Float32Array, analysisPtr: number, amount: number): Float32Array {
    const { process_spectralmatch } = this.wasmInstance!.exports as any;
    return this.processBuffer(channelData, (ptr, len) => process_spectralmatch(ptr, len, analysisPtr, amount, 0.5));
  }

  processEchoVanish(channelData: Float32Array, sampleRate: number, amount: number, tailMs: number): Float32Array {
    const { process_echovanish } = this.wasmInstance!.exports as any;
    return this.processBuffer(channelData, (ptr, len) => process_echovanish(ptr, len, sampleRate, amount, tailMs));
  }

  processSaturation(channelData: Float32Array, drive: number, type: number, outGainDb: number, mix: number): Float32Array {
    const { process_saturation } = this.wasmInstance!.exports as any;
    return this.processBuffer(channelData, (ptr, len) => process_saturation(ptr, len, drive, type, outGainDb, mix));
  }

  processDistortion(channelData: Float32Array, drive: number, type: number, outputGain: number, mix: number): Float32Array {
    const { process_distortion } = this.wasmInstance!.exports as any;
    return this.processBuffer(channelData, (ptr, len) => process_distortion(ptr, len, drive, type, outputGain, mix));
  }

  processBitcrusher(channelData: Float32Array, bits: number, normFreq: number, mix: number): Float32Array {
    const { process_bitcrusher } = this.wasmInstance!.exports as any;
    return this.processBuffer(channelData, (ptr, len) => process_bitcrusher(ptr, len, bits, normFreq, mix));
  }

  processDithering(channelData: Float32Array, bits: number): Float32Array {
    const { process_dithering } = this.wasmInstance!.exports as any;
    return this.processBuffer(channelData, (ptr, len) => process_dithering(ptr, len, bits));
  }

  processParametricEQ(
    channelData: Float32Array,
    sampleRate: number,
    params: { lowFreq: number, lowGain: number, midFreq: number, midGain: number, midQ: number, highFreq: number, highGain: number }
  ): Float32Array {
    const { process_parametric_eq } = this.wasmInstance!.exports as any;
    return this.processBuffer(channelData, (ptr, len) => process_parametric_eq(
        ptr, len, sampleRate,
        params.lowFreq, params.lowGain, params.midFreq, params.midGain, params.midQ, params.highFreq, params.highGain
    ));
  }

  processMidSideEQ(
    channelData: Float32Array,
    sampleRate: number,
    params: { midGain: number, midFreq: number, sideGain: number, sideFreq: number }
  ): Float32Array {
    const { process_midside_eq } = this.wasmInstance!.exports as any;
    return this.processBuffer(channelData, (ptr, len) => process_midside_eq(
        ptr, len, sampleRate, params.midGain, params.midFreq, params.sideGain, params.sideFreq
    ));
  }

  processStereoImager(
    channelData: Float32Array,
    sampleRate: number,
    params: { lowFreq: number, highFreq: number, widthLow: number, widthMid: number, widthHigh: number }
  ): Float32Array {
    const { process_stereo_imager } = this.wasmInstance!.exports as any;
    return this.processBuffer(channelData, (ptr, len) => process_stereo_imager(
        ptr, len, sampleRate, params.lowFreq, params.highFreq, params.widthLow, params.widthMid, params.widthHigh
    ));
  }

  processTremolo(channelData: Float32Array, sampleRate: number, frequency: number, depth: number, waveform: number, mix: number): Float32Array {
    const { process_tremolo } = this.wasmInstance!.exports as any;
    return this.processBuffer(channelData, (ptr, len) => process_tremolo(ptr, len, sampleRate, frequency, depth, Math.floor(waveform), mix));
  }

  processPhaser(
    channelData: Float32Array,
    sampleRate: number,
    params: { stages: number, frequency: number, baseFrequency: number, octaves: number, wet: number }
  ): Float32Array {
    const { process_phaser } = this.wasmInstance!.exports as any;
    return this.processBuffer(channelData, (ptr, len) => process_phaser(
        ptr, len, sampleRate, Math.floor(params.stages), params.frequency, params.baseFrequency, params.octaves, params.wet
    ));
  }

  processCompressor(
    channelData: Float32Array,
    sampleRate: number,
    params: { threshold: number, ratio: number, attack: number, release: number, makeupGain: number, mix: number }
  ): Float32Array {
    const { process_compressor } = this.wasmInstance!.exports as any;
    return this.processBuffer(channelData, (ptr, len) => process_compressor(
        ptr, len, sampleRate, params.threshold, params.ratio, params.attack, params.release, params.makeupGain, params.mix
    ));
  }

  processLimiter(channelData: Float32Array, sampleRate: number, threshold: number, release: number): Float32Array {
    const { process_limiter } = this.wasmInstance!.exports as any;
    return this.processBuffer(channelData, (ptr, len) => process_limiter(ptr, len, sampleRate, threshold, release));
  }

  processDeesser(
    channelData: Float32Array,
    sampleRate: number,
    params: { frequency: number, threshold: number, ratio: number, attack: number, release: number }
  ): Float32Array {
    const { process_de_esser } = this.wasmInstance!.exports as any;
    return this.processBuffer(channelData, (ptr, len) => process_de_esser(
        ptr, len, sampleRate, params.frequency, params.threshold, params.ratio, params.attack, params.release
    ));
  }

  processTransientShaper(
    channelData: Float32Array,
    sampleRate: number,
    params: { attackGain: number, sustainGain: number, mix: number }
  ): Float32Array {
    const { process_transient_shaper } = this.wasmInstance!.exports as any;
    return this.processBuffer(channelData, (ptr, len) => process_transient_shaper(
        ptr, len, sampleRate, params.attackGain, params.sustainGain, params.mix
    ));
  }

  processChorus(
    channelData: Float32Array,
    sampleRate: number,
    params: { frequency: number, delayTime: number, depth: number, feedback: number, wet: number }
  ): Float32Array {
    const { process_chorus } = this.wasmInstance!.exports as any;
    return this.processBuffer(channelData, (ptr, len) => process_chorus(
        ptr, len, sampleRate, params.frequency, params.delayTime, params.depth, params.feedback, params.wet
    ));
  }

  processFeedbackDelay(
    channelData: Float32Array,
    sampleRate: number,
    params: { delayTime: number, feedback: number, wet: number }
  ): Float32Array {
    const { process_feedback_delay } = this.wasmInstance!.exports as any;
    return this.processBuffer(channelData, (ptr, len) => process_feedback_delay(
        ptr, len, sampleRate, params.delayTime, params.feedback, params.wet
    ));
  }

  analyzeAudio(interleavedData: Float32Array, channelCount: number, sampleRate: number): Float32Array {
    if (!this.wasmInstance || !this.memory) throw new Error('SDK not initialized');
    const { alloc, free, analyze_audio_comprehensive } = this.wasmInstance.exports as any;

    const len = interleavedData.length;
    const inputPtr = alloc(len);
    const outLen = 14;
    const outputPtr = alloc(outLen);

    try {
        const inputView = new Float32Array(this.memory.buffer, inputPtr, len);
        inputView.set(interleavedData);

        analyze_audio_comprehensive(inputPtr, len, channelCount, sampleRate, outputPtr);

        const outputView = new Float32Array(this.memory.buffer, outputPtr, outLen);
        return new Float32Array(outputView);
    } finally {
        free(inputPtr, len);
        free(outputPtr, outLen);
    }
  }

  analyzeTonalHealth(fftMagnitudes: Float32Array, sampleRate: number): Float32Array {
    if (!this.wasmInstance || !this.memory) throw new Error('SDK not initialized');
    const { alloc, free, analyze_tonal_health } = this.wasmInstance.exports as any;

    const numBins = fftMagnitudes.length;
    const inputPtr = alloc(numBins);
    const outLen = 5;
    const outputPtr = alloc(outLen);

    try {
        new Float32Array(this.memory.buffer, inputPtr, numBins).set(fftMagnitudes);
        analyze_tonal_health(inputPtr, numBins, sampleRate, outputPtr);
        return new Float32Array(new Float32Array(this.memory.buffer, outputPtr, outLen));
    } finally {
        free(inputPtr, numBins);
        free(outputPtr, outLen);
    }
  }

  getFFTMagnitudes(channelData: Float32Array): Float32Array {
    if (!this.wasmInstance || !this.memory) throw new Error('SDK not initialized');
    const { alloc, free, process_fft_magnitudes } = this.wasmInstance.exports as any;

    const len = channelData.length;
    const outLen = len / 2;
    const inputPtr = alloc(len);
    const outputPtr = alloc(outLen);

    try {
        const inputView = new Float32Array(this.memory.buffer, inputPtr, len);
        inputView.set(channelData);

        process_fft_magnitudes(inputPtr, len, outputPtr);

        const outputView = new Float32Array(this.memory.buffer, outputPtr, outLen);
        return new Float32Array(outputView);
    } finally {
        free(inputPtr, len);
        free(outputPtr, outLen);
    }
  }
}
