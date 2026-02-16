const std = @import("std");
const dsp = @import("../spectralmatch.zig");

pub const SpectralMatchPlugin = struct {
    amount: f32,
    sample_rate: f32,
    ref_analysis: ?*dsp.AnalysisResult,

    pub fn init(allocator: std.mem.Allocator, sample_rate: f32) !*SpectralMatchPlugin {
        const self = try allocator.create(SpectralMatchPlugin);
        self.amount = 0.5;
        self.sample_rate = sample_rate;
        self.ref_analysis = null;
        return self;
    }

    pub fn deinit(self: *SpectralMatchPlugin, allocator: std.mem.Allocator) void {
        if (self.ref_analysis) |ref| {
            dsp.spectralmatch_free_analysis(ref);
        }
        allocator.destroy(self);
    }

    pub fn process(self: *SpectralMatchPlugin, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
        const in_l = inputs[0];
        const out_l = outputs[0];
        const out_r = outputs[1];

        // Copy Input -> Output
        @memcpy(out_l[0..frames], in_l[0..frames]);

        // Spectral Match requires a reference analysis.
        // If we don't have one, it's a passthrough.
        if (self.ref_analysis) |ref| {
            dsp.process_spectralmatch(out_l, frames, ref, self.amount, 0.5);
        }

        // Dual Mono
        @memcpy(out_r[0..frames], out_l[0..frames]);
    }

    pub fn setParameter(self: *SpectralMatchPlugin, index: i32, value: f32) void {
        if (index == 0) {
            self.amount = value;
        }
        // index 1 could be used to trigger "Capture Reference" from sidechain?
        // But for now we just handle amount.
    }

    pub fn getParameter(self: *SpectralMatchPlugin, index: i32) f32 {
        if (index == 0) return self.amount;
        return 0.0;
    }
};

fn impl_create(allocator: std.mem.Allocator, sample_rate: f32) ?*anyopaque {
    if (SpectralMatchPlugin.init(allocator, sample_rate)) |ptr| {
        return ptr;
    } else |_| {
        return null;
    }
}

fn impl_destroy(ptr: *anyopaque, allocator: std.mem.Allocator) void {
    const self = @as(*SpectralMatchPlugin, @ptrCast(@alignCast(ptr)));
    self.deinit(allocator);
}

fn impl_process(ptr: *anyopaque, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
    const self = @as(*SpectralMatchPlugin, @ptrCast(@alignCast(ptr)));
    self.process(inputs, outputs, frames);
}

fn impl_set_parameter(ptr: *anyopaque, index: i32, value: f32) void {
    const self = @as(*SpectralMatchPlugin, @ptrCast(@alignCast(ptr)));
    self.setParameter(index, value);
}

fn impl_get_parameter(ptr: *anyopaque, index: i32) f32 {
    const self = @as(*SpectralMatchPlugin, @ptrCast(@alignCast(ptr)));
    return self.getParameter(index);
}

pub const plugin_impl = struct {
    pub const create = impl_create;
    pub const destroy = impl_destroy;
    pub const process = impl_process;
    pub const set_parameter = impl_set_parameter;
    pub const get_parameter = impl_get_parameter;
};
