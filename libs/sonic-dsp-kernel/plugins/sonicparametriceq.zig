const std = @import("std");
const filters = @import("../dsp/filters.zig");

pub const ParametricEQPlugin = struct {
    filters_l: [3]filters.Biquad,
    filters_r: [3]filters.Biquad,
    
    params: struct {
        low_freq: f32 = 100,
        low_gain: f32 = 0,
        mid_freq: f32 = 1000,
        mid_gain: f32 = 0,
        mid_q: f32 = 1.0,
        high_freq: f32 = 5000,
        high_gain: f32 = 0,
    },
    sample_rate: f32,

    pub fn init(allocator: std.mem.Allocator, sample_rate: f32) !*ParametricEQPlugin {
        const self = try allocator.create(ParametricEQPlugin);
        self.sample_rate = sample_rate;
        self.filters_l = [_]filters.Biquad{.{}} ** 3;
        self.filters_r = [_]filters.Biquad{.{}} ** 3;
        self.params = .{};
        self.updateFilters();
        return self;
    }

    fn updateFilters(self: *ParametricEQPlugin) void {
        self.filters_l[0].setParams(.lowshelf, self.params.low_freq, self.params.low_gain, 0.707, self.sample_rate);
        self.filters_l[1].setParams(.peaking, self.params.mid_freq, self.params.mid_gain, self.params.mid_q, self.sample_rate);
        self.filters_l[2].setParams(.highshelf, self.params.high_freq, self.params.high_gain, 0.707, self.sample_rate);
        
        self.filters_r[0].setParams(.lowshelf, self.params.low_freq, self.params.low_gain, 0.707, self.sample_rate);
        self.filters_r[1].setParams(.peaking, self.params.mid_freq, self.params.mid_gain, self.params.mid_q, self.sample_rate);
        self.filters_r[2].setParams(.highshelf, self.params.high_freq, self.params.high_gain, 0.707, self.sample_rate);
    }

    pub fn deinit(self: *ParametricEQPlugin, allocator: std.mem.Allocator) void {
        allocator.destroy(self);
    }

    pub fn process(self: *ParametricEQPlugin, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
        const in_l = inputs[0];
        const in_r = inputs[1];
        const out_l = outputs[0];
        const out_r = outputs[1];

        for (0..frames) |i| {
            var s_l = in_l[i];
            var s_r = in_r[i];

            inline for (0..3) |j| {
                s_l = self.filters_l[j].process(s_l);
                s_r = self.filters_r[j].process(s_r);
            }

            out_l[i] = s_l;
            out_r[i] = s_r;
        }
    }

    pub fn setParameter(self: *ParametricEQPlugin, index: i32, value: f32) void {
        switch (index) {
            0 => self.params.low_freq = 20.0 + (value * 480.0), // 20-500Hz
            1 => self.params.low_gain = (value * 30.0) - 15.0, // +/- 15dB
            2 => self.params.mid_freq = 200.0 + (value * 4800.0), // 200-5000Hz
            3 => self.params.mid_gain = (value * 30.0) - 15.0,
            4 => self.params.mid_q = 0.1 + (value * 9.9), // 0.1 to 10
            5 => self.params.high_freq = 2000.0 + (value * 18000.0), // 2k-20kHz
            6 => self.params.high_gain = (value * 30.0) - 15.0,
            else => {},
        }
        self.updateFilters();
    }

    pub fn getParameter(self: *ParametricEQPlugin, index: i32) f32 {
        return switch (index) {
            0 => (self.params.low_freq - 20.0) / 480.0,
            1 => (self.params.low_gain + 15.0) / 30.0,
            2 => (self.params.mid_freq - 200.0) / 4800.0,
            3 => (self.params.mid_gain + 15.0) / 30.0,
            4 => (self.params.mid_q - 0.1) / 9.9,
            5 => (self.params.high_freq - 2000.0) / 18000.0,
            6 => (self.params.high_gain + 15.0) / 30.0,
            else => 0.0,
        };
    }
};

fn impl_create(allocator: std.mem.Allocator, sample_rate: f32) ?*anyopaque {
    if (ParametricEQPlugin.init(allocator, sample_rate)) |ptr| {
        return ptr;
    } else |_| {
        return null;
    }
}

fn impl_destroy(ptr: *anyopaque, allocator: std.mem.Allocator) void {
    const self = @as(*ParametricEQPlugin, @ptrCast(@alignCast(ptr)));
    self.deinit(allocator);
}

fn impl_process(ptr: *anyopaque, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
    const self = @as(*ParametricEQPlugin, @ptrCast(@alignCast(ptr)));
    self.process(inputs, outputs, frames);
}

fn impl_set_parameter(ptr: *anyopaque, index: i32, value: f32) void {
    const self = @as(*ParametricEQPlugin, @ptrCast(@alignCast(ptr)));
    self.setParameter(index, value);
}

fn impl_get_parameter(ptr: *anyopaque, index: i32) f32 {
    const self = @as(*ParametricEQPlugin, @ptrCast(@alignCast(ptr)));
    return self.getParameter(index);
}

pub const plugin_impl = struct {
    pub const create = impl_create;
    pub const destroy = impl_destroy;
    pub const process = impl_process;
    pub const set_parameter = impl_set_parameter;
    pub const get_parameter = impl_get_parameter;
};
