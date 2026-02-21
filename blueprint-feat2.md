# Blueprint: Local Plugin Wrapper (VST/AU Bridge)

## 1. Executive Summary
**Objective:** Create a secure communication bridge between the Sonic-Core PWA and a lightweight native desktop companion application. This allows web users to leverage their existing collection of professional VST3 and Audio Unit plugins.

**Architecture:** Hybrid Desktop-Web Bridge.

## 2. Technical Specification

### 2.1 The Companion App (Native Host)
-   **Language:** Rust (preferred for performance/safety) or Node.js (via `node-vst-host`).
-   **Core Role:**
    -   Host native plugin binaries (.vst3, .component).
    -   Provide a high-priority audio callback thread.
    -   Run a WebSocket/Localhost server for PWA communication.
-   **Discovery:** Scan standard OS paths (e.g., `/Library/Audio/Plug-Ins/Components` or `C:\Program Files\Common Files\VST3`).

### 2.2 The PWA Bridge
-   **Node Type:** `NativePluginNode` (Extends `AudioWorkletNode`).
-   **Communication:** WebSockets for control data; `SharedArrayBuffer` for low-latency audio transmission (requires Cross-Origin Isolation).

## 3. Implementation Tracks

### Track A: The Host Application
1.  **Scanner:** Implement a recursive file scanner that validates plugin headers.
2.  **Audio Engine:** Set up a `cpal` (Rust) or `PortAudio` stream.
3.  **Plugin Wrapper:** Use `vst-rs` to load and process audio buffers through VST3 instances.
4.  **IPC Server:** Expose an API for: `LIST_PLUGINS`, `LOAD_PLUGIN`, `SET_PARAM`, `PROCESS_AUDIO`.

### Track B: PWA Integration
1.  **Node Setup:** Create `NativePluginNode` in `packages/sonic-core`.
2.  **Connection Manager:** Implement a handshake protocol to detect if the local companion app is running.
3.  **UI Mapping:** Request plugin parameter metadata from the host and dynamically generate standard Sonic-Core knobs in the rack.

### Track C: Low-Latency Audio Streaming
1.  **Buffer Management:** Stream audio in 128-sample chunks (Web Audio standard) to the host.
2.  **Optimization:** Use `SharedArrayBuffer` to avoid serialization overhead between the PWA and the host app (if Electron/Tauri is used) or optimize WebSocket binary frames.

## 4. Security & Safety
-   **Localhost Only:** The bridge server must only accept connections from `localhost` and verified Sonic-Core origins.
-   **Sandbox Escape:** Explicitly warn the user that native plugins run outside the browser sandbox.

## 5. UX Workflow
1.  User opens Sonic-Core PWA.
2.  PWA detects "Sonic-Core Desktop Bridge" via `localhost:8080`.
3.  "Native Plugins" category appears in the Add Module menu.
4.  User selects "FabFilter Pro-Q 3".
5.  Audio is routed out of the PWA -> Processed by Pro-Q 3 -> Routed back to the PWA mixer.
