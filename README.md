# Sonic-Core

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/github/actions/workflow/status/ray0404/Sonic-Core/ci.yml?branch=main)](https://github.com/ray0404/Sonic-Core/actions)
[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/ray0404/Sonic-Core/releases)

**Sonic-Core** is a high-performance, professional-grade, local-first audio workstation platform. It bridges the gap between browser-based convenience and desktop Digital Audio Workstation (DAW) performance by leveraging a **Dual-Engine Architecture**: combining **Zig/WebAssembly** for heavy-duty offline DSP with highly optimized **TypeScript/WebAudio** creative modules.

Sonic-Core is designed as a **Universal Audio Platform**, featuring a standalone headless core library, a rich Progressive Web App (PWA) interface, a powerful CLI for automation, and the ability to export DSP logic as native VST3/AU plugins.

---

## 📖 Table of Contents

- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Architecture](#-architecture)
- [The DSP Library](#-the-dsp-library)
- [Creative Suite & AI](#-creative-suite--ai)
- [Roadmap](#-roadmap)
- [CLI & Automation](#-cli--automation)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [License](#-license)

---

## ✨ Key Features

- **🚀 Zero-Latency Real-Time Processing**: Highly optimized AudioWorklet processors and modular WebAudio graphs.
- **🛠️ Smart Offline DSP**: High-performance audio repair and normalization engine written in Zig and compiled to WebAssembly. Powered by the **Sonic-STL**, utilizing hardware SIMD acceleration and `comptime` FFT optimizations.
- **⚡ Developer Velocity**: "SonicForge" Autogen completely eliminates boilerplate by parsing Zig metadata to automatically generate TypeScript WebAudio Nodes and React UI controls.
- **🎸 Creative Suite**: Full Guitar Rig (Amps/Cabs), standalone stompboxes, Drum Machine, and Tab Player.
- **🤖 AI Jam Session**: Gemini-powered co-pilot for generating backing tracks and matching guitar tones from text prompts.
- **🔒 Local-First & Privacy-Centric**: All audio data stays on the user's device. No cloud uploads for processing.
- **📦 Universal Architecture**: A decoupled system consisting of a headless core (`sonic-core`), a React UI library, and a CLI engine.
- **🔌 Native Plugin Export**: Export your DSP logic directly to VST3 or Audio Unit (AU) formats.
- **💾 Resilient Persistence**: Automatic project state and audio buffer saving to IndexedDB.

---

## 💻 Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 18 with Vite 5 |
| **Languages** | TypeScript 5.x, Zig 0.13.0 |
| **AI Engine** | Google Gemini 2.5 (via `@google/genai`) |
| **State Management** | Zustand (Global Store) |
| **Audio API** | Web Audio API (standardized-audio-context) |
| **DSP Core** | AudioWorklets (Precision), WebAssembly (Offline), TS (Creative) |
| **Styling** | Tailwind CSS, Framer Motion, Lucide React |
| **Persistence** | IndexedDB (`idb-keyval`) |
| **CLI** | Ink (React-based TUI), Commander, Puppeteer |
| **Testing** | Vitest, React Testing Library, JSDOM |

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: `v18.0` or higher (LTS recommended)
- **Zig**: `0.13.0` (Required for compiling the DSP kernel)
- **Google Chrome / Chromium**: Required for the headless CLI engine

---

## 🚀 Getting Started

1. **Clone & Install**
```bash
git clone https://github.com/ray0404/Sonic-Core.git
cd Sonic-Core
npm install
```

2. **Build WASM Kernel**
```bash
npm run build:wasm
```

3. **Launch Apps**
```bash
# Start PWA
npm run dev

# Start TUI
npm run dev:cli
```

---

## 🏗️ Architecture

Sonic-Core follows a strict **Three-Layer Architecture** to respect thread boundaries and ensure UI responsiveness.

### 1. Intent Layer (UI & State)
*   **Path**: `src/`
*   **Role**: Manages visual state and user intent.
*   **Key Store**: `src/store/useAudioStore.ts`

### 2. Orchestration Layer (Audio Engine)
*   **Path**: `packages/sonic-core/`
*   **Role**: Translates state into imperative Web Audio calls. Manages the **Dual-Engine** lifecycle.
*   **Entry Point**: `packages/sonic-core/src/mixer.ts`

### 3. Processing Layer (DSP)
*   **Precision Path**: `libs/sonic-dsp-kernel/` (Zig/WASM)
*   **Creative Path**: `packages/sonic-core/src/creative/` (TS/WebAudio)

---

## 🎛️ The DSP Library

Sonic-Core features a comprehensive library of over 40 high-quality audio processors:

### Real-Time Modules
- **Dynamics**: Compressor, stand-alone Pedals, Transient Shaper, De-Esser.
- **EQ**: Parametric EQ, Mid-Side EQ, Dynamic EQ.
- **Time/Modulation**: Chorus, Phaser, Tremolo, Feedback Delay.
- **Creative**: Multi-model Guitar Amps, Fuzz, Overdrive, BitCrusher.
- **Utility**: Stereo Imager, Metering, Dithering, Tuner, Metronome.

### Smart Offline Processors (Zig/WASM)
- **Loudness Normalization**: Analysis and gain adjustment to specific LUFS targets.
- **Phase Rotation**: Smears transients to recover headroom.
- **De-Clipper**: Restores clipped peaks using cubic Hermite interpolation.
- **Voice Isolate**: Advanced spectral subtraction for vocal clarity.
- **Spectral Match**: Analyzes a reference track and applies its spectral profile.

---

## 🎸 Creative Suite & AI

The **Creative Studio** panel leverages AI to streamline your workflow:
- **Jam Session**: Tell Gemini "I want a funky jazz loop in Cm at 110bpm" and it will generate the blueprint and start the backing track.
- **Tone Modeler**: Describe a guitar tone (e.g. "SRV's Pride and Joy") and Sonic-Core will automatically configure the Guitar Rig's amps and pedals to match.

---

## 🗺️ Roadmap (2026)

1.  **Automated Social Export**: Instantly render frequency-reactive WebGL videos for TikTok/Instagram.
2.  **VST/AU Desktop Bridge**: Connect the PWA to native desktop plugins via a local companion app.
3.  **Visual Node Graph**: Alternative routing view using "wires" for complex serial/parallel chains.
4.  **"SonicForge" Autogen**: Automated DSP boilerplate generation (Completed).
5.  **"Sonic-STL" Foundation**: High-performance compile-time transform library (Completed).

---

## 🤝 Contributing

We welcome contributions! Please follow the code conventions outlined in [AGENTS.md](./AGENTS.md).

---

**Developed with ❤️ by Ray Valentin**
GitHub: [@ray0404](https://github.com/ray0404) | Project: [Sonic-Core](https://github.com/ray0404/Sonic-Core)
