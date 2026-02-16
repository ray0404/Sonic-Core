const std = @import("std");
const creative = @import("../modules/creative.zig");

pub const DitheringPlugin = struct {
    bits: f32 = 16,

    pub fn init(allocator: std.mem.Allocator, sample_rate: f32) !*DitheringPlugin {
        _ = sample_rate;
        const self = try allocator.create(DitheringPlugin);
        self.bits = 16;
        return self;
    }

    pub fn deinit(self: *DitheringPlugin, allocator: std.mem.Allocator) void {
        allocator.destroy(self);
    }

    pub fn process(self: *DitheringPlugin, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
        const in_l = inputs[0][0..frames];
        const in_r = inputs[1][0..frames];
        const out_l = outputs[0][0..frames];
        const out_r = outputs[1][0..frames];

        @memcpy(out_l, in_l);
        @memcpy(out_r, in_r);

        creative.processDithering(out_l, self.bits);
        creative.processDithering(out_r, self.bits);
    }

    pub fn setParameter(self: *DitheringPlugin, index: i32, value: f32) void {
        if (index == 0) {
            self.bits = 4.0 + (value * 20.0); // 4 - 24 bits
        }
    }

    pub fn getParameter(self: *DitheringPlugin, index: i32) f32 {
        if (index == 0) return (self.bits - 4.0) / 20.0;
        return 0.0;
    }
};

fn impl_create(allocator: std.mem.Allocator, sample_rate: f32) ?*anyopaque {
    if (DitheringPlugin.init(allocator, sample_rate)) |ptr| {
        return ptr;
    } else |_| {
        return null;
    }
}

fn impl_destroy(ptr: *anyopaque, allocator: std.mem.Allocator) void {
    const self = @as(*DitheringPlugin, @ptrCast(@alignCast(ptr)));
    self.deinit(allocator);
}

fn impl_process(ptr: *anyopaque, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
    const self = @as(*DitheringPlugin, @ptrCast(@alignCast(ptr)));
    self.process(inputs, outputs, frames);
}

fn impl_set_parameter(ptr: *anyopaque, index: i32, value: f32) void {
    const self = @as(*DitheringPlugin, @ptrCast(@alignCast(ptr)));
    self.setParameter(index, value);
}

fn impl_get_parameter(ptr: *anyopaque, index: i32) f32 {
    const self = @as(*DitheringPlugin, @ptrCast(@alignCast(ptr)));
    return self.getParameter(index);
}

pub const plugin_impl = struct {
    pub const create = impl_create;
    pub const destroy = impl_destroy;
    pub const process = impl_process;
    pub const set_parameter = impl_set_parameter;
    pub const get_parameter = impl_get_parameter;
};
