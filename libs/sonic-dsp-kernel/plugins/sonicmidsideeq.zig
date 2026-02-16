const std = @import("std");
const eq = @import("../modules/eq.zig");

pub const MidSideEQPlugin = struct {
    mid_gain: f32 = 0,
    mid_freq: f32 = 1000,
    side_gain: f32 = 0,
    side_freq: f32 = 1000,
    sample_rate: f32,

    pub fn init(allocator: std.mem.Allocator, sample_rate: f32) !*MidSideEQPlugin {
        const self = try allocator.create(MidSideEQPlugin);
        self.sample_rate = sample_rate;
        self.mid_gain = 0;
        self.mid_freq = 1000;
        self.side_gain = 0;
        self.side_freq = 1000;
        return self;
    }

    pub fn deinit(self: *MidSideEQPlugin, allocator: std.mem.Allocator) void {
        allocator.destroy(self);
    }

    pub fn process(self: *MidSideEQPlugin, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
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
            
            eq.processMidSideEQ(interleaved[0..total_samples], self.sample_rate, self.mid_gain, self.mid_freq, self.side_gain, self.side_freq);
            
            for (0..frames) |i| {
                out_l[i] = interleaved[i * 2];
                out_r[i] = interleaved[i * 2 + 1];
            }
        } else {
            @memcpy(out_l, in_l);
            @memcpy(out_r, in_r);
        }
    }

    pub fn setParameter(self: *MidSideEQPlugin, index: i32, value: f32) void {
        switch (index) {
            0 => self.mid_gain = (value * 30.0) - 15.0,
            1 => self.mid_freq = 20.0 + (value * 19980.0),
            2 => self.side_gain = (value * 30.0) - 15.0,
            3 => self.side_freq = 20.0 + (value * 19980.0),
            else => {},
        }
    }

    pub fn getParameter(self: *MidSideEQPlugin, index: i32) f32 {
        return switch (index) {
            0 => (self.mid_gain + 15.0) / 30.0,
            1 => (self.mid_freq - 20.0) / 19980.0,
            2 => (self.side_gain + 15.0) / 30.0,
            3 => (self.side_freq - 20.0) / 19980.0,
            else => 0.0,
        };
    }
};

fn impl_create(allocator: std.mem.Allocator, sample_rate: f32) ?*anyopaque {
    if (MidSideEQPlugin.init(allocator, sample_rate)) |ptr| {
        return ptr;
    } else |_| {
        return null;
    }
}

fn impl_destroy(ptr: *anyopaque, allocator: std.mem.Allocator) void {
    const self = @as(*MidSideEQPlugin, @ptrCast(@alignCast(ptr)));
    self.deinit(allocator);
}

fn impl_process(ptr: *anyopaque, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
    const self = @as(*MidSideEQPlugin, @ptrCast(@alignCast(ptr)));
    self.process(inputs, outputs, frames);
}

fn impl_set_parameter(ptr: *anyopaque, index: i32, value: f32) void {
    const self = @as(*MidSideEQPlugin, @ptrCast(@alignCast(ptr)));
    self.setParameter(index, value);
}

fn impl_get_parameter(ptr: *anyopaque, index: i32) f32 {
    const self = @as(*MidSideEQPlugin, @ptrCast(@alignCast(ptr)));
    return self.getParameter(index);
}

pub const plugin_impl = struct {
    pub const create = impl_create;
    pub const destroy = impl_destroy;
    pub const process = impl_process;
    pub const set_parameter = impl_set_parameter;
    pub const get_parameter = impl_get_parameter;
};
