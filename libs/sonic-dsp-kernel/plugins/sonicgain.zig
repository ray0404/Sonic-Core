const std = @import("std");
const GainStage = @import("../dsp/gain_stage.zig").GainStage;

pub const GainPlugin = struct {
    gain_stage: GainStage,
    sample_rate: f32,

    pub fn init(allocator: std.mem.Allocator, sample_rate: f32) !*GainPlugin {
        const self = try allocator.create(GainPlugin);
        self.gain_stage = GainStage.init(1.0);
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
        
        // Copy inputs to outputs first (it's an in-place-ish system)
        @memcpy(out_l[0..frames], in_l[0..frames]);
        @memcpy(out_r[0..frames], in_r[0..frames]);
        
        // Apply the high-quality gain stage
        self.gain_stage.processStereo(out_l[0..frames], out_r[0..frames]);
    }

    pub fn setParameter(self: *GainPlugin, index: i32, value: f32) void {
        if (index == 0) {
            // value is usually 0.0 to 1.0 (normalized)
            // But for gain we might want a dB range or direct linear.
            // Let's assume normalized 0-1 maps to -60 to +12 dB
            const db = (value * 72.0) - 60.0;
            self.gain_stage.setGainDb(db);
        }
    }

    pub fn getParameter(self: *GainPlugin, index: i32) f32 {
        if (index == 0) {
            // Inverse mapping: (db + 60) / 72
            const db = if (self.gain_stage.target_gain > 0.0001) 20.0 * std.math.log10(f32, self.gain_stage.target_gain) else -60.0;
            return std.math.clamp((db + 60.0) / 72.0, 0.0, 1.0);
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
