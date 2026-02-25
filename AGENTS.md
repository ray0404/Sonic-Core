# Sonic-Core - Agent Operational Guide

This document provides a comprehensive overview of the Sonic-Core codebase, architecture, and operational procedures for AI agents and developers.

## 1. Project Identity & Purpose

*   **Name:** Sonic-Core
*   **Description:** A professional-grade, local-first audio workstation platform. It bridges the gap between browser-based tools and desktop DAWs by combining precision DSP with a creative production suite.
*   **Core Philosophy:**
    *   **Zero-Latency:** Real-time processing via AudioWorklets and high-performance WebAudio graphs.
    *   **High Performance:** Heavy offline processing via Zig/WebAssembly.
    *   **Local-First:** All data remains on the user's device (IndexedDB); no server-side audio processing.
    *   **AI-Enhanced:** Creative co-pilot features powered by Google Gemini for track blueprinting and tone matching.

## 2. Technical Stack

### Frontend & State
*   **Framework:** React 18 (Vite 5)
*   **Language:** TypeScript 5.x
*   **State Management:** Zustand (Store), `idb-keyval` (Persistence)
*   **AI Integration:** `@google/genai` (Gemini 2.5 Flash)
*   **Styling:** Tailwind CSS, Framer Motion, `lucide-react` (Icons)

### Audio Engine (Dual-Engine Architecture)
*   **Precision Engine (Zig/WASM):** High-performance kernel for spectral editing, denoising, and isolation.
*   **Creative Engine (TS/WebAudio):** Modular graph for guitar rig simulation, synthesizers, and modulation effects.
*   **Threading:**
    *   **Main Thread:** UI, State, Audio Graph Orchestration.
    *   **Audio Thread:** Real-time processing (AudioWorklets).
    *   **Worker Thread:** Offline processing (WASM/Zig bridge).

### CLI Tool
*   **Framework:** Ink (React for CLI)
*   **Engine:** Puppeteer (Headless Chrome for audio context)
*   **Purpose:** Batch processing automation and headless project management.

## 3. Architecture Overview

Sonic-Core follows a strict **Three-Layer Architecture**:

1.  **Intent Layer (UI & Store):**
    *   **Role:** Captures user actions and manages application state.
    *   **Key Files:** `src/store/useAudioStore.ts`, `src/components/**/*.tsx`
    *   **Creative State:** `src/store/useGuitarStore.ts` handles granular guitar rig parameters.

2.  **Orchestration Layer (Audio Engine):**
    *   **Role:** Translates state changes into imperative Web Audio API calls.
    *   **Key Files:** `packages/sonic-core/src/mixer.ts`, `packages/sonic-core/src/core/track-strip.ts`
    *   **Logic:** Manages the lifecycle of both WASM-based Worklets and TS-based Creative Nodes.

3.  **Processing Layer (DSP):**
    *   **Role:** The actual math modifying audio samples.
    *   **Key Paths:** 
        *   `packages/sonic-core/src/worklets/`: Real-time processors.
        *   `libs/sonic-dsp-kernel/`: Zig source for offline processing.
        *   `packages/sonic-core/src/creative/`: TS-based audio logic for amps/pedals.

## 4. Key Workflows & Features

### A. Modular Rack ("The Trinity Pattern") & Autogen
Adding a new effect previously required manual syncing across three components. With **Phase 4: SonicForge Autogen**, this workflow is heavily automated:
1.  **Processor/Logic (Zig):** Define the DSP math in `libs/sonic-dsp-kernel/plugins/sonic[name].zig`.
2.  **Metadata (Zig):** Export a `PluginMeta` struct containing parameter bounds, defaults, and units.
3.  **Autogen (`forge:generate`):** Running this script parses the Zig metadata and automatically generates the TypeScript Worklet Node wrapper and the React UI component (`[Name]Unit.tsx`).

### B. Engine Foundation (Sonic-STL)
The DSP processing layer relies on the **Sonic-STL (Standard Transform Library)**. This provides highly robust, `comptime`-optimized mathematical primitives:
*   **SIMD Acceleration:** Core arrays leverage Zig's `@Vector(4, f32)` for hardware-accelerated processing via `-mcpu=generic+simd128+relaxed_simd`.
*   **Comptime FFTs & Windowing:** Fast Fourier Transforms and Hanning windows are pre-calculated at compile-time to eliminate runtime trigonometric overhead.

### C. Creative Suite
*   **Guitar Rig:** 4 Amp models (Clean, Crunch, Modern, Bass) + IR Cabinet Simulator.
*   **Standalone Stompboxes:** Individual pedal modules (Chorus, Delay, Reverb, Overdrive, etc.) that can be placed anywhere in the signal chain.
*   **Production Tools:** Synthesized Drum Machine, Tab Player (MIDI-style playback), and high-precision Tuner/Metronome.

### C. AI Co-Pilot (Gemini)
*   **Jam Session:** Generates musical blueprints (chords/tempo) from text descriptions.
*   **Tone Modeler:** Automatically configures the Guitar Rig to match a requested "vibe" or style.

### D. Smart Processing (Zig/WASM)
High-performance offline processing for file repair and normalization.
*   **Features:** LUFS Normalizer, De-Clipper, Spectral Denoise, Phase Rotation, Voice Isolate.

## 5. Development & Operations

### Prerequisites
*   Node.js 18+
*   Zig 0.13.0 (Required for WASM build)

### Commands
*   `npm run dev`: Start Vite development server.
*   `npm run build`: Build web application.
*   `npm run build:wasm`: Compile Zig DSP to WebAssembly.
*   `npm run dev:cli`: Start interactive TUI.
*   `npm test`: Run Vitest suite.

### File Structure Map
```
Sonic-Core/
├── cli/                # Terminal UI & CLI Engine
├── libs/
│   └── sonic-dsp-kernel/ # Zig DSP source
├── packages/
│   └── sonic-core/     # Headless engine library
│       └── src/
│           ├── core/   # Engine internals
│           ├── creative/ # Creative module logic
│           └── worklets/ # AudioWorklets & Node wrappers
├── src/                # PWA Frontend
│   ├── components/     # UI Units & Layouts
│   ├── services/       # AI & Audio utilities
│   └── store/          # Zustand stores
└── public/
    └── wasm/           # Compiled WASM binary
```

## 6. Roadmap (2026)
1.  **Distribution:** Automated Social Visualizer Export (FFmpeg.wasm).
2.  **Integration:** Local Plugin Wrapper (VST3/AU Desktop Bridge).
3.  **UX Evolution:** Reactive Node Graph View (Visual "wire" routing).
4.  **Developer Velocity:** "SonicForge" Autogen (Completed).
5.  **Engine Foundation:** "Sonic-STL" Standard Transform Library (Completed).
