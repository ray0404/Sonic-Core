const std = @import("std");
const PluginModule = @import("plugin_impl");

// The plugin module must export 'plugin_impl' struct
// plugin_impl must have: create, destroy, process, set_parameter, get_parameter.
const PluginImpl = PluginModule.plugin_impl;

// Global allocator for the DLL
var gpa = std.heap.GeneralPurposeAllocator(.{}){};
const allocator = gpa.allocator();

export fn plugin_create(sample_rate: f32) ?*anyopaque {
    return PluginImpl.create(allocator, sample_rate);
}

export fn plugin_destroy(instance: *anyopaque) void {
    PluginImpl.destroy(instance, allocator);
}

export fn plugin_process(instance: *anyopaque, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
    PluginImpl.process(instance, inputs, outputs, frames);
}

export fn plugin_set_parameter(instance: *anyopaque, index: i32, value: f32) void {
    PluginImpl.set_parameter(instance, index, value);
}

export fn plugin_get_parameter(instance: *anyopaque, index: i32) f32 {
    return PluginImpl.get_parameter(instance, index);
}
