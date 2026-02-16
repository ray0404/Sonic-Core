const std = @import("std");
const dsp = @import("../tape_stabilizer.zig");

pub const TapeStabilizerPlugin = struct {
    nominal_freq: f32,
    scan_min: f32,
    scan_max: f32,
    correction: f32,
    sample_rate: f32,

    pub fn init(allocator: std.mem.Allocator, sample_rate: f32) !*TapeStabilizerPlugin {
        const self = try allocator.create(TapeStabilizerPlugin);
        self.nominal_freq = 60.0;
        self.scan_min = 55.0;
        self.scan_max = 65.0;
        self.correction = 1.0;
        self.sample_rate = sample_rate;
        return self;
    }

    pub fn deinit(self: *TapeStabilizerPlugin, allocator: std.mem.Allocator) void {
        allocator.destroy(self);
    }

    pub fn process(self: *TapeStabilizerPlugin, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
        const in_l = inputs[0];
        const out_l = outputs[0];
        const out_r = outputs[1];

        // Copy Input -> Output
        @memcpy(out_l[0..frames], in_l[0..frames]);

        // Tape Stabilizer is an offline/lookahead process that modifies a buffer.
        // In a real-time context (VST3 process block), this is extremely difficult 
        // because it changes the length of the audio (pitch correction via resampling).
        
        // For the VST3 wrapper, we treat it as a passthrough or a very limited 
        // block-based corrector (which will glitch).
        
        // dsp.process_tapestabilizer(out_l, frames, self.sample_rate, self.nominal_freq, self.scan_min, self.scan_max, self.correction);

        // Dual Mono
        @memcpy(out_r[0..frames], out_l[0..frames]);
    }

    pub fn setParameter(self: *TapeStabilizerPlugin, index: i32, value: f32) void {
        if (index == 0) self.nominal_freq = 40.0 + (value * 60.0); // 40-100Hz
        if (index == 1) self.correction = value;
    }

    pub fn getParameter(self: *TapeStabilizerPlugin, index: i32) f32 {
        if (index == 0) return (self.nominal_freq - 40.0) / 60.0;
        if (index == 1) return self.correction;
        return 0.0;
    }
};

fn impl_create(allocator: std.mem.Allocator, sample_rate: f32) ?*anyopaque {
    if (TapeStabilizerPlugin.init(allocator, sample_rate)) |ptr| {
        return ptr;
    } else |_| {
        return null;
    }
}

fn impl_destroy(ptr: *anyopaque, allocator: std.mem.Allocator) void {
    const self = @as(*TapeStabilizerPlugin, @ptrCast(@alignCast(ptr)));
    self.deinit(allocator);
}

fn impl_process(ptr: *anyopaque, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
    const self = @as(*TapeStabilizerPlugin, @ptrCast(@alignCast(ptr)));
    self.process(inputs, outputs, frames);
}

fn impl_set_parameter(ptr: *anyopaque, index: i32, value: f32) void {
    const self = @as(*TapeStabilizerPlugin, @ptrCast(@alignCast(ptr)));
    self.setParameter(index, value);
}

fn impl_get_parameter(ptr: *anyopaque, index: i32) f32 {
    const self = @as(*TapeStabilizerPlugin, @ptrCast(@alignCast(ptr)));
    return self.getParameter(index);
}

pub const plugin_impl = struct {
    pub const create = impl_create;
    pub const destroy = impl_destroy;
    pub const process = impl_process;
    pub const set_parameter = impl_set_parameter;
    pub const get_parameter = impl_get_parameter;
};
