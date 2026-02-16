const std = @import("std");
const dsp = @import("../echovanish.zig");

pub const EchoVanishPlugin = struct {
    reduction: f32,
    tail_ms: f32,
    sample_rate: f32,

    pub fn init(allocator: std.mem.Allocator, sample_rate: f32) !*EchoVanishPlugin {
        const self = try allocator.create(EchoVanishPlugin);
        self.reduction = 0.5;
        self.tail_ms = 150.0;
        self.sample_rate = sample_rate;
        return self;
    }

    pub fn deinit(self: *EchoVanishPlugin, allocator: std.mem.Allocator) void {
        allocator.destroy(self);
    }

    pub fn process(self: *EchoVanishPlugin, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
        const in_l = inputs[0];
        const out_l = outputs[0];
        const out_r = outputs[1];

        // Copy input to output (in-place processing)
        @memcpy(out_l[0..frames], in_l[0..frames]);

        // Process (Mono for now)
        dsp.process_echovanish(out_l, frames, self.sample_rate, self.reduction, self.tail_ms);

        // Copy to Right channel
        @memcpy(out_r[0..frames], out_l[0..frames]);
    }

    pub fn setParameter(self: *EchoVanishPlugin, index: i32, value: f32) void {
        if (index == 0) {
            self.reduction = value; // 0.0 - 1.0
        } else if (index == 1) {
            // Map 0.0-1.0 to 50ms-500ms
            self.tail_ms = 50.0 + (value * 450.0);
        }
    }

    pub fn getParameter(self: *EchoVanishPlugin, index: i32) f32 {
        if (index == 0) {
            return self.reduction;
        } else if (index == 1) {
            return (self.tail_ms - 50.0) / 450.0;
        }
        return 0.0;
    }
};

fn impl_create(allocator: std.mem.Allocator, sample_rate: f32) ?*anyopaque {
    if (EchoVanishPlugin.init(allocator, sample_rate)) |ptr| {
        return ptr;
    } else |_| {
        return null;
    }
}

fn impl_destroy(ptr: *anyopaque, allocator: std.mem.Allocator) void {
    const self = @as(*EchoVanishPlugin, @ptrCast(@alignCast(ptr)));
    self.deinit(allocator);
}

fn impl_process(ptr: *anyopaque, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
    const self = @as(*EchoVanishPlugin, @ptrCast(@alignCast(ptr)));
    self.process(inputs, outputs, frames);
}

fn impl_set_parameter(ptr: *anyopaque, index: i32, value: f32) void {
    const self = @as(*EchoVanishPlugin, @ptrCast(@alignCast(ptr)));
    self.setParameter(index, value);
}

fn impl_get_parameter(ptr: *anyopaque, index: i32) f32 {
    const self = @as(*EchoVanishPlugin, @ptrCast(@alignCast(ptr)));
    return self.getParameter(index);
}

pub const plugin_impl = struct {
    pub const create = impl_create;
    pub const destroy = impl_destroy;
    pub const process = impl_process;
    pub const set_parameter = impl_set_parameter;
    pub const get_parameter = impl_get_parameter;
};
