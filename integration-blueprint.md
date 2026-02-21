# Sonic-Core Integration Blueprint: "Creative Suite" Expansion

## 1. Executive Summary
**Objective:** Transform `Sonic-Core` from a specialized vocal/repair tool into a comprehensive music production suite by integrating the creative engines (Guitar, Drums, Tabs) and AI capabilities of `MF-SonicForge`.

**Status:** Proposed
**Owner:** Ray0404
**Target:** `Sonic-Core/src`

## 2. Architecture: The Hybrid Engine
The integration will create a **Dual-Engine Architecture**:
1.  **Precision Engine (Zig/WASM)**: Existing `Sonic-Core` kernel. Handles spectral editing, denoising, and vocal isolation.
2.  **Creative Engine (TS/WebAudio)**: Ported `MF-SonicForge` modules. Handles synthesis, guitar amp simulation, and modulation effects.

**Key Requirement:** Both engines must share a single `AudioContext` instance to allow seamless routing (e.g., recording a Guitar Rig output into the Vocal De-bleeder).

## 3. Implementation Tracks

### Track A: Foundation & Utilities
*Essential prerequisites for all creative modules.*

-   **Source:** `MF-SonicForge/services/audioUtils.ts`
-   **Destination:** `Sonic-Core/src/utils/audio-math.ts`
-   **Tasks:**
    1.  Port `makeTubeCurve` & `makeFuzzCurve` (Critical for Amp/Pedal distortion).
    2.  Port `audioBufferToWav` (Standardize export format).
    3.  Ensure strict typing matches `Sonic-Core` standards.

### Track B: The Guitar Rig (Creative Engine Core)
*The heart of the new creative capabilities.*

-   **Source:**
    -   `services/ampEngine.ts` + `services/amps/*`
    -   `services/pedalEngine.ts` + `services/pedals/*`
    -   `services/equalizerEngine.ts`
    -   `services/audioEngine.ts` (Logic source only)
-   **Destination:** `Sonic-Core/src/modules/guitar/`
-   **Tasks:**
    1.  **Refactor `audioEngine.ts`** into `GuitarProcessor.ts`.
        -   *Change:* Remove internal `AudioContext` instantiation.
        -   *Change:* Accept `AudioContext` and `DestinationNode` as constructor arguments.
    2.  **Port Amps & Pedals:**
        -   Migrate all classes from `services/amps/` and `services/pedals/`.
        -   Ensure `CabinetSimulator` properly loads Impulse Responses (IRs) via `Sonic-Core`'s asset loader.
    3.  **Create `useGuitarStore` (Zustand):**
        -   Manage state for Amp settings (Gain, Bass, Mid, Treble) and Pedal toggles.

### Track C: AI Creative Services
*Generative features for backing tracks and practice.*

-   **Source:** `MF-SonicForge/services/ai/*`
-   **Destination:** `Sonic-Core/src/services/ai/`
-   **Tasks:**
    1.  **Port Services:**
        -   `JamComposer.ts`: AI Backing Track generation.
        -   `LessonCurator.ts`: Personalized practice routines.
        -   `ToneModeler.ts`: AI Tone matching.
    2.  **Integration:**
        -   Connect `JamComposer` output to the `TabEngine` (Track D) for immediate playback.
        -   Securely manage `GoogleGenAI` API keys using `Sonic-Core`'s environment configuration.

### Track D: Production Tools (Drums, Tabs, Timing)
*Support tools for a complete workstation experience.*

-   **Source:** `MF-SonicForge/services/{drumEngine, tabEngine, metronomeEngine, tunerEngine}.ts`
-   **Destination:** `Sonic-Core/src/modules/tools/`
-   **Tasks:**
    1.  **Port `DrumEngine`:**
        -   Implement as a sample-based sequencer.
        -   Ensure sample loading is asynchronous and cached.
    2.  **Port `TabEngine`:**
        -   A specialized synthesizer for playing back guitar tabs.
        -   Connect to `GuitarProcessor` (Track B) to run tabs through the Amp Sims.
    3.  **Port `MetronomeEngine`:**
        -   Integrate with `Sonic-Core`'s global transport/timeline if one exists, otherwise keep standalone.
    4.  **Evaluate `tunerEngine.ts`:**
        -   *Decision:* Compare with `Sonic-Core`'s Zig-based `pitch_detect.zig`. Prefer the Zig implementation for performance, but keep the TS version as a fallback or for Web-only environments.

## 4. UI Integration Strategy
-   **New Route:** `/creative` or `/studio`
-   **Components:**
    -   `GuitarRack`: Visual chain of Pedals -> Amp -> Cab.
    -   `JamSession`: AI chat interface + Tab/Audio player.
    -   `TransportBar`: Metronome controls + Tuner toggle.

## 5. Technical Considerations
-   **Latency Management:**
    -   Running the `GuitarProcessor` (heavy TS WebAudio graph) alongside `Sonic-Core`'s WASM kernel may introduce garbage collection pauses.
    -   *Mitigation:* Isolate the Guitar Engine in a `Worklet` if performance becomes an issue (long-term goal).
-   **Asset Management:**
    -   `DrumEngine` and `CabinetSimulator` require external assets (WAV files).
    -   *Action:* Create a centralized `AssetManager` in `Sonic-Core` to pre-load these resources.
