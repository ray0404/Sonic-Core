const std = @import("std");
const math = @import("../math_utils.zig");

const FilterState = struct {
    x1: f32 = 0,
    y1: f32 = 0,
    const a1: f32 = -0.995;
    const b0: f32 = 0.9975;
    const b1: f32 = -0.9975;

    pub fn process(self: *FilterState, input: f32) f32 {
        const output = b0 * input + b1 * self.x1 - a1 * self.y1;
        self.x1 = input;
        self.y1 = output;
        return output;
    }
};

pub const SmartLevelPlugin = struct {
    target_lufs: f32,
    max_gain_db: f32,
    gate_threshold_db: f32,
    sample_rate: f32,
    
    filter: FilterState,
    history: []f32,
    history_idx: usize,
    sum_sq: f32,
    current_gain_db: f32,
    last_raw_gain_db: f32,

    pub fn init(allocator: std.mem.Allocator, sample_rate: f32) !*SmartLevelPlugin {
        const self = try allocator.create(SmartLevelPlugin);
        self.sample_rate = sample_rate;
        self.target_lufs = -16.0;
        self.max_gain_db = 6.0;
        self.gate_threshold_db = -50.0;
        
        self.filter = FilterState{};
        
        // 300ms window
        const window_size = @as(usize, @intFromFloat(0.3 * sample_rate));
        self.history = try allocator.alloc(f32, window_size);
        @memset(self.history, 0);
        self.history_idx = 0;
        self.sum_sq = 0;
        self.current_gain_db = 0;
        self.last_raw_gain_db = 0;
        
        return self;
    }

    pub fn deinit(self: *SmartLevelPlugin, allocator: std.mem.Allocator) void {
        allocator.free(self.history);
        allocator.destroy(self);
    }

    pub fn process(self: *SmartLevelPlugin, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
        const in_l = inputs[0][0..frames];
        const out_l = outputs[0][0..frames];
        const out_r = outputs[1][0..frames];

        const attack_tau_samples = 0.5 * self.sample_rate;
        const release_tau_samples = 1.0 * self.sample_rate;
        const alpha_attack = 1.0 / (attack_tau_samples + 1.0);
        const alpha_release = 1.0 / (release_tau_samples + 1.0);
        const window_size_f = @as(f32, @floatFromInt(self.history.len));

        for (in_l, 0..) |input_sample, i| {
            // A. Level Detection
            const filtered_sample = self.filter.process(input_sample);

            // 2. Sliding RMS
            const sq = filtered_sample * filtered_sample;
            const old_sq = self.history[self.history_idx];
            
            self.sum_sq = self.sum_sq + sq - old_sq;
            if (self.sum_sq < 0) self.sum_sq = 0;
            
            self.history[self.history_idx] = sq;
            self.history_idx = (self.history_idx + 1) % self.history.len;

            const mean_sq = self.sum_sq / window_size_f;
            const rms = std.math.sqrt(mean_sq);
            
            const rms_db = if (rms > 1e-9) 20.0 * std.math.log10(rms) else -100.0; 

            // B. Gain Computer
            var raw_gain_db = self.target_lufs - rms_db;

            if (rms_db < self.gate_threshold_db) {
                raw_gain_db = self.last_raw_gain_db;
            } else {
                if (raw_gain_db > self.max_gain_db) raw_gain_db = self.max_gain_db;
                if (raw_gain_db < -self.max_gain_db) raw_gain_db = -self.max_gain_db;
                self.last_raw_gain_db = raw_gain_db;
            }

            // C. Inertia
            var alpha: f32 = 0;
            if (raw_gain_db > self.current_gain_db) {
                alpha = alpha_attack;
            } else {
                alpha = alpha_release;
            }

            self.current_gain_db = self.current_gain_db + alpha * (raw_gain_db - self.current_gain_db);

            // D. Application
            const linear_gain = std.math.pow(f32, 10.0, self.current_gain_db / 20.0);
            out_l[i] = input_sample * linear_gain;
            
            // Dual Mono
            out_r[i] = out_l[i]; 
        }
    }

    pub fn setParameter(self: *SmartLevelPlugin, index: i32, value: f32) void {
        if (index == 0) {
            // Target LUFS: -24 to -8. Map 0-1.
            self.target_lufs = -24.0 + (value * 16.0);
        } else if (index == 1) {
            // Max Gain: 0 to 12. Map 0-1.
            self.max_gain_db = value * 12.0;
        } else if (index == 2) {
            // Gate Threshold: -60 to -30. Map 0-1.
            self.gate_threshold_db = -60.0 + (value * 30.0);
        }
    }

    pub fn getParameter(self: *SmartLevelPlugin, index: i32) f32 {
        if (index == 0) return (self.target_lufs + 24.0) / 16.0;
        if (index == 1) return self.max_gain_db / 12.0;
        if (index == 2) return (self.gate_threshold_db + 60.0) / 30.0;
        return 0.0;
    }
};

fn impl_create(allocator: std.mem.Allocator, sample_rate: f32) ?*anyopaque {
    if (SmartLevelPlugin.init(allocator, sample_rate)) |ptr| {
        return ptr;
    } else |_| {
        return null;
    }
}

fn impl_destroy(ptr: *anyopaque, allocator: std.mem.Allocator) void {
    const self = @as(*SmartLevelPlugin, @ptrCast(@alignCast(ptr)));
    self.deinit(allocator);
}

fn impl_process(ptr: *anyopaque, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
    const self = @as(*SmartLevelPlugin, @ptrCast(@alignCast(ptr)));
    self.process(inputs, outputs, frames);
}

fn impl_set_parameter(ptr: *anyopaque, index: i32, value: f32) void {
    const self = @as(*SmartLevelPlugin, @ptrCast(@alignCast(ptr)));
    self.setParameter(index, value);
}

fn impl_get_parameter(ptr: *anyopaque, index: i32) f32 {
    const self = @as(*SmartLevelPlugin, @ptrCast(@alignCast(ptr)));
    return self.getParameter(index);
}

pub const plugin_impl = struct {
    pub const create = impl_create;
    pub const destroy = impl_destroy;
    pub const process = impl_process;
    pub const set_parameter = impl_set_parameter;
    pub const get_parameter = impl_get_parameter;
};
