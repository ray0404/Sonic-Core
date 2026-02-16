const std = @import("std");
const modulation = @import("../modules/modulation.zig");

pub const TremoloPlugin = struct {
    frequency: f32 = 2.0,
    depth: f32 = 0.5,
    waveform: i32 = 0,
    mix: f32 = 1.0,
    sample_rate: f32,

    pub fn init(allocator: std.mem.Allocator, sample_rate: f32) !*TremoloPlugin {
        const self = try allocator.create(TremoloPlugin);
        self.sample_rate = sample_rate;
        return self;
    }

    pub fn deinit(self: *TremoloPlugin, allocator: std.mem.Allocator) void {
        allocator.destroy(self);
    }

    pub fn process(self: *TremoloPlugin, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
        const in_l = inputs[0][0..frames];
        const in_r = inputs[1][0..frames];
        const out_l = outputs[0][0..frames];
        const out_r = outputs[1][0..frames];

        var interleaved: [1024]f32 = undefined;
        const total_samples = frames * 2;
        
        if (total_samples <= interleaved.len) {
            for (0..frames) |i| {
                interleaved[i * 2] = in_l[i];
                interleaved[i * 2 + 1] = in_r[i];
            }
            
            modulation.processTremolo(interleaved[0..total_samples], self.sample_rate, self.frequency, self.depth, self.waveform, self.mix);
            
            for (0..frames) |i| {
                out_l[i] = interleaved[i * 2];
                out_r[i] = interleaved[i * 2 + 1];
            }
        } else {
            @memcpy(out_l, in_l);
            @memcpy(out_r, in_r);
        }
    }

    pub fn setParameter(self: *TremoloPlugin, index: i32, value: f32) void {
        switch (index) {
            0 => self.frequency = 0.1 + (value * 19.9),
            1 => self.depth = value,
            2 => self.waveform = @intFromFloat(value * 3.0),
            3 => self.mix = value,
            else => {},
        }
    }

    pub fn getParameter(self: *TremoloPlugin, index: i32) f32 {
        return switch (index) {
            0 => (self.frequency - 0.1) / 19.9,
            1 => self.depth,
            2 => @as(f32, @floatFromInt(self.waveform)) / 3.0,
            3 => self.mix,
            else => 0.0,
        };
    }
};

fn impl_create(allocator: std.mem.Allocator, sample_rate: f32) ?*anyopaque {
    if (TremoloPlugin.init(allocator, sample_rate)) |ptr| {
        return ptr;
    } else |_| {
        return null;
    }
}

fn impl_destroy(ptr: *anyopaque, allocator: std.mem.Allocator) void {
    const self = @as(*TremoloPlugin, @ptrCast(@alignCast(ptr)));
    self.deinit(allocator);
}

fn impl_process(ptr: *anyopaque, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
    const self = @as(*TremoloPlugin, @ptrCast(@alignCast(ptr)));
    self.process(inputs, outputs, frames);
}

fn impl_set_parameter(ptr: *anyopaque, index: i32, value: f32) void {
    const self = @as(*TremoloPlugin, @ptrCast(@alignCast(ptr)));
    self.setParameter(index, value);
}

fn impl_get_parameter(ptr: *anyopaque, index: i32) f32 {
    const self = @as(*TremoloPlugin, @ptrCast(@alignCast(ptr)));
    return self.getParameter(index);
}

pub const plugin_impl = struct {
    pub const create = impl_create;
    pub const destroy = impl_destroy;
    pub const process = impl_process;
    pub const set_parameter = impl_set_parameter;
    pub const get_parameter = impl_get_parameter;
};
