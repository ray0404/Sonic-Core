const std = @import("std");
const time = @import("../modules/time.zig");

pub const ChorusPlugin = struct {
    chorus: time.Chorus,

    pub fn init(allocator: std.mem.Allocator, sample_rate: f32) !*ChorusPlugin {
        const self = try allocator.create(ChorusPlugin);
        self.chorus = time.Chorus{ .sample_rate = sample_rate };
        return self;
    }

    pub fn deinit(self: *ChorusPlugin, allocator: std.mem.Allocator) void {
        allocator.destroy(self);
    }

    pub fn process(self: *ChorusPlugin, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
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
            
            self.chorus.process(interleaved[0..total_samples]);
            
            for (0..frames) |i| {
                out_l[i] = interleaved[i * 2];
                out_r[i] = interleaved[i * 2 + 1];
            }
        } else {
            @memcpy(out_l, in_l);
            @memcpy(out_r, in_r);
        }
    }

    pub fn setParameter(self: *ChorusPlugin, index: i32, value: f32) void {
        switch (index) {
            0 => self.chorus.rate = 0.1 + (value * 9.9), // 0.1 - 10Hz
            1 => self.chorus.base_time = 0.001 + (value * 0.049), // 1ms - 50ms
            2 => self.chorus.depth = value * 0.01, // 0 - 10ms
            3 => self.chorus.feedback = value * 0.9,
            4 => self.chorus.wet = value,
            else => {},
        }
    }

    pub fn getParameter(self: *ChorusPlugin, index: i32) f32 {
        return switch (index) {
            0 => (self.chorus.rate - 0.1) / 9.9,
            1 => (self.chorus.base_time - 0.001) / 0.049,
            2 => self.chorus.depth / 0.01,
            3 => self.chorus.feedback / 0.9,
            4 => self.chorus.wet,
            else => 0.0,
        };
    }
};

fn impl_create(allocator: std.mem.Allocator, sample_rate: f32) ?*anyopaque {
    if (ChorusPlugin.init(allocator, sample_rate)) |ptr| {
        return ptr;
    } else |_| {
        return null;
    }
}

fn impl_destroy(ptr: *anyopaque, allocator: std.mem.Allocator) void {
    const self = @as(*ChorusPlugin, @ptrCast(@alignCast(ptr)));
    self.deinit(allocator);
}

fn impl_process(ptr: *anyopaque, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
    const self = @as(*ChorusPlugin, @ptrCast(@alignCast(ptr)));
    self.process(inputs, outputs, frames);
}

fn impl_set_parameter(ptr: *anyopaque, index: i32, value: f32) void {
    const self = @as(*ChorusPlugin, @ptrCast(@alignCast(ptr)));
    self.setParameter(index, value);
}

fn impl_get_parameter(ptr: *anyopaque, index: i32) f32 {
    const self = @as(*ChorusPlugin, @ptrCast(@alignCast(ptr)));
    return self.getParameter(index);
}

pub const plugin_impl = struct {
    pub const create = impl_create;
    pub const destroy = impl_destroy;
    pub const process = impl_process;
    pub const set_parameter = impl_set_parameter;
    pub const get_parameter = impl_get_parameter;
};
