const std = @import("std");
const dsp = @import("../voice_isolate.zig");

pub const VoiceIsolatePlugin = struct {
    amount: f32,
    sample_rate: f32,

    pub fn init(allocator: std.mem.Allocator, sample_rate: f32) !*VoiceIsolatePlugin {
        const self = try allocator.create(VoiceIsolatePlugin);
        self.amount = 0.5;
        self.sample_rate = sample_rate;
        return self;
    }

    pub fn deinit(self: *VoiceIsolatePlugin, allocator: std.mem.Allocator) void {
        allocator.destroy(self);
    }

    pub fn process(self: *VoiceIsolatePlugin, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
        // Assume stereo input/output
        // Voice Isolate works on mono buffer in-place in current impl?
        // Let's check dsp.process_voiceisolate signature: (ptr: [*]f32, len: usize, amount: f32)
        // It modifies in-place.
        
        const in_l = inputs[0];
        const out_l = outputs[0];
        
        // Copy Input -> Output
        @memcpy(out_l[0..frames], in_l[0..frames]);
        
        // Process In-Place
        dsp.process_voiceisolate(out_l, frames, self.amount);
        
        // Copy L -> R (Dual Mono for now, or process R if needed)
        // If inputs[1] exists, we might want to process it too.
        // For now, let's just copy L to R to ensure output.
        // A safer way is checking if outputs[1] is not null (which we can't easily do with [*] pointer without num_channels context)
        // We assume stereo context from VST3 wrapper.
        const out_r = outputs[1];
        @memcpy(out_r[0..frames], out_l[0..frames]);
    }

    pub fn setParameter(self: *VoiceIsolatePlugin, index: i32, value: f32) void {
        if (index == 0) {
            self.amount = value;
        }
    }

    pub fn getParameter(self: *VoiceIsolatePlugin, index: i32) f32 {
        if (index == 0) {
            return self.amount;
        }
        return 0.0;
    }
};

// Wrapper functions
fn impl_create(allocator: std.mem.Allocator, sample_rate: f32) ?*anyopaque {
    if (VoiceIsolatePlugin.init(allocator, sample_rate)) |ptr| {
        return ptr;
    } else |_| {
        return null;
    }
}

fn impl_destroy(ptr: *anyopaque, allocator: std.mem.Allocator) void {
    const self = @as(*VoiceIsolatePlugin, @ptrCast(@alignCast(ptr)));
    self.deinit(allocator);
}

fn impl_process(ptr: *anyopaque, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
    const self = @as(*VoiceIsolatePlugin, @ptrCast(@alignCast(ptr)));
    self.process(inputs, outputs, frames);
}

fn impl_set_parameter(ptr: *anyopaque, index: i32, value: f32) void {
    const self = @as(*VoiceIsolatePlugin, @ptrCast(@alignCast(ptr)));
    self.setParameter(index, value);
}

fn impl_get_parameter(ptr: *anyopaque, index: i32) f32 {
    const self = @as(*VoiceIsolatePlugin, @ptrCast(@alignCast(ptr)));
    return self.getParameter(index);
}

pub const plugin_impl = struct {
    pub const create = impl_create;
    pub const destroy = impl_destroy;
    pub const process = impl_process;
    pub const set_parameter = impl_set_parameter;
    pub const get_parameter = impl_get_parameter;
};
