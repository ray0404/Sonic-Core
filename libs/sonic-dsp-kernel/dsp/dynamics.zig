const std = @import("std");
const shared = @import("shared.zig");

pub const EnvelopeFollower = struct {
    attack_coeff: f32 = 0,
    release_coeff: f32 = 0,
    envelope: f32 = 0,

    pub fn setParams(self: *EnvelopeFollower, attack_ms: f32, release_ms: f32, sample_rate: f32) void {
        self.attack_coeff = std.math.exp(-1.0 / (@max(0.0001, attack_ms * 0.001) * sample_rate));
        self.release_coeff = std.math.exp(-1.0 / (@max(0.001, release_ms * 0.001) * sample_rate));
    }

    pub fn process(self: *EnvelopeFollower, input: f32) f32 {
        const abs_in = @abs(input);
        if (abs_in > self.envelope) {
            self.envelope = self.attack_coeff * self.envelope + (1.0 - self.attack_coeff) * abs_in;
        } else {
            self.envelope = self.release_coeff * self.envelope + (1.0 - self.release_coeff) * abs_in;
        }
        return self.envelope;
    }
    
    pub fn reset(self: *EnvelopeFollower) void {
        self.envelope = 0;
    }
};

pub const GainComputer = struct {
    pub fn compute(threshold_db: f32, ratio: f32, knee_db: f32, input_db: f32) f32 {
        const overshoot = input_db - threshold_db;
        
        if (knee_db > 0) {
            // Soft knee
            if (overshoot < -knee_db / 2.0) {
                return 0;
            } else if (overshoot > knee_db / 2.0) {
                return overshoot * (1.0 - 1.0 / @max(1.0, ratio));
            } else {
                // Inside knee region
                const x = overshoot + knee_db / 2.0;
                return (1.0 - 1.0 / @max(1.0, ratio)) * (x * x / (2.0 * knee_db));
            }
        } else {
            // Hard knee
            if (overshoot <= 0) return 0;
            return overshoot * (1.0 - 1.0 / @max(1.0, ratio));
        }
    }
};
