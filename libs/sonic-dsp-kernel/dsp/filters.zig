const std = @import("std");
const shared = @import("shared.zig");

pub const FilterType = enum {
    lowpass,
    highpass,
    peaking,
    lowshelf,
    highshelf,
    bandpass,
    notch,
    allpass,
};

pub const Biquad = struct {
    a1: f32 = 0, a2: f32 = 0,
    b0: f32 = 1, b1: f32 = 0, b2: f32 = 0,
    x1: f32 = 0, x2: f32 = 0,
    y1: f32 = 0, y2: f32 = 0,

    pub fn setParams(self: *Biquad, f_type: FilterType, frequency: f32, gain_db: f32, Q: f32, sample_rate: f32) void {
        const w0 = shared.TWO_PI * frequency / sample_rate;
        const cos_w0 = std.math.cos(w0);
        const sin_w0 = std.math.sin(w0);
        const alpha = sin_w0 / (2.0 * Q);
        const A = std.math.pow(f32, 10.0, gain_db / 40.0);

        var b0: f32 = 1; var b1: f32 = 0; var b2: f32 = 0;
        var a0: f32 = 1; var a1: f32 = 0; var a2: f32 = 0;

        switch (f_type) {
            .lowpass => {
                b0 = (1.0 - cos_w0) / 2.0;
                b1 = 1.0 - cos_w0;
                b2 = (1.0 - cos_w0) / 2.0;
                a0 = 1.0 + alpha;
                a1 = -2.0 * cos_w0;
                a2 = 1.0 - alpha;
            },
            .highpass => {
                b0 = (1.0 + cos_w0) / 2.0;
                b1 = -(1.0 + cos_w0);
                b2 = (1.0 + cos_w0) / 2.0;
                a0 = 1.0 + alpha;
                a1 = -2.0 * cos_w0;
                a2 = 1.0 - alpha;
            },
            .peaking => {
                b0 = 1.0 + alpha * A;
                b1 = -2.0 * cos_w0;
                b2 = 1.0 - alpha * A;
                a0 = 1.0 + alpha / A;
                a1 = -2.0 * cos_w0;
                a2 = 1.0 - alpha / A;
            },
            .lowshelf => {
                const temp1 = 2.0 * std.math.sqrt(A) * alpha;
                b0 = A * ((A + 1.0) - (A - 1.0) * cos_w0 + temp1);
                b1 = 2.0 * A * ((A - 1.0) - (A + 1.0) * cos_w0);
                b2 = A * ((A + 1.0) - (A - 1.0) * cos_w0 - temp1);
                a0 = (A + 1.0) + (A - 1.0) * cos_w0 + temp1;
                a1 = -2.0 * ((A - 1.0) + (A + 1.0) * cos_w0);
                a2 = (A + 1.0) + (A - 1.0) * cos_w0 - temp1;
            },
            .highshelf => {
                const temp1 = 2.0 * std.math.sqrt(A) * alpha;
                b0 = A * ((A + 1.0) + (A - 1.0) * cos_w0 + temp1);
                b1 = -2.0 * A * ((A - 1.0) + (A + 1.0) * cos_w0);
                b2 = A * ((A + 1.0) + (A - 1.0) * cos_w0 - temp1);
                a0 = (A + 1.0) - (A - 1.0) * cos_w0 + temp1;
                a1 = 2.0 * ((A - 1.0) + (A + 1.0) * cos_w0);
                a2 = (A + 1.0) - (A - 1.0) * cos_w0 - temp1;
            },
            .bandpass => {
                b0 = alpha;
                b1 = 0;
                b2 = -alpha;
                a0 = 1.0 + alpha;
                a1 = -2.0 * cos_w0;
                a2 = 1.0 - alpha;
            },
            .notch => {
                b0 = 1;
                b1 = -2.0 * cos_w0;
                b2 = 1;
                a0 = 1.0 + alpha;
                a1 = -2.0 * cos_w0;
                a2 = 1.0 - alpha;
            },
            .allpass => {
                b0 = 1.0 - alpha;
                b1 = -2.0 * cos_w0;
                b2 = 1.0 + alpha;
                a0 = 1.0 + alpha;
                a1 = -2.0 * cos_w0;
                a2 = 1.0 - alpha;
            },
        }

        self.b0 = b0 / a0; self.b1 = b1 / a0; self.b2 = b2 / a0;
        self.a1 = a1 / a0; self.a2 = a2 / a0;
    }

    pub fn process(self: *Biquad, input: f32) f32 {
        const output = self.b0 * input + self.b1 * self.x1 + self.b2 * self.x2 - self.a1 * self.y1 - self.a2 * self.y2;
        self.x2 = self.x1; self.x1 = input;
        self.y2 = self.y1; self.y1 = output;
        return output;
    }
    
    pub fn reset(self: *Biquad) void {
        self.x1 = 0; self.x2 = 0;
        self.y1 = 0; self.y2 = 0;
    }
};
