Help me refine an "album/group LUFS leveling" algorithm along these lines that uses any existing sonic-core modules/functions, standard system packages (i.e. ffmpeg), or Defines new functions/processors (zig or otherwise) to be built and/or implemented if need be. Some tracks within a group/album may be considerably softer/louder than others within the group. Also, the harmonic content of each track must be considered as well; they, of course, *can* (and should) have their own amount of harmonic variance, but each track should still fit relatively cohesively within its defined group.

---

To achieve a cohesive group of tracks where loudness is unified, True Peak is strictly guarded, and harmonic content feels like it belongs to the same family, we need to construct a multi-pass pipeline. Because you are dealing with tracks that might have extreme variances in both spectral balance and macro-dynamics, a pure "static album normalization" isn't enough.

Given the architecture of the `sonic-core` environment, we can orchestrate this using a combination of fast standard packages (like `ffmpeg` for rapid offline analysis) and the existing Zig DSP modules (`sonicspectralmatch.zig`, `soniclimiter.zig`, `soniclufsnorm.zig`) for the heavy lifting.

Here is the ideal algorithmic pipeline, broken down into three distinct phases: **Harmonic Cohesion**, **Weighted Loudness Analysis**, and **Iterative True-Peak Processing**.

### Phase 1: Harmonic Cohesion (The Spectral Glue)

Before addressing volume, you must address the frequency spectrum. If one track has massive sub-bass and another is harsh in the 4kHz range, equalizing their LUFS will still make them sound disjointed.

We can leverage a spectral matching approach to pull outliers toward an "album center" without destroying their individual character.

1. **Album Spectral Profiling**:
* Run an FFT analysis over every track to extract its time-averaged magnitude spectrum.
* Compute the **Album Reference Profile** by calculating the mean (or median) magnitude at each frequency bin across all tracks.


2. **Fractional Spectral Matching**:
* For each track, calculate the EQ delta required to perfectly match the Album Reference Profile.
* **Crucial Constraint**: Do not apply this delta at 100%. Apply a fractional coefficient (e.g., `match_amount = 0.15` to `0.30`).
* **Implementation**: Utilize the existing `sonicspectralmatch.zig` module. By feeding it the calculated Album Reference Profile and setting a low interpolation weight, the module will gently EQ the track so its harmonic footprint leans toward the group average, preserving its identity but ensuring it fits the "sonic fingerprint" of the album.



### Phase 2: Weighted Loudness Analysis (The Hybrid Algorithm)

Standard "Album Normalization" calculates one global gain offset and applies it to everything. This preserves intent, but if a track is *considerably* softer, it might fall below the noise floor of the listener's environment. Standard "Track Normalization" forces everything to exactly -14 LUFS, destroying the album's dynamic journey.

The solution is a **Weighted Hybrid Offset**.

1. **Measurement (`ffmpeg` is ideal here)**:
* Execute an `ebur128` pass on each track individually:
`ffmpeg -nostats -i track.wav -filter_complex ebur128=peak=true -f null -`
* Parse standard output to capture $LUFS_{track}$ and $TP_{track}$ (True Peak).
* Calculate the $LUFS_{album}$ (the integrated LUFS if all tracks were played back-to-back as one continuous file).


2. **The Hybrid Gain Calculation**:
Instead of a binary choice, calculate the gain offset for each track ($\Delta G_{track}$) using a blending coefficient $W$ (where $0.0$ is pure album normalization, and $1.0$ is pure track normalization). A $W$ value around `0.3` to `0.4` is usually ideal.
$$\Delta G_{album} = Target_{LUFS} - LUFS_{album}$$


$$\Delta G_{independent} = Target_{LUFS} - LUFS_{track}$$


$$\Delta G_{track} = (W \times \Delta G_{independent}) + ((1 - W) \times \Delta G_{album})$$


This mathematically ensures that the quiet track gets a *little* extra boost so it isn't lost, and the loud track gets pulled back slightly, but the overall macro-dynamic relationship of the album remains intact.

### Phase 3: Processing & True Peak Mitigation

With the harmonic adjustments determined and the $\Delta G_{track}$ calculated, you must now process the audio without violating the True Peak constraint (e.g., -1.0 dBTP).

Because `sonic-core` utilizes a module graph, you can construct an offline render chain for each track.

**The Processing Graph:**
`[Input] -> [SpectralMatchNode (15%)] -> [GainNode (Static \Delta G)] -> [LimiterNode (-1.0 dBTP ceiling)] -> [Output]`

**The "Catch-22" Iterative Loop (The Algorithm):**
Because the `soniclimiter.zig` module will suppress peaks, the actual output LUFS will likely fall short of the theoretical target if the track requires heavy limiting. You must implement a convergence loop in your CLI director:

1. **Initialize**: Set `current_gain_offset` = $\Delta G_{track}$.
2. **Process**: Render the track through the DSP graph using the `current_gain_offset`.
3. **Verify**: Run a fast `ebur128` check on the rendered output to get $LUFS_{actual}$ and $TP_{actual}$.
4. **Evaluate**:
* If $TP_{actual}$ > -1.0 dBTP (should be impossible if the limiter is functioning correctly, but good to check).
* Calculate error: $E = Target_{LUFS} - LUFS_{actual}$.
* If $|E| \le 0.2$ LU (within an acceptable tolerance window), **Break and Save**.


5. **Adjust & Recurse**:
* If the error is outside tolerance, add the error to the gain offset: `current_gain_offset += E`.
* Limit iterations (e.g., `max_iterations = 3`) to prevent infinite loops on highly dynamic acoustic tracks that simply cannot be pushed louder without turning into square waves.



### Implementation Considerations for the CLI Engine

To orchestrate this within the `cli/engine/director.ts` environment:

* **Pass 1 (Discovery)**: The director spawns background workers (or shell `exec` calls to `ffmpeg`) to gather all LUFS/TP data and spectral profiles in parallel.
* **Pass 2 (Calculation)**: The director acts as the central brain, crunching the Hybrid Gain math and averaging the spectral arrays into the Album Reference Profile.
* **Pass 3 (Execution)**: The director spins up instances of the `native-engine` (which binds to the Zig kernels), feeds them the parameters (Spectral Match array, Gain scalar, Limiter ceiling), and processes the batch.
