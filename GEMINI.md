# Sonic-Core: Universal Audio Platform

**Sonic-Core** is a high-performance, professional-grade audio processing platform. It is designed as a modular system that bridges web-based convenience with desktop-level DSP performance.

## 🚀 Project Overview

Sonic-Core transforms the concept of a "web-based DAW" into a **Universal Audio Platform**. It consists of a headless core library, a rich web interface, and a powerful CLI toolset.

### Core Technology Stack
- **Engine Core**: TypeScript 5.x (Headless, Command-driven)
- **DSP Kernel**: Zig 0.13.0 (Compiled to WebAssembly with SIMD128 and Relaxed SIMD hardware acceleration)
- **Sonic-STL**: Standard Transform Library providing `comptime` FFTs and Vector Math
- **Creative Suite**: TypeScript/WebAudio Modular Graph
- **AI Integration**: Google Gemini 2.5 (Jam Blueprinting, Tone Matching)
- **Web UI**: React 18, Zustand, Tailwind CSS, Vite
- **CLI/TUI**: Ink (React for CLI), Puppeteer (Headless Audio Context)
- **Real-time Processing**: AudioWorklets + WebAudio
- **Offline Processing**: Web Workers + WASM
- **Testing**: Vitest

## 🏗️ Architecture: The Dual-Engine System

Sonic-Core follows a strict architectural boundary to manage audio thread safety and cross-platform compatibility.

### 1. Intent Layer (UI & Store)
*   **Path**: `src/`
*   **Role**: Visualizes state and captures user intent. It is decoupled from direct audio buffer manipulation.
*   **State Management**: Zustand handles the project graph. `useGuitarStore` manages granular creative parameters.
*   **Persistence**: Automatic hydration/dehydration to IndexedDB via `idb-keyval`.

### 2. Orchestration Layer (Mixer Engine)
*   **Path**: `packages/sonic-core/`
*   **Role**: Translates user intents (Commands) into imperative Web Audio API calls.
*   **Dual Engine**: Manages both the **Precision Engine** (Zig/WASM) and the **Creative Engine** (TS/WebAudio) within a single unified `AudioContext`.

### 3. Processing Layer (DSP)
*   **Precision (Zig/WASM)**: High-performance kernels for repair, mastering, and isolation in `libs/sonic-dsp-kernel/`.
*   **Creative (TS)**: Modular signal chains for guitar simulation and synthesis in `packages/sonic-core/src/creative/`.
*   **Real-time Wrappers**: Located in `packages/sonic-core/src/worklets/`, following the "Trinity Pattern".

## 🛠️ Key Components & Features

### The DSP Library
Over 40 professional-grade processors including:
- **Intelligent Repair**: De-Clipper, Spectral Denoise, Plosive Guard.
- **Mastering Tools**: LUFS Normalizer, Phase Rotation, Smart Level, Spectral Match.
- **Creative Suite**: 
    - **Guitar Rig**: 4 Amp models + IR Cabinet Sim.
    - **Stompboxes**: 7 standalone pedal modules (Chorus, Delay, OD, Fuzz, etc.).
    - **Production**: Drum Machine, Tab Player, Tuner, Metronome.
- **AI Services**: Jam Session Generator, Tone Modeler (Natural Language to Preset).

### The "Director" System
A manifest-based batch processing engine (`cli/engine/director.ts`) that allows automating complex audio workflows across thousands of files via the CLI.

### Native Plugin Export
A dedicated wrapper system that allows exporting Sonic-Core DSP logic as native VST3 or Audio Unit (AU) plugins.

## 🚦 Building and Running

### Prerequisites
- **Node.js**: 18.0+
- **Zig**: 0.13.0 (Required for WASM builds)
- **Chromium**: Required for the headless CLI engine

### Key Commands
| Command | Description |
|---------|-------------|
| `npm run build:wasm` | Compiles Zig DSP kernel to `public/wasm/dsp.wasm` |
| `npm run dev` | Starts the Vite development server for the Web App |
| `npm run build` | Builds the production Web App bundle |
| `npm run dev:cli` | Starts the interactive React-based CLI (TUI) |
| `npm run build:cli` | Compiles the CLI application for distribution |
| `npm test` | Runs the Vitest suite (Unit & Integration) |

## 📏 Development Conventions

### The "Trinity Pattern" & Autogen
To add a new real-time effect, you previously had to manually implement three files. This is now automated via **SonicForge Autogen**:
1.  **DSP Logic & Metadata**: Write the processing logic in `libs/sonic-dsp-kernel/plugins/` and export a `PluginMeta` struct containing parameter definitions.
2.  **Generate**: Run `npm run forge:generate` (or allow the build system to trigger it).
3.  **Result**: The script automatically parses the Zig metadata and scaffolds the corresponding TypeScript Node Wrapper (`packages/sonic-core/src/worklets/Auto[Name]Node.ts`) and React UI Unit (`src/components/rack/Auto[Name]Unit.tsx`).

### Sonic-STL (Standard Transform Library)
All new DSP features should utilize the robust math primitives located in `libs/sonic-dsp-kernel/dsp/`:
- **Vector Math**: Use `vector_math.zig` (`@Vector(4, f32)`) for SIMD-accelerated array processing.
- **FFT**: Use the `Fft(N)` module from `fft.zig` for `comptime` calculated bit-reversal and twiddle factors to save runtime CPU cycles.
- **Windowing**: Use `window.zig` to generate `comptime` arrays for Overlap-Add applications.

---
*Last Updated: February 2026*
