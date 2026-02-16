const std = @import("std");
const creative = @import("../modules/creative.zig");

pub const SaturationPlugin = struct {
    drive: f32 = 0.5,
    sat_type: i32 = 0,
    out_gain: f32 = 0,
    mix: f32 = 1.0,

    pub fn init(allocator: std.mem.Allocator, sample_rate: f32) !*SaturationPlugin {
        _ = sample_rate;
        const self = try allocator.create(SaturationPlugin);
        self.* = .{};
        return self;
    }

    pub fn deinit(self: *SaturationPlugin, allocator: std.mem.Allocator) void {
        allocator.destroy(self);
    }

    pub fn process(self: *SaturationPlugin, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
        const in_l = inputs[0][0..frames];
        const in_r = inputs[1][0..frames];
        const out_l = outputs[0][0..frames];
        const out_r = outputs[1][0..frames];

        @memcpy(out_l, in_l);
        @memcpy(out_r, in_r);

        creative.processSaturation(out_l, self.drive, self.sat_type, self.out_gain, self.mix);
        creative.processSaturation(out_r, self.drive, self.sat_type, self.out_gain, self.mix);
    }

    pub fn setParameter(self: *SaturationPlugin, index: i32, value: f32) void {
        switch (index) {
            0 => self.drive = value,
            1 => self.sat_type = @intFromFloat(value * 2.0),
            2 => self.out_gain = (value * 40.0) - 20.0,
            3 => self.mix = value,
            else => {},
        }
    }

    pub fn getParameter(self: *SaturationPlugin, index: i32) f32 {
        return switch (index) {
            0 => self.drive,
            1 => @as(f32, @floatFromInt(self.sat_type)) / 2.0,
            2 => (self.out_gain + 20.0) / 40.0,
            3 => self.mix,
            else => 0.0,
        };
    }
};

fn impl_create(allocator: std.mem.Allocator, sample_rate: f32) ?*anyopaque {
    if (SaturationPlugin.init(allocator, sample_rate)) |ptr| {
        return ptr;
    } else |_| {
        return null;
    }
}

fn impl_destroy(ptr: *anyopaque, allocator: std.mem.Allocator) void {
    const self = @as(*SaturationPlugin, @ptrCast(@alignCast(ptr)));
    self.deinit(allocator);
}

fn impl_process(ptr: *anyopaque, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
    const self = @as(*SaturationPlugin, @ptrCast(@alignCast(ptr)));
    self.process(inputs, outputs, frames);
}

fn impl_set_parameter(ptr: *anyopaque, index: i32, value: f32) void {
    const self = @as(*SaturationPlugin, @ptrCast(@alignCast(ptr)));
    self.setParameter(index, value);
}

fn impl_get_parameter(ptr: *anyopaque, index: i32) f32 {
    const self = @as(*SaturationPlugin, @ptrCast(@alignCast(ptr)));
    return self.getParameter(index);
}

pub const plugin_impl = struct {
    pub const create = impl_create;
    pub const destroy = impl_destroy;
    pub const process = impl_process;
    pub const set_parameter = impl_set_parameter;
    pub const get_parameter = impl_get_parameter;
};
