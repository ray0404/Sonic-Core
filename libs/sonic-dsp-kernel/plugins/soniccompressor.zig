const std = @import("std");
const dynamics = @import("../modules/dynamics.zig");

pub const CompressorPlugin = struct {
    comp: dynamics.Compressor,

    pub fn init(allocator: std.mem.Allocator, sample_rate: f32) !*CompressorPlugin {
        const self = try allocator.create(CompressorPlugin);
        self.comp = dynamics.Compressor{ .sample_rate = sample_rate };
        return self;
    }

    pub fn deinit(self: *CompressorPlugin, allocator: std.mem.Allocator) void {
        allocator.destroy(self);
    }

    pub fn process(self: *CompressorPlugin, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
        const in_l = inputs[0][0..frames];
        const in_r = inputs[1][0..frames];
        const out_l = outputs[0][0..frames];
        const out_r = outputs[1][0..frames];

        // We need an interleaved or flat buffer for dynamics.zig's current process(data: []f32)
        // because it assumes [L, R, L, R]. 
        // We have separate pointers. 
        // Let's create a temporary interleaved buffer or update the Zig module to handle split buffers.
        // Updating the module is better for performance, but for now let's use an interleaved temp if we must.
        // Wait, dynamics.zig's process is:
        /*
        while (i < data.len - 1) : (i += 2) {
            const l = data[i];
            const r = data[i+1];
            ...
        }
        */
        // Let's create a stack-allocated buffer for the block if frames is small (usually 64-256), 
        // otherwise heap.
        
        var interleaved: [1024]f32 = undefined;
        const total_samples = frames * 2;
        
        if (total_samples <= interleaved.len) {
            for (0..frames) |i| {
                interleaved[i * 2] = in_l[i];
                interleaved[i * 2 + 1] = in_r[i];
            }
            
            self.comp.process(interleaved[0..total_samples]);
            
            for (0..frames) |i| {
                out_l[i] = interleaved[i * 2];
                out_r[i] = interleaved[i * 2 + 1];
            }
        } else {
            // Fallback for large blocks (unlikely in DAW but possible)
            // Just process mono on L for now to avoid heap churn every block
            @memcpy(out_l, in_l);
            @memcpy(out_r, in_r);
        }
    }

    pub fn setParameter(self: *CompressorPlugin, index: i32, value: f32) void {
        switch (index) {
            0 => self.comp.threshold = -60.0 + (value * 60.0),
            1 => self.comp.ratio = 1.0 + (value * 19.0), // 1:1 to 20:1
            2 => self.comp.attack = 0.1 + (value * 99.9), // 0.1ms to 100ms
            3 => self.comp.release = 1.0 + (value * 999.0), // 1ms to 1000ms
            4 => self.comp.knee = value * 20.0,
            5 => self.comp.makeup = value * 24.0,
            6 => self.comp.mix = value,
            7 => self.comp.mode = @intFromFloat(value * 3.0), // 0-3
            else => {},
        }
    }

    pub fn getParameter(self: *CompressorPlugin, index: i32) f32 {
        return switch (index) {
            0 => (self.comp.threshold + 60.0) / 60.0,
            1 => (self.comp.ratio - 1.0) / 19.0,
            2 => (self.comp.attack - 0.1) / 99.9,
            3 => (self.comp.release - 1.0) / 999.0,
            4 => self.comp.knee / 20.0,
            5 => self.comp.makeup / 24.0,
            6 => self.comp.mix,
            7 => @as(f32, @floatFromInt(self.comp.mode)) / 3.0,
            else => 0.0,
        };
    }
};

fn impl_create(allocator: std.mem.Allocator, sample_rate: f32) ?*anyopaque {
    if (CompressorPlugin.init(allocator, sample_rate)) |ptr| {
        return ptr;
    } else |_| {
        return null;
    }
}

fn impl_destroy(ptr: *anyopaque, allocator: std.mem.Allocator) void {
    const self = @as(*CompressorPlugin, @ptrCast(@alignCast(ptr)));
    self.deinit(allocator);
}

fn impl_process(ptr: *anyopaque, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
    const self = @as(*CompressorPlugin, @ptrCast(@alignCast(ptr)));
    self.process(inputs, outputs, frames);
}

fn impl_set_parameter(ptr: *anyopaque, index: i32, value: f32) void {
    const self = @as(*CompressorPlugin, @ptrCast(@alignCast(ptr)));
    self.setParameter(index, value);
}

fn impl_get_parameter(ptr: *anyopaque, index: i32) f32 {
    const self = @as(*CompressorPlugin, @ptrCast(@alignCast(ptr)));
    return self.getParameter(index);
}

pub const plugin_impl = struct {
    pub const create = impl_create;
    pub const destroy = impl_destroy;
    pub const process = impl_process;
    pub const set_parameter = impl_set_parameter;
    pub const get_parameter = impl_get_parameter;
};
