const std = @import("std");
const shared = @import("../dsp/shared.zig");

pub fn processSaturation(data: []f32, drive: f32, sat_type: i32, out_gain_db: f32, mix: f32) void {
    const gain = shared.dbToLinear(out_gain_db);
    const drive_gain = 1.0 + drive;
    
    const vec_len = 4;
    var i: usize = 0;
    const loop_len = data.len - (data.len % vec_len);
    
    while (i < loop_len) : (i += vec_len) {
        const v: @Vector(vec_len, f32) = data[i..][0..vec_len].*;
        const x = v * @as(@Vector(vec_len, f32), @splat(drive_gain));
        
        var saturated: @Vector(vec_len, f32) = undefined;
        
        if (sat_type == 1) { // Tube approximation
            // Using a simple conditional or mathematical approximation for SIMD
            // tanh(x) isn't directly in Zig @Vector builtins yet for all targets
            // but we can loop or use a fast approx. For now, let's use a standard loop inside if needed,
            // or just provide the scalar implementation for clarity and safety in WASM.
            for (0..vec_len) |j| {
                const val = x[j];
                saturated[j] = if (val >= 0) std.math.tanh(val) else val / (1.0 + @abs(val));
            }
        } else if (sat_type == 2) { // Fuzz/Hard Clip
            for (0..vec_len) |j| {
                saturated[j] = std.math.clamp(x[j], -1.0, 1.0);
            }
        } else { // Tape (Standard Tanh)
            for (0..vec_len) |j| {
                saturated[j] = std.math.tanh(x[j]);
            }
        }
        
        const wet = saturated * @as(@Vector(vec_len, f32), @splat(gain));
        const final = v * @as(@Vector(vec_len, f32), @splat(1.0 - mix)) + wet * @as(@Vector(vec_len, f32), @splat(mix));
        data[i..][0..vec_len].* = final;
    }
    
    while (i < data.len) : (i += 1) {
        const x = data[i] * drive_gain;
        var saturated: f32 = 0;
        if (sat_type == 1) {
            saturated = if (x >= 0) std.math.tanh(x) else x / (1.0 + @abs(x));
        } else if (sat_type == 2) {
            saturated = std.math.clamp(x, -1.0, 1.0);
        } else {
            saturated = std.math.tanh(x);
        }
        data[i] = data[i] * (1.0 - mix) + (saturated * gain) * mix;
    }
}

pub fn processDistortion(data: []f32, drive: f32, dist_type: i32, out_gain_db: f32, mix: f32) void {
    const gain = shared.dbToLinear(out_gain_db);
    const drive_gain = 1.0 + drive * 5.0; // More aggressive
    
    for (data) |*sample| {
        const x = sample.* * drive_gain;
        var dist: f32 = 0;
        if (dist_type == 1) { // Hard Clip
            dist = std.math.clamp(x, -1.0, 1.0);
        } else if (dist_type == 2) { // Rectifier
            dist = @abs(x);
        } else { // Soft Clip (Atan)
            dist = (2.0 / std.math.pi) * std.math.atan(x);
        }
        sample.* = sample.* * (1.0 - mix) + (dist * gain) * mix;
    }
}

pub fn processBitcrusher(data: []f32, bits: f32, norm_freq: f32, mix: f32) void {
    const step = std.math.pow(f32, 2.0, bits);
    var phasor: f32 = 0;
    var hold_l: f32 = 0;
    var hold_r: f32 = 0;
    
    var i: usize = 0;
    while (i < data.len - 1) : (i += 2) {
        phasor += norm_freq;
        if (phasor >= 1.0) {
            phasor -= 1.0;
            hold_l = std.math.floor(data[i] * step) / step;
            hold_r = std.math.floor(data[i+1] * step) / step;
        }
        data[i] = hold_l * mix + data[i] * (1.0 - mix);
        data[i+1] = hold_r * mix + data[i+1] * (1.0 - mix);
    }
}

pub fn processDithering(data: []f32, bits: f32) void {
    const depth = std.math.pow(f32, 2.0, bits - 1.0);
    const inv_depth = 1.0 / depth;
    
    // Seeded random for consistency in WASM if needed, but std.crypto.random is fine
    // For simple dither, we can use a basic LCG or similar if we want to avoid complex imports.
    // Let's use a very simple LCG for speed and portability.
    var seed: u32 = 12345;
    
    for (data) |*sample| {
        // TPDF Dither: two independent random variables
        seed = seed *% 1103515245 +% 12345;
        const r1 = @as(f32, @floatFromInt(seed & 0xFFFF)) / @as(f32, @floatFromInt(0xFFFF));
        seed = seed *% 1103515245 +% 12345;
        const r2 = @as(f32, @floatFromInt(seed & 0xFFFF)) / @as(f32, @floatFromInt(0xFFFF));
        
        const dither = (r1 + r2 - 1.0) * inv_depth;
        const quantized = std.math.floor((sample.* + dither) * depth + 0.5) * inv_depth;
        sample.* = quantized;
    }
}
