const std = @import("std");

pub const PluginInterface = struct {
    /// Create a new instance of the plugin
    create: *const fn (allocator: std.mem.Allocator, sample_rate: f32) ?*anyopaque,
    
    /// Process a block of audio
    /// inputs: array of input channel pointers
    /// outputs: array of output channel pointers
    /// frames: number of samples per channel
    process: *const fn (instance: *anyopaque, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void,
    
    /// Update a parameter
    set_parameter: *const fn (instance: *anyopaque, index: i32, value: f32) void,
    
    /// Get a parameter value
    get_parameter: *const fn (instance: *anyopaque, index: i32) f32,
    
    /// Destroy the instance
    destroy: *const fn (instance: *anyopaque, allocator: std.mem.Allocator) void,
};
