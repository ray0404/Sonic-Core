# Sonic Forge

Professional-grade, local-first audio mastering and processing platform. Sonic Forge bridges the gap between browser-based convenience and desktop-grade performance, offering a suite of real-time and offline audio tools.

## Key Features

- **Zero-Latency Real-time Processing**: Powered by optimized AudioWorklets.
- **High-Performance Offline DSP**: Smart processing engine written in Zig and compiled to WebAssembly.
- **Local-First & Privacy-Centric**: All audio remains on your device; no server-side processing or cloud uploads.
- **Universal Audio Platform**: Standalone core library (`sonic-core`), CLI tools, and a rich Web PWA.
- **Native Plugin Export**: Export your DSP logic as VST3 or Audio Unit (AU) plugins.
- **Batch Processing**: Automate audio workflows with a manifest-based "Director" system.

## Tech Stack

- **Framework**: React 18 with Vite
- **Language**: TypeScript 5.x, Zig 0.13.0
- **State Management**: Zustand
- **Styling**: Tailwind CSS, Framer Motion
- **Audio Engine**: Web Audio API, AudioWorklets, WebAssembly
- **Persistence**: IndexedDB (`idb-keyval`)
- **CLI**: Ink (React for CLI), Commander
- **Testing**: Vitest, React Testing Library

## Prerequisites

- **Node.js**: 18.0 or higher
- **Zig**: 0.13.0 (Required for compiling the DSP kernel)
- **NPM**: (or pnpm/yarn)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/user/sonic-forge.git
cd sonic-forge
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build the DSP Kernel (WASM)

Sonic Forge requires the Zig-based DSP kernel to be compiled to WebAssembly before running.

```bash
npm run build:wasm
```

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:5173](http://localhost:5173).

## Architecture

Sonic Forge follows a strict **Three-Layer Architecture** to ensure modularity and performance.

### 1. Intent Layer (UI & Store)
Captures user actions and manages application state. It uses Zustand for the global store and React for the interface.
- **Path**: `src/`
- **Key Store**: `src/store/useAudioStore.ts`
- **Behavior**: Updates the Zustand store, which triggers subscriptions to update the engine.

### 2. Orchestration Layer (Engine)
Translates state changes into Web Audio API calls and manages the audio graph.
- **Path**: `packages/sonic-core/`
- **Entry Point**: `packages/sonic-core/src/mixer.ts`
- **Logic**: Handles track strips, bus connections, and parameter automation (`setTargetAtTime`).

### 3. Processing Layer (DSP)
The mathematical core of the application.
- **Real-time**: AudioWorklet processors in `packages/sonic-core/src/worklets/`.
- **Offline**: Zig kernels in `libs/sonic-dsp-kernel/` compiled to WASM.

## Key Concepts

### The "Trinity Pattern" (Real-time Effects)
Adding a new real-time effect to the rack requires three components:
1.  **Processor (DSP)**: Extends `AudioWorkletProcessor` in `packages/sonic-core/src/worklets/`.
2.  **Node (Bridge)**: Extends `AudioWorkletNode` or `AudioNode`, handling parameter mapping and message passing.
3.  **UI (Component)**: A React unit (e.g., `src/components/rack/CompressorUnit.tsx`) for user control.

### Smart Processing (Offline Workflow)
High-performance offline processing for file repair and normalization using the Zig/WASM engine.
- **Loudness Normalization**: Target specific LUFS levels.
- **Phase Rotation**: Recover headroom by smearing transients.
- **De-Clipper**: Repair digital clipping via cubic interpolation.
- **Spectral Denoise**: FFT-based noise reduction.

### Directory Structure

```text
├── cli/                 # CLI Application (Ink/Commander)
├── libs/
│   └── sonic-dsp-kernel/ # Zig DSP source code
├── packages/
│   └── sonic-core/      # Headless Audio Engine (SDK)
├── src/                 # Web Application (React/Vite)
│   ├── components/      # UI Components (Rack, Mixer, Layout)
│   ├── hooks/           # Custom React hooks
│   ├── store/           # Zustand stores
│   └── utils/           # Shared utilities
├── public/              # Static assets and WASM artifacts
└── docs/                # Project documentation
```

## CLI Usage

Sonic Forge includes a powerful CLI for terminal-based audio processing.

### Start Interactive TUI
```bash
npm run dev:cli
```

### Batch Processing (Director)
Process a directory of files based on a `.sonic` manifest.
```bash
npx tsx cli/index.ts director manifest.json ./input ./output --parallel 4
```

### Export Native Plugins
```bash
# Export as VST3
npx tsx cli/index.ts export vst3 --plugin compressor

# Export as AU (macOS only)
npx tsx cli/index.ts export au --plugin limiter
```

## Testing

The project uses Vitest for both unit and component testing.

```bash
# Run all tests
npm test

# Run tests in UI mode
npx vitest --ui
```

## Building for Production

### Web Application
```bash
npm run build
```

### CLI Tool
```bash
npm run build:cli
```

## Deployment

The project is configured for **Firebase Hosting**.

```bash
# Build the project
npm run build

# Deploy to Firebase
firebase deploy
```

## Contributing

Please see [AGENTS.md](./AGENTS.md) for detailed operational guides and code conventions.

## License

MIT
