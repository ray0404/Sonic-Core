# Blueprint: Phase 5 - Engine Foundation - "Sonic-STL" (Standard Transform Library)

## 📖 Executive Summary
**Goal:** Establish a robust, high-performance Standard Transform Library (STL) within the Zig kernel (`libs/sonic-dsp-kernel/dsp/`). 

As the DSP library scales past 40 processors, rewriting common mathematical primitives (like Fast Fourier Transforms, windowing functions, or resampling logic) across different plugins leads to code duplication, subtle bugs, and inconsistent performance. This feature proposes a unified, `comptime`-optimized library for all essential audio math.

---

## 🏗️ Architectural Changes

### 1. The `dsp/transforms.zig` Module
Create a new module dedicated to complex, multi-sample mathematical transformations. This replaces ad-hoc loops in individual plugins.

**Key Additions:**
*   **Compile-time FFT (`comptime`):** Zig's `comptime` allows us to pre-calculate sine/cosine tables (twiddle factors) and bit-reversal indices during the build step, rather than at runtime. This will drastically reduce memory overhead and CPU cycles for spectral plugins (e.g., `voice_isolate.zig`).
*   **Windowing Functions:** Standardized Hanning, Hamming, and Blackman-Harris windows for overlap-add (OLA) processing.
*   **Polyphase Resampling:** A robust, anti-aliased resampling primitive for oversampling in non-linear plugins (like distortion or saturation) to prevent aliasing artifacts.

### 2. "Relaxed-SIMD" Hardware Acceleration Kernel
The STL must leverage WebAssembly's 128-bit SIMD instructions natively.
*   **Update `math_utils.zig`:** Abstract `std.simd` or `@Vector` operations to process 4 `f32` samples simultaneously.
*   **Auto-vectorization:** Ensure `build.zig` uses the `-msimd128` and `-mrelaxed-simd` target features when compiling the WASM payload.

### 3. Bit-Exact Validation Suite (Sonic-Guard)
To guarantee "robustness," the STL must include a testing harness that proves mathematical determinism.
*   **Cross-Environment Tests:** Run the same DSP algorithms via native Zig tests (`zig build test`), Node.js WASM wrappers, and the Browser. Ensure the output buffers match exactly (within floating-point epsilon).

---

## 🛠️ Implementation Plan (Execution Steps)

### Step 1: Establish the SIMD Foundation
- [ ] Update `libs/sonic-dsp-kernel/build.zig` to enable SIMD CPU features (`std.Target.Cpu.Feature.simd128`).
- [ ] Create `libs/sonic-dsp-kernel/dsp/vector_math.zig`.
- [ ] Implement SIMD-optimized vector addition, multiplication, and MAC (Multiply-Accumulate) functions using Zig `@Vector(4, f32)`.

### Step 2: Implement `comptime` FFT
- [ ] Create `libs/sonic-dsp-kernel/dsp/fft.zig`.
- [ ] Write a generic FFT implementation that takes the FFT size as a `comptime` parameter.
- [ ] Generate twiddle factors at compile time:
  ```zig
  fn generateTwiddles(comptime N: usize) [N/2]Complex {
      @setEvalBranchQuota(100000);
      // Precompute complex roots of unity...
  }
  ```

### Step 3: Implement Overlap-Add (OLA) & Windowing
- [ ] Create `libs/sonic-dsp-kernel/dsp/window.zig` with `comptime` generated Hanning/Blackman window arrays.
- [ ] Implement a reusable OLA processor struct that plugins can instantiate to handle incoming blocks, window them, FFT, process, IFFT, and overlap-add back to the output buffer.

### Step 4: Refactor Existing Plugins
- [ ] Identify the most CPU-intensive spectral plugin (e.g., `spectralmatch.zig` or `voice_isolate.zig`).
- [ ] Replace its bespoke FFT/windowing logic with the new Sonic-STL primitives.
- [ ] Benchmark performance (CPU time per process block) before and after.

---

## 🧪 Verification & Testing
1. **Unit Tests:** Write comprehensive `test` blocks inside `fft.zig` and `vector_math.zig` using known inputs (e.g., impulse response) and checking against expected frequency-domain outputs.
2. **Performance Benchmarks:** Run `zig build bench` to measure cycle counts of the scalar vs. SIMD implementations. Expect at least a 3x speedup on vectorizable loops.
3. **Audio Quality:** Process a reference sine sweep through a plugin refactored with the STL. Perform a null-test against the previous implementation to ensure no phase or amplitude distortion was introduced.