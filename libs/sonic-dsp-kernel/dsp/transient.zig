const std = @import("std");

/// A robust Transient Detector primitive.
/// Uses a dual-envelope (Fast vs Slow) strategy to identify sharp attacks in audio.
/// Ideal for auto-ducking, transient shaping, or beat detection in "smart" plugins.
pub const TransientDetector = struct {
    fast_env: f32 = 0,
    slow_env: f32 = 0,
    
    fast_coeff: f32 = 0,
    slow_coeff: f32 = 0,
    
    threshold: f32 = 1.5, // Ratio of fast to slow to trigger
    
    /// Initializes the detector coefficients.
    /// fast_ms should be very short (e.g. 1ms)
    /// slow_ms should be longer to track overall RMS (e.g. 15ms)
    pub fn setParams(self: *TransientDetector, fast_ms: f32, slow_ms: f32, threshold: f32, sample_rate: f32) void {
        self.fast_coeff = std.math.exp(-1.0 / (@max(0.0001, fast_ms * 0.001) * sample_rate));
        self.slow_coeff = std.math.exp(-1.0 / (@max(0.001, slow_ms * 0.001) * sample_rate));
        self.threshold = threshold;
    }

    /// Processes a sample and returns a "Transient Score" (0.0 to 1.0+)
    /// A score > 1.0 indicates a detected transient.
    pub fn process(self: *TransientDetector, input: f32) f32 {
        // Use squared input for energy approximation (RMS style)
        const energy = input * input;
        
        // Update envelopes
        self.fast_env = self.fast_coeff * self.fast_env + (1.0 - self.fast_coeff) * energy;
        self.slow_env = self.slow_coeff * self.slow_env + (1.0 - self.slow_coeff) * energy;
        
        // Prevent divide by zero
        const safe_slow = @max(self.slow_env, 1e-8);
        
        // Ratio of fast energy to slow energy
        const ratio = self.fast_env / safe_slow;
        
        // Normalize against threshold: if ratio > threshold, score > 1.0
        const score = ratio / self.threshold;
        
        return if (score > 1.0) score else 0.0;
    }
    
    pub fn reset(self: *TransientDetector) void {
        self.fast_env = 0;
        self.slow_env = 0;
    }
};

test "Transient Detector detects spikes" {
    var detector = TransientDetector{};
    detector.setParams(1.0, 15.0, 2.0, 48000.0);
    
    // Silence
    for (0..100) |_| {
        _ = detector.process(0.0);
    }
    
    // Sudden spike (Transient)
    const spike_score = detector.process(1.0);
    try std.testing.expect(spike_score > 1.0);
    
    // Sustained noise (not a transient)
    for (0..1000) |_| {
        _ = detector.process(0.5);
    }
    const sustain_score = detector.process(0.5);
    try std.testing.expect(sustain_score < 1.0);
}
