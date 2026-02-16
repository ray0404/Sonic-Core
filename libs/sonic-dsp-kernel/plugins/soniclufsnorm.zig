const std = @import("std");
const math = @import("../math_utils.zig");

// Copy of filter from main.zig
fn apply_filter(input: []const f32, output: []f32, state: *struct { x1: f32 = 0, y1: f32 = 0 }) void {
    const a1 = -0.995;
    const b0 = 0.9975;
    const b1 = -0.9975;

    for (input, 0..) |sample, i| {
        output[i] = b0 * sample + b1 * state.x1 - a1 * state.y1;
        state.x1 = sample;
        state.y1 = output[i];
    }
}

pub const LufsNormPlugin = struct {
    target_lufs: f32,
    sample_rate: f32,
    filter_state: struct { x1: f32 = 0, y1: f32 = 0 },

    pub fn init(allocator: std.mem.Allocator, sample_rate: f32) !*LufsNormPlugin {
        const self = try allocator.create(LufsNormPlugin);
        self.target_lufs = -16.0;
        self.sample_rate = sample_rate;
        self.filter_state = .{};
        return self;
    }

    pub fn deinit(self: *LufsNormPlugin, allocator: std.mem.Allocator) void {
        allocator.destroy(self);
    }

    pub fn process(self: *LufsNormPlugin, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
        const in_l = inputs[0][0..frames];
        const out_l = outputs[0][0..frames];
        const out_r = outputs[1][0..frames];

        // This is a block-based normalization. It calculates the gain for the CURRENT block
        // and applies it. In a real DAW this might be "jumpy".
        // But following main.zig implementation:
        
        var sum_sq: f32 = 0;
        for (in_l) |s| {
            // Apply K-weighting filter approximation
            const filtered = 0.9975 * s + (-0.9975) * self.filter_state.x1 - (-0.995) * self.filter_state.y1;
            self.filter_state.x1 = s;
            self.filter_state.y1 = filtered;
            sum_sq += filtered * filtered;
        }

        const mean_sq = sum_sq / @as(f32, @floatFromInt(frames));
        const rms_db = if (mean_sq > 1e-12) 10.0 * std.math.log10(mean_sq) else -100.0;
        const current_lufs = rms_db - 0.691;
        const delta_db = self.target_lufs - current_lufs;
        const linear_gain = std.math.pow(f32, 10.0, delta_db / 20.0);

        for (in_l, 0..) |s, i| {
            out_l[i] = s * linear_gain;
            out_r[i] = out_l[i];
        }
    }

    pub fn setParameter(self: *LufsNormPlugin, index: i32, value: f32) void {
        if (index == 0) {
            self.target_lufs = -24.0 + (value * 16.0);
        }
    }

    pub fn getParameter(self: *LufsNormPlugin, index: i32) f32 {
        if (index == 0) return (self.target_lufs + 24.0) / 16.0;
        return 0.0;
    }
};

fn impl_create(allocator: std.mem.Allocator, sample_rate: f32) ?*anyopaque {
    if (LufsNormPlugin.init(allocator, sample_rate)) |ptr| {
        return ptr;
    } else |_| {
        return null;
    }
}

fn impl_destroy(ptr: *anyopaque, allocator: std.mem.Allocator) void {
    const self = @as(*LufsNormPlugin, @ptrCast(@alignCast(ptr)));
    self.deinit(allocator);
}

fn impl_process(ptr: *anyopaque, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
    const self = @as(*LufsNormPlugin, @ptrCast(@alignCast(ptr)));
    self.process(inputs, outputs, frames);
}

fn impl_set_parameter(ptr: *anyopaque, index: i32, value: f32) void {
    const self = @as(*LufsNormPlugin, @ptrCast(@alignCast(ptr)));
    self.setParameter(index, value);
}

fn impl_get_parameter(ptr: *anyopaque, index: i32) f32 {
    const self = @as(*LufsNormPlugin, @ptrCast(@alignCast(ptr)));
    return self.getParameter(index);
}

pub const plugin_impl = struct {
    pub const create = impl_create;
    pub const destroy = impl_destroy;
    pub const process = impl_process;
    pub const set_parameter = impl_set_parameter;
    pub const get_parameter = impl_get_parameter;
};
