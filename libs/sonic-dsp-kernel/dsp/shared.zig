const std = @import("std");

pub const PI: f32 = 3.14159265358979323846;
pub const TWO_PI: f32 = 6.28318530717958647692;

pub fn dbToLinear(db: f32) f32 {
    return std.math.pow(f32, 10.0, db / 20.0);
}

pub fn linearToDb(linear: f32) f32 {
    if (linear <= 0.000001) return -120.0;
    return 20.0 * std.math.log10(linear);
}
