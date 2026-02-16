const std = @import("std");
const creative = @import("../modules/creative.zig");

pub const BitcrusherPlugin = struct {
    bits: f32 = 16,
    norm_freq: f32 = 1.0,
    mix: f32 = 1.0,

    pub fn init(allocator: std.mem.Allocator, sample_rate: f32) !*BitcrusherPlugin {
        _ = sample_rate;
        const self = try allocator.create(BitcrusherPlugin);
        self.* = .{};
        return self;
    }

    pub fn deinit(self: *BitcrusherPlugin, allocator: std.mem.Allocator) void {
        allocator.destroy(self);
    }

    pub fn process(self: *BitcrusherPlugin, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
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
            
            creative.processBitcrusher(interleaved[0..total_samples], self.bits, self.norm_freq, self.mix);
            
            for (0..frames) |i| {
                out_l[i] = interleaved[i * 2];
                out_r[i] = interleaved[i * 2 + 1];
            }
        } else {
            @memcpy(out_l, in_l);
            @memcpy(out_r, in_r);
        }
    }

    pub fn setParameter(self: *BitcrusherPlugin, index: i32, value: f32) void {
        switch (index) {
            0 => self.bits = 1.0 + (value * 15.0),
            1 => self.norm_freq = 0.01 + (value * 0.99),
            2 => self.mix = value,
            else => {},
        }
    }

    pub fn getParameter(self: *BitcrusherPlugin, index: i32) f32 {
        return switch (index) {
            0 => (self.bits - 1.0) / 15.0,
            1 => (self.norm_freq - 0.01) / 0.99,
            2 => self.mix,
            else => 0.0,
        };
    }
};

fn impl_create(allocator: std.mem.Allocator, sample_rate: f32) ?*anyopaque {
    if (BitcrusherPlugin.init(allocator, sample_rate)) |ptr| {
        return ptr;
    } else |_| {
        return null;
    }
}

fn impl_destroy(ptr: *anyopaque, allocator: std.mem.Allocator) void {
    const self = @as(*BitcrusherPlugin, @ptrCast(@alignCast(ptr)));
    self.deinit(allocator);
}

fn impl_process(ptr: *anyopaque, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
    const self = @as(*BitcrusherPlugin, @ptrCast(@alignCast(ptr)));
    self.process(inputs, outputs, frames);
}

fn impl_set_parameter(ptr: *anyopaque, index: i32, value: f32) void {
    const self = @as(*BitcrusherPlugin, @ptrCast(@alignCast(ptr)));
    self.setParameter(index, value);
}

fn impl_get_parameter(ptr: *anyopaque, index: i32) f32 {
    const self = @as(*BitcrusherPlugin, @ptrCast(@alignCast(ptr)));
    return self.getParameter(index);
}

pub const plugin_impl = struct {
    pub const create = impl_create;
    pub const destroy = impl_destroy;
    pub const process = impl_process;
    pub const set_parameter = impl_set_parameter;
    pub const get_parameter = impl_get_parameter;
};
