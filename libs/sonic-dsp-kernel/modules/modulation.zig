const std = @import("std");
const filters = @import("../dsp/filters.zig");
const shared = @import("../dsp/shared.zig");

pub fn processTremolo(data: []f32, sample_rate: f32, frequency: f32, depth: f32, waveform: i32, mix: f32) void {
    var i: usize = 0;
    while (i < data.len - 1) : (i += 2) {
        const t = @as(f32, @floatFromInt(i / 2)) / sample_rate;
        const phase = shared.TWO_PI * frequency * t;
        
        var lfo: f32 = 0;
        switch (waveform) {
            1 => { // Triangle
                lfo = 2.0 * @abs((@mod(phase, shared.TWO_PI) / shared.TWO_PI) - 0.5);
            },
            2 => { // Saw
                lfo = @mod(phase, shared.TWO_PI) / shared.TWO_PI;
            },
            3 => { // Square
                lfo = if (@mod(phase, shared.TWO_PI) < shared.PI) 1.0 else 0.0;
            },
            else => { // Sine
                lfo = 0.5 + 0.5 * std.math.sin(phase);
            }
        }
        
        const gain = 1.0 - depth * lfo;
        data[i] = data[i] * (1.0 - mix) + data[i] * gain * mix;
        data[i+1] = data[i+1] * (1.0 - mix) + data[i+1] * gain * mix;
    }
}

pub fn processPhaser(
    data: []f32, 
    sample_rate: f32, 
    stages: i32, 
    frequency: f32, 
    base_freq: f32, 
    octaves: f32, 
    wet: f32
) void {
    // Max 12 stages as per descriptor
    var filters_l = [_]filters.Biquad{.{}} ** 12;
    var filters_r = [_]filters.Biquad{.{}} ** 12;
    const num_stages = @as(usize, @intCast(std.math.clamp(stages, 2, 12)));

    var i: usize = 0;
    while (i < data.len - 1) : (i += 2) {
        var s_l = data[i];
        var s_r = data[i+1];
        
        const t = @as(f32, @floatFromInt(i / 2)) / sample_rate;
        const lfo = base_freq + frequency * std.math.sin(shared.TWO_PI * t * 0.5);
        
        var s: usize = 0;
        while (s < num_stages) : (s += 1) {
            const fc = lfo * std.math.pow(f32, 2.0, @as(f32, @floatFromInt(s)) * octaves / @as(f32, @floatFromInt(num_stages)));
            
            // In JS phaser, it uses a manual Allpass calculation. 
            // We'll use our Biquad Allpass for now or update setParams to match.
            // Actually, Phaser often uses a chain of 1st-order Allpass. Biquad is 2nd-order.
            // Let's stick to descriptor style for now.
            filters_l[s].setParams(.allpass, fc, 0, 0.707, sample_rate);
            filters_r[s].setParams(.allpass, fc, 0, 0.707, sample_rate);
            
            s_l = filters_l[s].process(s_l);
            s_r = filters_r[s].process(s_r);
        }
        
        data[i] = data[i] * (1.0 - wet) + s_l * wet;
        data[i+1] = data[i+1] * (1.0 - wet) + s_r * wet;
    }
}
