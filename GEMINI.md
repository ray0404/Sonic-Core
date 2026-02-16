# Sonic-Core: Universal Audio Platform

**Sonic-Core** is a high-performance, professional-grade audio processing platform. It is designed as a modular system that bridges web-based convenience with desktop-level DSP performance.

## 🚀 Project Overview

Sonic-Core transforms the concept of a "web-based DAW" into a **Universal Audio Platform**. It consists of a headless core library, a rich web interface, and a powerful CLI toolset.

### Core Technology Stack
- **Engine Core**: TypeScript 5.x (Headless, Command-driven)
- **DSP Kernel**: Zig 0.13.0 (Compiled to WebAssembly)
- **Web UI**: React 18, Zustand, Tailwind CSS, Vite
- **CLI/TUI**: Ink (React for CLI), Puppeteer (Headless Audio Context)
- **Real-time Processing**: AudioWorklets
- **Offline Processing**: Web Workers + WASM
- **Testing**: Vitest

## 🏗️ Architecture: The Three-Layer System

Sonic-Core follows a strict architectural boundary to manage audio thread safety and cross-platform compatibility.

### 1. Intent Layer (UI & Store)
*   **Path**: `src/`
*   **Role**: Visualizes state and captures user intent. It is decoupled from direct audio buffer manipulation.
*   **State Management**: Zustand handles the project graph (tracks, modules, parameters).
*   **Persistence**: Automatic hydration/dehydration to IndexedDB via `idb-keyval`.

### 2. Orchestration Layer (Mixer Engine)
*   **Path**: `packages/sonic-core/`
*   **Role**: Translates user intents (Commands) into imperative Web Audio API calls.
*   **Protocol**: Uses a serialized `EngineCommand` protocol (`TRACK_ADD`, `PARAM_SET`, etc.) to control the engine.
*   **SDK**: Provides a headless bridge for the Zig/WASM DSP kernel.

### 3. Processing Layer (DSP)
*   **Real-time**: Pure JavaScript/TypeScript `AudioWorkletProcessors` located in `packages/sonic-core/src/worklets/`.
*   **Offline**: High-performance Zig kernels in `libs/sonic-dsp-kernel/`.
*   **WASM Bridge**: The `SonicForgeSDK` manages memory allocation and data transfer between JavaScript and the compiled Zig binary.

## 🛠️ Key Components & Features

### The DSP Library
Over 30 professional-grade processors including:
- **Intelligent Repair**: De-Clipper, Spectral Denoise, Plosive Guard.
- **Mastering Tools**: LUFS Normalizer, Phase Rotation, Smart Level.
- **Creative Effects**: Multi-mode Saturation, BitCrusher, Feedback Delay, Chorus.
- **Advanced Isolation**: Voice Isolate, De-Bleed, Spectral Match.

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

### The "Trinity Pattern"
To add a new real-time effect, you must implement:
1.  **DSP Processor**: `packages/sonic-core/src/worklets/[name]-processor.js`
2.  **Node Wrapper**: `packages/sonic-core/src/worklets/[Name]Node.ts`
3.  **UI Unit**: `src/components/rack/[Name]Unit.tsx`

### Headless First
All engine logic must reside in `packages/sonic-core` and remain independent of React or browser-specific globals (except the Web Audio API). Environment-specific dependencies (like file paths) should be injected via providers.

---
*Last Updated: February 2026*
