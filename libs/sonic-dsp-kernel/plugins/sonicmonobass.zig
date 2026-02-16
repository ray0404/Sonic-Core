const std = @import("std");
const math = @import("../math_utils.zig");

pub const MonoBassPlugin = struct {
    freq: f32,
    sample_rate: f32,
    lpf_l1: math.Biquad,
    lpf_l2: math.Biquad,
    lpf_r1: math.Biquad,
    lpf_r2: math.Biquad,
    hpf_l1: math.Biquad,
    hpf_l2: math.Biquad,
    hpf_r1: math.Biquad,
    hpf_r2: math.Biquad,

    pub fn init(allocator: std.mem.Allocator, sample_rate: f32) !*MonoBassPlugin {
        const self = try allocator.create(MonoBassPlugin);
        self.sample_rate = sample_rate;
        self.freq = 150.0;
        self.updateFilters();
        return self;
    }

    fn updateFilters(self: *MonoBassPlugin) void {
        self.lpf_l1 = math.calc_lpf_coeffs(self.freq, self.sample_rate);
        self.lpf_l2 = self.lpf_l1;
        self.lpf_r1 = math.calc_lpf_coeffs(self.freq, self.sample_rate);
        self.lpf_r2 = self.lpf_r1;
        self.hpf_l1 = math.calc_hpf_coeffs(self.freq, self.sample_rate);
        self.hpf_l2 = self.hpf_l1;
        self.hpf_r1 = math.calc_hpf_coeffs(self.freq, self.sample_rate);
        self.hpf_r2 = self.hpf_r1;
    }

    pub fn deinit(self: *MonoBassPlugin, allocator: std.mem.Allocator) void {
        allocator.destroy(self);
    }

    pub fn process(self: *MonoBassPlugin, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
        const in_l = inputs[0][0..frames];
        const in_r = inputs[1][0..frames];
        const out_l = outputs[0][0..frames];
        const out_r = outputs[1][0..frames];

        for (in_l, 0..) |l, i| {
            const r = in_r[i];
            
            var low_l = self.lpf_l1.process(l);
            low_l = self.lpf_l2.process(low_l);
            var low_r = self.lpf_r1.process(r);
            low_r = self.lpf_r2.process(low_r);
            
            const low_mono = (low_l + low_r) * 0.5;
            
            var high_l = self.hpf_l1.process(l);
            high_l = self.hpf_l2.process(high_l);
            var high_r = self.hpf_r1.process(r);
            high_r = self.hpf_r2.process(high_r);
            
            out_l[i] = low_mono + high_l;
            out_r[i] = low_mono + high_r;
        }
    }

    pub fn setParameter(self: *MonoBassPlugin, index: i32, value: f32) void {
        if (index == 0) {
            self.freq = 20.0 + (value * 480.0); // 20-500Hz
            self.updateFilters();
        }
    }

    pub fn getParameter(self: *MonoBassPlugin, index: i32) f32 {
        if (index == 0) return (self.freq - 20.0) / 480.0;
        return 0.0;
    }
};

fn impl_create(allocator: std.mem.Allocator, sample_rate: f32) ?*anyopaque {
    if (MonoBassPlugin.init(allocator, sample_rate)) |ptr| {
        return ptr;
    } else |_| {
        return null;
    }
}

fn impl_destroy(ptr: *anyopaque, allocator: std.mem.Allocator) void {
    const self = @as(*MonoBassPlugin, @ptrCast(@alignCast(ptr)));
    self.deinit(allocator);
}

fn impl_process(ptr: *anyopaque, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
    const self = @as(*MonoBassPlugin, @ptrCast(@alignCast(ptr)));
    self.process(inputs, outputs, frames);
}

fn impl_set_parameter(ptr: *anyopaque, index: i32, value: f32) void {
    const self = @as(*MonoBassPlugin, @ptrCast(@alignCast(ptr)));
    self.setParameter(index, value);
}

fn impl_get_parameter(ptr: *anyopaque, index: i32) f32 {
    const self = @as(*MonoBassPlugin, @ptrCast(@alignCast(ptr)));
    return self.getParameter(index);
}

pub const plugin_impl = struct {
    pub const create = impl_create;
    pub const destroy = impl_destroy;
    pub const process = impl_process;
    pub const set_parameter = impl_set_parameter;
    pub const get_parameter = impl_get_parameter;
};
