const std = @import("std");
const filters = @import("../dsp/filters.zig");

pub fn processParametricEQ(
    data: []f32,
    sample_rate: f32,
    low_freq: f32, low_gain: f32,
    mid_freq: f32, mid_gain: f32, mid_q: f32,
    high_freq: f32, high_gain: f32
) void {
    var filters_l = [3]filters.Biquad{ .{}, .{}, .{} };
    var filters_r = [3]filters.Biquad{ .{}, .{}, .{} };

    filters_l[0].setParams(.lowshelf, low_freq, low_gain, 0.707, sample_rate);
    filters_l[1].setParams(.peaking, mid_freq, mid_gain, mid_q, sample_rate);
    filters_l[2].setParams(.highshelf, high_freq, high_gain, 0.707, sample_rate);

    filters_r[0].setParams(.lowshelf, low_freq, low_gain, 0.707, sample_rate);
    filters_r[1].setParams(.peaking, mid_freq, mid_gain, mid_q, sample_rate);
    filters_r[2].setParams(.highshelf, high_freq, high_gain, 0.707, sample_rate);

    var i: usize = 0;
    while (i < data.len - 1) : (i += 2) {
        var s_l = data[i];
        var s_r = data[i+1];

        inline for (0..3) |j| {
            s_l = filters_l[j].process(s_l);
            s_r = filters_r[j].process(s_r);
        }

        data[i] = s_l;
        data[i+1] = s_r;
    }
}

pub fn processMidSideEQ(
    data: []f32,
    sample_rate: f32,
    mid_gain: f32, mid_freq: f32,
    side_gain: f32, side_freq: f32
) void {
    var filter_mid = filters.Biquad{};
    var filter_side = filters.Biquad{};

    filter_mid.setParams(.peaking, mid_freq, mid_gain, 1.0, sample_rate);
    filter_side.setParams(.peaking, side_freq, side_gain, 1.0, sample_rate);

    var i: usize = 0;
    while (i < data.len - 1) : (i += 2) {
        const mid = (data[i] + data[i+1]) * 0.5;
        const side = (data[i] - data[i+1]) * 0.5;

        const p_mid = filter_mid.process(mid);
        const p_side = filter_side.process(side);

        data[i] = p_mid + p_side;
        data[i+1] = p_mid - p_side;
    }
}

pub fn processStereoImager(
    data: []f32,
    sample_rate: f32,
    low_freq: f32, high_freq: f32,
    width_low: f32, width_mid: f32, width_high: f32
) void {
    var lp_l = filters.Biquad{}; var lp_r = filters.Biquad{};
    var hp_l = filters.Biquad{}; var hp_r = filters.Biquad{};
    var bp_l = filters.Biquad{}; var bp_r = filters.Biquad{};

    lp_l.setParams(.lowpass, low_freq, 0, 0.707, sample_rate);
    lp_r.setParams(.lowpass, low_freq, 0, 0.707, sample_rate);
    hp_l.setParams(.highpass, high_freq, 0, 0.707, sample_rate);
    hp_r.setParams(.highpass, high_freq, 0, 0.707, sample_rate);
    
    const mid_f = (low_freq + high_freq) * 0.5;
    bp_l.setParams(.bandpass, mid_f, 0, 0.707, sample_rate);
    bp_r.setParams(.bandpass, mid_f, 0, 0.707, sample_rate);

    var i: usize = 0;
    while (i < data.len - 1) : (i += 2) {
        const s_l = data[i];
        const s_r = data[i+1];

        const mid = (s_l + s_r) * 0.5;
        const side = (s_l - s_r) * 0.5;

        const low_l = lp_l.process(s_l);
        const low_r = lp_r.process(s_r);
        const high_l = hp_l.process(s_l);
        const high_r = hp_r.process(s_r);

        const side_low = (low_l - low_r) * width_low;
        const side_mid = side * width_mid;
        const side_high = (high_l - high_r) * width_high;

        data[i] = mid + side_low + side_mid + side_high;
        data[i+1] = mid - side_low - side_mid - side_high;
    }
}
