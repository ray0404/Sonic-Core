const std = @import("std");

pub const GainPlugin = struct {
    gain: f32,
    sample_rate: f32,

    pub fn init(allocator: std.mem.Allocator, sample_rate: f32) !*GainPlugin {
        const self = try allocator.create(GainPlugin);
        self.gain = 1.0;
        self.sample_rate = sample_rate;
        return self;
    }

    pub fn deinit(self: *GainPlugin, allocator: std.mem.Allocator) void {
        allocator.destroy(self);
    }

    pub fn process(self: *GainPlugin, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
        const in_l = inputs[0];
        const in_r = inputs[1];
        const out_l = outputs[0];
        const out_r = outputs[1];
        
        for (0..frames) |i| {
            out_l[i] = in_l[i] * self.gain;
            out_r[i] = in_r[i] * self.gain;
        }
    }

    pub fn setParameter(self: *GainPlugin, index: i32, value: f32) void {
        if (index == 0) {
            self.gain = value;
        }
    }

    pub fn getParameter(self: *GainPlugin, index: i32) f32 {
        if (index == 0) {
            return self.gain;
        }
        return 0.0;
    }
};

// wrapper functions to match interface signatures
fn impl_create(allocator: std.mem.Allocator, sample_rate: f32) ?*anyopaque {
    if (GainPlugin.init(allocator, sample_rate)) |ptr| {
        return ptr;
    } else |_| {
        return null;
    }
}

fn impl_destroy(ptr: *anyopaque, allocator: std.mem.Allocator) void {
    const self = @as(*GainPlugin, @ptrCast(@alignCast(ptr)));
    self.deinit(allocator);
}

fn impl_process(ptr: *anyopaque, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
    const self = @as(*GainPlugin, @ptrCast(@alignCast(ptr)));
    self.process(inputs, outputs, frames);
}

fn impl_set_parameter(ptr: *anyopaque, index: i32, value: f32) void {
    const self = @as(*GainPlugin, @ptrCast(@alignCast(ptr)));
    self.setParameter(index, value);
}

fn impl_get_parameter(ptr: *anyopaque, index: i32) f32 {
    const self = @as(*GainPlugin, @ptrCast(@alignCast(ptr)));
    return self.getParameter(index);
}

pub const plugin_impl = struct {
    pub const create = impl_create;
    pub const destroy = impl_destroy;
    pub const process = impl_process;
    pub const set_parameter = impl_set_parameter;
    pub const get_parameter = impl_get_parameter;
};
