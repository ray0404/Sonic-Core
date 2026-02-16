const std = @import("std");
const dsp = @import("../plosiveguard.zig");

pub const PlosiveGuardPlugin = struct {
    sensitivity: f32,
    reduction: f32,
    sample_rate: f32,

    pub fn init(allocator: std.mem.Allocator, sample_rate: f32) !*PlosiveGuardPlugin {
        const self = try allocator.create(PlosiveGuardPlugin);
        self.sensitivity = 0.5;
        self.reduction = 0.5;
        self.sample_rate = sample_rate;
        return self;
    }

    pub fn deinit(self: *PlosiveGuardPlugin, allocator: std.mem.Allocator) void {
        allocator.destroy(self);
    }

    pub fn process(self: *PlosiveGuardPlugin, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
        const in_l = inputs[0];
        const out_l = outputs[0];
        const out_r = outputs[1];

        // Copy Input -> Output
        @memcpy(out_l[0..frames], in_l[0..frames]);

        // Process In-Place
        dsp.process_plosiveguard(out_l, frames, self.sample_rate, self.sensitivity, self.reduction);

        // Copy L -> R
        @memcpy(out_r[0..frames], out_l[0..frames]);
    }

    pub fn setParameter(self: *PlosiveGuardPlugin, index: i32, value: f32) void {
        if (index == 0) {
            self.sensitivity = value;
        } else if (index == 1) {
            self.reduction = value;
        }
    }

    pub fn getParameter(self: *PlosiveGuardPlugin, index: i32) f32 {
        if (index == 0) return self.sensitivity;
        if (index == 1) return self.reduction;
        return 0.0;
    }
};

fn impl_create(allocator: std.mem.Allocator, sample_rate: f32) ?*anyopaque {
    if (PlosiveGuardPlugin.init(allocator, sample_rate)) |ptr| {
        return ptr;
    } else |_| {
        return null;
    }
}

fn impl_destroy(ptr: *anyopaque, allocator: std.mem.Allocator) void {
    const self = @as(*PlosiveGuardPlugin, @ptrCast(@alignCast(ptr)));
    self.deinit(allocator);
}

fn impl_process(ptr: *anyopaque, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
    const self = @as(*PlosiveGuardPlugin, @ptrCast(@alignCast(ptr)));
    self.process(inputs, outputs, frames);
}

fn impl_set_parameter(ptr: *anyopaque, index: i32, value: f32) void {
    const self = @as(*PlosiveGuardPlugin, @ptrCast(@alignCast(ptr)));
    self.setParameter(index, value);
}

fn impl_get_parameter(ptr: *anyopaque, index: i32) f32 {
    const self = @as(*PlosiveGuardPlugin, @ptrCast(@alignCast(ptr)));
    return self.getParameter(index);
}

pub const plugin_impl = struct {
    pub const create = impl_create;
    pub const destroy = impl_destroy;
    pub const process = impl_process;
    pub const set_parameter = impl_set_parameter;
    pub const get_parameter = impl_get_parameter;
};
