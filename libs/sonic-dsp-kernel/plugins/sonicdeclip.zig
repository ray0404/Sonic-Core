const std = @import("std");
const math = @import("../math_utils.zig");

pub const DeClipPlugin = struct {
    threshold: f32,

    pub fn init(allocator: std.mem.Allocator, sample_rate: f32) !*DeClipPlugin {
        _ = sample_rate;
        const self = try allocator.create(DeClipPlugin);
        self.threshold = 0.95;
        return self;
    }

    pub fn deinit(self: *DeClipPlugin, allocator: std.mem.Allocator) void {
        allocator.destroy(self);
    }

    pub fn process(self: *DeClipPlugin, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
        const in_l = inputs[0][0..frames];
        const out_l = outputs[0][0..frames];
        const out_r = outputs[1][0..frames];

        @memcpy(out_l, in_l);

        var i: usize = 0;
        while (i < frames) {
            if (@abs(out_l[i]) >= self.threshold) {
                const start = i;
                var end = i;
                while (end < frames and @abs(out_l[end]) >= self.threshold) : (end += 1) {}
                if (end - start >= 3) {
                    if (start >= 2 and end + 2 < frames) {
                        const p0 = out_l[start - 2];
                        const p1 = out_l[start - 1];
                        const p2 = out_l[end];
                        const p3 = out_l[end + 1];
                        const range = @as(f32, @floatFromInt(end - start + 1));
                        var j: usize = 0;
                        while (j < (end - start)) : (j += 1) {
                            const t = @as(f32, @floatFromInt(j + 1)) / range;
                            out_l[start + j] = math.cubicHermite(p0, p1, p2, p3, t);
                        }
                    }
                }
                i = end;
            } else {
                i += 1;
            }
        }
        
        @memcpy(out_r, out_l);
    }

    pub fn setParameter(self: *DeClipPlugin, index: i32, value: f32) void {
        if (index == 0) {
            self.threshold = 0.5 + (value * 0.5); // 0.5 to 1.0
        }
    }

    pub fn getParameter(self: *DeClipPlugin, index: i32) f32 {
        if (index == 0) return (self.threshold - 0.5) / 0.5;
        return 0.0;
    }
};

fn impl_create(allocator: std.mem.Allocator, sample_rate: f32) ?*anyopaque {
    if (DeClipPlugin.init(allocator, sample_rate)) |ptr| {
        return ptr;
    } else |_| {
        return null;
    }
}

fn impl_destroy(ptr: *anyopaque, allocator: std.mem.Allocator) void {
    const self = @as(*DeClipPlugin, @ptrCast(@alignCast(ptr)));
    self.deinit(allocator);
}

fn impl_process(ptr: *anyopaque, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
    const self = @as(*DeClipPlugin, @ptrCast(@alignCast(ptr)));
    self.process(inputs, outputs, frames);
}

fn impl_set_parameter(ptr: *anyopaque, index: i32, value: f32) void {
    const self = @as(*DeClipPlugin, @ptrCast(@alignCast(ptr)));
    self.setParameter(index, value);
}

fn impl_get_parameter(ptr: *anyopaque, index: i32) f32 {
    const self = @as(*DeClipPlugin, @ptrCast(@alignCast(ptr)));
    return self.getParameter(index);
}

pub const plugin_impl = struct {
    pub const create = impl_create;
    pub const destroy = impl_destroy;
    pub const process = impl_process;
    pub const set_parameter = impl_set_parameter;
    pub const get_parameter = impl_get_parameter;
};
