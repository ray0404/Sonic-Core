# Blueprint: Reactive Node Graph View

## 1. Executive Summary
**Objective:** Transform Sonic-Core's UX from a linear, top-to-bottom rack into a free-form "Visual Wire" environment. This allows for complex parallel processing, frequency splitting, and advanced modulation routing that is impossible in a standard rack.

**Target:** `src/components/graph` & `packages/sonic-core/src/mixer.ts` refactor.

## 2. Technical Architecture

### 2.1 Graph Engine
-   **UI Library:** `React Flow` (Version 12+).
-   **State:** Managed in a new `useGraphStore.ts` using Zustand.
-   **Node Schema:**
    ```typescript
    interface AudioNodeData {
      id: string;
      type: RackModuleType;
      params: Record<string, any>;
      inputs: number;
      outputs: number;
    }
    ```

### 2.2 Mixer Engine Refactor (Parallel Support)
-   Existing `TrackStrip` uses a linear array (`_rack: RackModule[]`).
-   New `GraphTrackStrip` will use a **Directed Acyclic Graph (DAG)**.
-   **Traversal:** Use a Topological Sort algorithm to determine the processing order of nodes.

## 3. Implementation Plan

### Step 1: Data Model Migration
-   Update `TrackState` to support an optional `graph` object containing `nodes` and `edges`.
-   Implement a bidirectional converter: `Rack (Linear) <-> Graph (Serial)`.

### Step 2: The Graph Canvas
-   Create `GraphWorkspace.tsx` using React Flow.
-   Implement `AudioModuleNode`: A custom React Flow node that renders the existing "Trinity Pattern" UI units inside a draggable card.
-   **Sockets:** Define "In" and "Out" handle points for audio routing.

### Step 3: Engine Synchronization
-   Hook into React Flow's `onConnect` and `onEdgesDelete` events.
-   Update the `MixerEngine` in real-time. 
-   **Logic:** When a wire is connected between Node A and Node B, call `engine.getNode(A).connect(engine.getNode(B))`.

### Step 4: Advanced Features
-   **Parallel Splitting:** Allow one output to connect to multiple inputs (e.g., Dry/Wet parallel chains).
-   **Sidechain Handles:** Explicit handles for sidechain inputs (e.g., Compressor sidechain source).
-   **Visual Metering:** Render `LEDBar` components directly on the wires to visualize signal flow.

## 4. Challenges & Solutions
-   **Feedback Loops:** Web Audio API supports feedback only if a `DelayNode` is present. Implement a validation check to prevent non-delayed loops which would crash the engine.
-   **Complexity:** Large graphs can be overwhelming. Implement "Sub-graphs" or "Group Nodes" to collapse complex chains.

## 5. Success Criteria
-   User can toggle between "Rack View" and "Graph View".
-   User can create a parallel saturation chain (Split -> Saturation -> Merge).
-   Graph state is correctly persisted to IndexedDB and hydrated on load.
-   Zero audio artifacts during live re-wiring.
