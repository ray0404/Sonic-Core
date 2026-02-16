const std = @import("std");
const modulation = @import("../modules/modulation.zig");

pub const PhaserPlugin = struct {
    stages: i32 = 4,
    frequency: f32 = 0.5,
    base_freq: f32 = 440,
    octaves: f32 = 2,
    wet: f32 = 0.5,
    sample_rate: f32,

    pub fn init(allocator: std.mem.Allocator, sample_rate: f32) !*PhaserPlugin {
        const self = try allocator.create(PhaserPlugin);
        self.sample_rate = sample_rate;
        return self;
    }

    pub fn deinit(self: *PhaserPlugin, allocator: std.mem.Allocator) void {
        allocator.destroy(self);
    }

    pub fn process(self: *PhaserPlugin, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
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
            
            modulation.processPhaser(interleaved[0..total_samples], self.sample_rate, self.stages, self.frequency, self.base_freq, self.octaves, self.wet);
            
            for (0..frames) |i| {
                out_l[i] = interleaved[i * 2];
                out_r[i] = interleaved[i * 2 + 1];
            }
        } else {
            @memcpy(out_l, in_l);
            @memcpy(out_r, in_r);
        }
    }

    pub fn setParameter(self: *PhaserPlugin, index: i32, value: f32) void {
        switch (index) {
            0 => self.stages = 2 + @as(i32, @intFromFloat(value * 10.0)),
            1 => self.frequency = value * 5.0,
            2 => self.base_freq = 100.0 + (value * 900.0),
            3 => self.octaves = 0.5 + (value * 5.5),
            4 => self.wet = value,
            else => {},
        }
    }

    pub fn getParameter(self: *PhaserPlugin, index: i32) f32 {
        return switch (index) {
            0 => @as(f32, @floatFromInt(self.stages - 2)) / 10.0,
            1 => self.frequency / 5.0,
            2 => (self.base_freq - 100.0) / 900.0,
            3 => (self.octaves - 0.5) / 5.5,
            4 => self.wet,
            else => 0.0,
        };
    }
};

fn impl_create(allocator: std.mem.Allocator, sample_rate: f32) ?*anyopaque {
    if (PhaserPlugin.init(allocator, sample_rate)) |ptr| {
        return ptr;
    } else |_| {
        return null;
    }
}

fn impl_destroy(ptr: *anyopaque, allocator: std.mem.Allocator) void {
    const self = @as(*PhaserPlugin, @ptrCast(@alignCast(ptr)));
    self.deinit(allocator);
}

fn impl_process(ptr: *anyopaque, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
    const self = @as(*PhaserPlugin, @ptrCast(@alignCast(ptr)));
    self.process(inputs, outputs, frames);
}

fn impl_set_parameter(ptr: *anyopaque, index: i32, value: f32) void {
    const self = @as(*PhaserPlugin, @ptrCast(@alignCast(ptr)));
    self.setParameter(index, value);
}

fn impl_get_parameter(ptr: *anyopaque, index: i32) f32 {
    const self = @as(*PhaserPlugin, @ptrCast(@alignCast(ptr)));
    return self.getParameter(index);
}

pub const plugin_impl = struct {
    pub const create = impl_create;
    pub const destroy = impl_destroy;
    pub const process = impl_process;
    pub const set_parameter = impl_set_parameter;
    pub const get_parameter = impl_get_parameter;
};
