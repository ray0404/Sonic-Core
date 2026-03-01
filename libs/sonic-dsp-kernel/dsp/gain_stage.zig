const std = @import("std");

/// GainStage: A high-quality, SIMD-accelerated gain processing module
/// with built-in smoothing to prevent audio pops and clicks.
pub const GainStage = struct {
    /// The smoothed current gain being applied
    current_gain: f32 = 1.0,
    /// The target gain set by the user (linear)
    target_gain: f32 = 1.0,
    /// Smoothing constant (0.0 to 1.0)
    /// ~0.999 is typical for slow smoothing, ~0.9 for fast response.
    smoothing: f32 = 0.99,

    /// Initializes a new GainStage with a target linear gain.
    pub fn init(initial_gain: f32) GainStage {
        return .{
            .current_gain = initial_gain,
            .target_gain = initial_gain,
            .smoothing = 0.999, // default 10ms-ish at 48kHz
        };
    }

    /// Set gain via decibels
    pub fn setGainDb(self: *GainStage, db: f32) void {
        self.target_gain = std.math.pow(f32, 10.0, db / 20.0);
    }

    /// Set gain via linear multiplier
    pub fn setGainLinear(self: *GainStage, linear: f32) void {
        self.target_gain = linear;
    }

    /// Set smoothing speed (0.0 for instant, 0.999 for slow)
    pub fn setSmoothing(self: *GainStage, factor: f32) void {
        self.smoothing = std.math.clamp(factor, 0.0, 0.9999);
    }

    /// Process a single mono sample (High Quality / Smoothed)
    pub inline fn processSample(self: *GainStage, sample: f32) f32 {
        // Simple One-pole smoothing: y[n] = x[n] * (1-a) + y[n-1] * a
        self.current_gain = (self.target_gain * (1.0 - self.smoothing)) + (self.current_gain * self.smoothing);
        return sample * self.current_gain;
    }

    /// Process a stereo buffer (SIMD Optimized)
    pub fn processStereo(self: *GainStage, l: []f32, r: []f32) void {
        const frames = l.len;
        const Vec4 = @Vector(4, f32);
        
        // If we are basically at the target, use the fast path
        if (@abs(self.current_gain - self.target_gain) < 1e-6) {
            self.current_gain = self.target_gain;
            const g_vec: Vec4 = @splat(self.target_gain);
            
            var i: usize = 0;
            // Process in blocks of 4 using SIMD
            while (i + 4 <= frames) : (i += 4) {
                const l_vec: Vec4 = l[i..][0..4].*;
                const r_vec: Vec4 = r[i..][0..4].*;
                
                const l_out = l_vec * g_vec;
                const r_out = r_vec * g_vec;
                
                l[i..][0..4].* = l_out;
                r[i..][0..4].* = r_out;
            }
            
            // Handle remaining frames
            for (i..frames) |j| {
                l[j] *= self.target_gain;
                r[j] *= self.target_gain;
            }
        } else {
            // Slow path with smoothing
            for (0..frames) |i| {
                const g = (self.target_gain * (1.0 - self.smoothing)) + (self.current_gain * self.smoothing);
                self.current_gain = g;
                l[i] *= g;
                r[i] *= g;
            }
        }
    }
};

test "GainStage smoothing" {
    var stage = GainStage.init(0.0);
    stage.setGainLinear(1.0);
    stage.setSmoothing(0.9); // Fast
    
    var l = [_]f32{ 1.0, 1.0, 1.0 };
    var r = [_]f32{ 1.0, 1.0, 1.0 };
    
    stage.processStereo(&l, &r);
    
    // Check that it's rising but not yet at 1.0
    try std.testing.expect(l[0] > 0.0);
    try std.testing.expect(l[1] > l[0]);
    try std.testing.expect(l[2] > l[1]);
    try std.testing.expect(l[2] < 1.0);
}
