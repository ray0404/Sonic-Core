const std = @import("std");

const AllPass = struct {
    x1: f32 = 0,
    y1: f32 = 0,
    c: f32,

    fn process(self: *AllPass, input: f32) f32 {
        const output = self.c * input + self.x1 - self.c * self.y1;
        self.x1 = input;
        self.y1 = output;
        return output;
    }
};

pub const PhaseRotatePlugin = struct {
    filters: [4]AllPass,

    pub fn init(allocator: std.mem.Allocator, sample_rate: f32) !*PhaseRotatePlugin {
        _ = sample_rate;
        const self = try allocator.create(PhaseRotatePlugin);
        self.filters = [_]AllPass{
            .{ .c = 0.4 },
            .{ .c = -0.4 },
            .{ .c = 0.6 },
            .{ .c = -0.6 },
        };
        return self;
    }

    pub fn deinit(self: *PhaseRotatePlugin, allocator: std.mem.Allocator) void {
        allocator.destroy(self);
    }

    pub fn process(self: *PhaseRotatePlugin, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
        const in_l = inputs[0][0..frames];
        const out_l = outputs[0][0..frames];
        const out_r = outputs[1][0..frames];

        for (in_l, 0..) |s, i| {
            var val = s;
            for (&self.filters) |*f| {
                val = f.process(val);
            }
            out_l[i] = val;
            out_r[i] = val;
        }
    }

    pub fn setParameter(self: *PhaseRotatePlugin, index: i32, value: f32) void {
        _ = self; _ = index; _ = value;
    }

    pub fn getParameter(self: *PhaseRotatePlugin, index: i32) f32 {
        _ = self; _ = index; return 0.0;
    }
};

fn impl_create(allocator: std.mem.Allocator, sample_rate: f32) ?*anyopaque {
    if (PhaseRotatePlugin.init(allocator, sample_rate)) |ptr| {
        return ptr;
    } else |_| {
        return null;
    }
}

fn impl_destroy(ptr: *anyopaque, allocator: std.mem.Allocator) void {
    const self = @as(*PhaseRotatePlugin, @ptrCast(@alignCast(ptr)));
    self.deinit(allocator);
}

fn impl_process(ptr: *anyopaque, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
    const self = @as(*PhaseRotatePlugin, @ptrCast(@alignCast(ptr)));
    self.process(inputs, outputs, frames);
}

fn impl_set_parameter(ptr: *anyopaque, index: i32, value: f32) void {
    const self = @as(*PhaseRotatePlugin, @ptrCast(@alignCast(ptr)));
    self.setParameter(index, value);
}

fn impl_get_parameter(ptr: *anyopaque, index: i32) f32 {
    const self = @as(*PhaseRotatePlugin, @ptrCast(@alignCast(ptr)));
    return self.getParameter(index);
}

pub const plugin_impl = struct {
    pub const create = impl_create;
    pub const destroy = impl_destroy;
    pub const process = impl_process;
    pub const set_parameter = impl_set_parameter;
    pub const get_parameter = impl_get_parameter;
};
