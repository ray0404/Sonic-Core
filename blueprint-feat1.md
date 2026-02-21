# Blueprint: Automated Social Visualizer Export

## 1. Executive Summary
**Objective:** Develop a robust, client-side rendering pipeline to export frequency-reactive WebGL visualizations synchronized with audio as high-quality MP4 files. This empowers users to share their "Sonic-Core" mastered tracks directly to TikTok, Instagram, and YouTube.

**Target:** `Sonic-Core/src/services/visualizer` & `FFmpeg.wasm` integration.

## 2. Technical Architecture

### 2.1 Component Overview
1.  **Visualizer Core (WebGL/Three.js):** A library of high-fidelity, frequency-reactive visualizers (e.g., "Spectral Orb", "Waveform Tunnel").
2.  **Audio Analyzer (Web Audio):** Extracts FFT (Fast Fourier Transform) data from the mastered audio stream in non-real-time (Offline).
3.  **Frame Capture (OffscreenCanvas):** Renders visualizer frames at a fixed frame rate (30/60 FPS) to a buffer.
4.  **Encoder (FFmpeg.wasm):** Muxes raw frames and the audio file into an H.264 MP4 container.

### 2.2 Data Flow
`Mastered Audio (Blob)` -> `Offline Audio Analysis (FFT Buffer)` -> `Canvas Frame Rendering` -> `FFmpeg.wasm Muxing` -> `MP4 Export`.

## 3. Implementation Plan

### Step 1: Foundation (Muxing)
-   Integrate `@ffmpeg/ffmpeg` and `@ffmpeg/util`.
-   Create `VideoExporter.ts` service.
-   **Task:** Implement a method to take an array of `Blob` frames + an `AudioBuffer` and produce an MP4.

### Step 2: The Visualizer (Rendering)
-   Create a "Template System" for visualizers.
-   Use `OffscreenCanvas` to ensure rendering doesn't block the UI thread.
-   **Task:** Implement "Waveform Visualizer" (Basic) and "Particle Spectrum" (Advanced).

### Step 3: Frame-Accurate Analysis
-   Since real-time analysis is inconsistent, use `OfflineAudioContext` to analyze the audio.
-   Divide the audio length by the target frame rate.
-   Perform FFT analysis at each "frame point" to create a pre-computed `FFTData[]` array.

### Step 4: Batch Rendering & Export
-   Loop through pre-computed FFT data.
-   Draw frame to canvas -> Extract as PNG/JPEG -> Write to FFmpeg Virtual FS.
-   Call FFmpeg command: `ffmpeg -framerate 60 -i frame_%04d.png -i input.wav -c:v libx264 -pix_fmt yuv420p output.mp4`.

## 4. Performance & Constraints
-   **Memory:** Encoding 60FPS HD video in-browser is RAM-intensive. Limit video resolution to 1080x1920 (Portrait) for social.
-   **Threading:** Use Web Workers for both rendering and encoding to keep the PWA responsive.
-   **Feedback:** Provide a detailed progress bar (e.g., "Rendering Frame 450/1200", "Encoding Video...").

## 5. Success Criteria
-   User can select a mastered track.
-   User can choose a visualizer template.
-   Exported MP4 is frame-accurate (audio and visuals are perfectly in sync).
-   File size is optimized for social upload (< 50MB for 30s).
