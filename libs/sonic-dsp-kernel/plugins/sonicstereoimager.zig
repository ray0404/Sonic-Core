const std = @import("std");
const eq = @import("../modules/eq.zig");

pub const StereoImagerPlugin = struct {
    params: struct {
        low_freq: f32 = 200,
        high_freq: f32 = 4000,
        width_low: f32 = 1.0,
        width_mid: f32 = 1.0,
        width_high: f32 = 1.0,
    },
    sample_rate: f32,

    pub fn init(allocator: std.mem.Allocator, sample_rate: f32) !*StereoImagerPlugin {
        const self = try allocator.create(StereoImagerPlugin);
        self.sample_rate = sample_rate;
        self.params = .{};
        return self;
    }

    pub fn deinit(self: *StereoImagerPlugin, allocator: std.mem.Allocator) void {
        allocator.destroy(self);
    }

    pub fn process(self: *StereoImagerPlugin, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
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
            
            eq.processStereoImager(interleaved[0..total_samples], self.sample_rate, self.params.low_freq, self.params.high_freq, self.params.width_low, self.params.width_mid, self.params.width_high);
            
            for (0..frames) |i| {
                out_l[i] = interleaved[i * 2];
                out_r[i] = interleaved[i * 2 + 1];
            }
        } else {
            @memcpy(out_l, in_l);
            @memcpy(out_r, in_r);
        }
    }

    pub fn setParameter(self: *StereoImagerPlugin, index: i32, value: f32) void {
        switch (index) {
            0 => self.params.low_freq = 20.0 + (value * 980.0),
            1 => self.params.high_freq = 1000.0 + (value * 19000.0),
            2 => self.params.width_low = value * 2.0,
            3 => self.params.width_mid = value * 2.0,
            4 => self.params.width_high = value * 2.0,
            else => {},
        }
    }

    pub fn getParameter(self: *StereoImagerPlugin, index: i32) f32 {
        return switch (index) {
            0 => (self.params.low_freq - 20.0) / 980.0,
            1 => (self.params.high_freq - 1000.0) / 19000.0,
            2 => self.params.width_low / 2.0,
            3 => self.params.width_mid / 2.0,
            4 => self.params.width_high / 2.0,
            else => 0.0,
        };
    }
};

fn impl_create(allocator: std.mem.Allocator, sample_rate: f32) ?*anyopaque {
    if (StereoImagerPlugin.init(allocator, sample_rate)) |ptr| {
        return ptr;
    } else |_| {
        return null;
    }
}

fn impl_destroy(ptr: *anyopaque, allocator: std.mem.Allocator) void {
    const self = @as(*StereoImagerPlugin, @ptrCast(@alignCast(ptr)));
    self.deinit(allocator);
}

fn impl_process(ptr: *anyopaque, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
    const self = @as(*StereoImagerPlugin, @ptrCast(@alignCast(ptr)));
    self.process(inputs, outputs, frames);
}

fn impl_set_parameter(ptr: *anyopaque, index: i32, value: f32) void {
    const self = @as(*StereoImagerPlugin, @ptrCast(@alignCast(ptr)));
    self.setParameter(index, value);
}

fn impl_get_parameter(ptr: *anyopaque, index: i32) f32 {
    const self = @as(*StereoImagerPlugin, @ptrCast(@alignCast(ptr)));
    return self.getParameter(index);
}

pub const plugin_impl = struct {
    pub const create = impl_create;
    pub const destroy = impl_destroy;
    pub const process = impl_process;
    pub const set_parameter = impl_set_parameter;
    pub const get_parameter = impl_get_parameter;
};
