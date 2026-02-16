const std = @import("std");
const math = @import("../math_utils.zig");

pub const PsychoDynamicEQPlugin = struct {
    intensity: f32,
    ref_db: f32,
    sample_rate: f32,
    
    rms_energy: f32,
    low_shelf: math.Biquad,
    mid_bell: math.Biquad,
    high_shelf: math.Biquad,

    pub fn init(allocator: std.mem.Allocator, sample_rate: f32) !*PsychoDynamicEQPlugin {
        const self = try allocator.create(PsychoDynamicEQPlugin);
        self.sample_rate = sample_rate;
        self.intensity = 0.5;
        self.ref_db = -16.0;
        self.rms_energy = 0.0000001;
        
        self.low_shelf = math.calc_low_shelf_coeffs(100.0, sample_rate, 0.0);
        self.mid_bell = math.calc_peaking_coeffs(2500.0, sample_rate, 0.0, 1.0);
        self.high_shelf = math.calc_high_shelf_coeffs(10000.0, sample_rate, 0.0);
        
        return self;
    }

    pub fn deinit(self: *PsychoDynamicEQPlugin, allocator: std.mem.Allocator) void {
        allocator.destroy(self);
    }

    pub fn process(self: *PsychoDynamicEQPlugin, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
        const in_l = inputs[0][0..frames];
        const out_l = outputs[0][0..frames];
        const out_r = outputs[1][0..frames];

        const att_coeff = 1.0 - std.math.exp(-1.0 / (0.1 * self.sample_rate));
        const rel_coeff = 1.0 - std.math.exp(-1.0 / (0.5 * self.sample_rate));

        for (in_l, 0..) |s, i| {
            // Level Detection
            const sq = s * s;
            const coeff = if (sq > self.rms_energy) att_coeff else rel_coeff;
            self.rms_energy = self.rms_energy + coeff * (sq - self.rms_energy);
            if (self.rms_energy < 0.0000001) self.rms_energy = 0.0000001;
            
            const current_db = 10.0 * std.math.log10(self.rms_energy);
            var deficit = (self.ref_db - current_db) * self.intensity;
            deficit = std.math.clamp(deficit, -20.0, 20.0);
            
            // Adaptive EQ update
            const gain_low = deficit * 0.4;
            const gain_high = deficit * 0.2;
            const gain_mid = -deficit * 0.1;
            
            const ls = math.calc_low_shelf_coeffs(100.0, self.sample_rate, gain_low);
            const mb = math.calc_peaking_coeffs(2500.0, self.sample_rate, gain_mid, 1.0);
            const hs = math.calc_high_shelf_coeffs(10000.0, self.sample_rate, gain_high);
            
            // Restore filter state (delay lines) while updating coefficients
            self.low_shelf.b0 = ls.b0; self.low_shelf.b1 = ls.b1; self.low_shelf.b2 = ls.b2;
            self.low_shelf.a1 = ls.a1; self.low_shelf.a2 = ls.a2;
            
            self.mid_bell.b0 = mb.b0; self.mid_bell.b1 = mb.b1; self.mid_bell.b2 = mb.b2;
            self.mid_bell.a1 = mb.a1; self.mid_bell.a2 = mb.a2;
            
            self.high_shelf.b0 = hs.b0; self.high_shelf.b1 = hs.b1; self.high_shelf.b2 = hs.b2;
            self.high_shelf.a1 = hs.a1; self.high_shelf.a2 = hs.a2;
            
            var processed = self.low_shelf.process(s);
            processed = self.mid_bell.process(processed);
            processed = self.high_shelf.process(processed);
            
            out_l[i] = processed;
            out_r[i] = processed;
        }
    }

    pub fn setParameter(self: *PsychoDynamicEQPlugin, index: i32, value: f32) void {
        if (index == 0) self.intensity = value;
        if (index == 1) self.ref_db = -30.0 + (value * 30.0); // -30 to 0dB
    }

    pub fn getParameter(self: *PsychoDynamicEQPlugin, index: i32) f32 {
        if (index == 0) return self.intensity;
        if (index == 1) return (self.ref_db + 30.0) / 30.0;
        return 0.0;
    }
};

fn impl_create(allocator: std.mem.Allocator, sample_rate: f32) ?*anyopaque {
    if (PsychoDynamicEQPlugin.init(allocator, sample_rate)) |ptr| {
        return ptr;
    } else |_| {
        return null;
    }
}

fn impl_destroy(ptr: *anyopaque, allocator: std.mem.Allocator) void {
    const self = @as(*PsychoDynamicEQPlugin, @ptrCast(@alignCast(ptr)));
    self.deinit(allocator);
}

fn impl_process(ptr: *anyopaque, inputs: [*]const [*]const f32, outputs: [*][*]f32, frames: usize) void {
    const self = @as(*PsychoDynamicEQPlugin, @ptrCast(@alignCast(ptr)));
    self.process(inputs, outputs, frames);
}

fn impl_set_parameter(ptr: *anyopaque, index: i32, value: f32) void {
    const self = @as(*PsychoDynamicEQPlugin, @ptrCast(@alignCast(ptr)));
    self.setParameter(index, value);
}

fn impl_get_parameter(ptr: *anyopaque, index: i32) f32 {
    const self = @as(*PsychoDynamicEQPlugin, @ptrCast(@alignCast(ptr)));
    return self.getParameter(index);
}

pub const plugin_impl = struct {
    pub const create = impl_create;
    pub const destroy = impl_destroy;
    pub const process = impl_process;
    pub const set_parameter = impl_set_parameter;
    pub const get_parameter = impl_get_parameter;
};
