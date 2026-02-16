const std = @import("std");
const dsp = @import("../debleed.zig");

pub const DeBleedPlugin = struct {
    sensitivity: f32,
    threshold: f32,
    sample_rate: f32,
    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator, sample_rate: f32) !*DeBleedPlugin {
        const self = try allocator.create(DeBleedPlugin);
        self.sensitivity = 0.5;
        self.threshold = -20.0; // dB
        self.sample_rate = sample_rate;
        self.allocator = allocator;
        return self;
    }

    pub fn deinit(self: *DeBleedPlugin, allocator: std.mem.Allocator) void {
        allocator.destroy(self);
    }

    pub fn process(self: *DeBleedPlugin, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
        // DeBleed requires Sidechain. 
        // We map:
        // Input L (inputs[0]) -> Target (Main Mic)
        // Input R (inputs[1]) -> Source (Bleed Source / Guide Track)
        
        // Output L -> Processed
        // Output R -> Processed (Dual Mono)
        
        const in_target = inputs[0][0..frames];
        // Check if we have a second channel
        // Since we are inside unsafe pointer land, we assume stereo if the host promised it.
        // But if mono, this might crash. 
        // For safety, strictly we should check bus count from C++ side, but we don't have it here.
        // We'll assume the host provides at least 2 channels if we advertise stereo.
        
        // However, checking inputs[1] might be valid if pointer array is large enough.
        const in_source = inputs[1][0..frames];
        
        const out_l = outputs[0][0..frames];
        const out_r = outputs[1][0..frames];

        // Copy Inputs to Outputs first (so we can process in-place on Output buffer if needed, 
        // but debleed.zig takes separate target/source slices)
        
        // Actually dsp.process takes (allocator, target, source, sens, thresh)
        // It modifies 'target' in place.
        // It reads 'source'.
        
        // So we copy Input L to Output L
        @memcpy(out_l, in_target);
        
        // We need a mutable copy of source? No, source is const in standard DSP?
        // dsp.process signature: (..., source: []f32, ...)
        // It expects a slice. `in_source` is a slice of const f32?
        // `inputs` is `[*]const [*]const f32`. So `in_source` is `[]const f32`.
        // `dsp.process` expects `[]f32` (mutable) for source?
        // Let's check debleed.zig again.
        // `pub fn process(..., source: []f32, ...)`
        // It might modify source locally (FFT buffer)?
        // Yes, `math.fft_iterative` modifies buffer in place.
        // So we MUST copy source to a mutable buffer.
        
        // We can use Output R as the temp buffer for Source!
        @memcpy(out_r, in_source);
        
        // Now call process
        // target = out_l
        // source = out_r
        // This will modify out_l (result) and out_r (destroyed by FFT).
        
        // We need to handle the error from dsp.process (it returns !void)
        dsp.process(self.allocator, out_l, out_r, self.sensitivity, self.threshold) catch |err| {
            // Handle allocation failure or other errors
            // Just silence output?
            @memset(out_l, 0);
        };
        
        // Output R is now garbage (FFT of source).
        // We should copy the result (Out L) to Out R to make it Dual Mono output.
        @memcpy(out_r, out_l);
    }

    pub fn setParameter(self: *DeBleedPlugin, index: i32, value: f32) void {
        if (index == 0) {
            self.sensitivity = value;
        } else if (index == 1) {
            // Map 0-1 to -60dB to 0dB
            self.threshold = (value * 60.0) - 60.0;
        }
    }

    pub fn getParameter(self: *DeBleedPlugin, index: i32) f32 {
        if (index == 0) return self.sensitivity;
        if (index == 1) return (self.threshold + 60.0) / 60.0;
        return 0.0;
    }
};

fn impl_create(allocator: std.mem.Allocator, sample_rate: f32) ?*anyopaque {
    if (DeBleedPlugin.init(allocator, sample_rate)) |ptr| {
        return ptr;
    } else |_| {
        return null;
    }
}

fn impl_destroy(ptr: *anyopaque, allocator: std.mem.Allocator) void {
    const self = @as(*DeBleedPlugin, @ptrCast(@alignCast(ptr)));
    self.deinit(allocator);
}

fn impl_process(ptr: *anyopaque, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
    const self = @as(*DeBleedPlugin, @ptrCast(@alignCast(ptr)));
    self.process(inputs, outputs, frames);
}

fn impl_set_parameter(ptr: *anyopaque, index: i32, value: f32) void {
    const self = @as(*DeBleedPlugin, @ptrCast(@alignCast(ptr)));
    self.setParameter(index, value);
}

fn impl_get_parameter(ptr: *anyopaque, index: i32) f32 {
    const self = @as(*DeBleedPlugin, @ptrCast(@alignCast(ptr)));
    return self.getParameter(index);
}

pub const plugin_impl = struct {
    pub const create = impl_create;
    pub const destroy = impl_destroy;
    pub const process = impl_process;
    pub const set_parameter = impl_set_parameter;
    pub const get_parameter = impl_get_parameter;
};
