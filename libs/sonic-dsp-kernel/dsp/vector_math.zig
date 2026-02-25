const std = @import("std");

pub const Vec4 = @Vector(4, f32);

pub fn add(a: Vec4, b: Vec4) Vec4 {
    return a + b;
}

pub fn sub(a: Vec4, b: Vec4) Vec4 {
    return a - b;
}

pub fn mul(a: Vec4, b: Vec4) Vec4 {
    return a * b;
}

pub fn div(a: Vec4, b: Vec4) Vec4 {
    return a / b;
}

pub fn mac(acc: Vec4, a: Vec4, b: Vec4) Vec4 {
    // Relaxed SIMD and standard SIMD will utilize target CPU fused-multiply-add if available.
    return acc + (a * b);
}

test "vector operations" {
    const a = Vec4{ 1.0, 2.0, 3.0, 4.0 };
    const b = Vec4{ 5.0, 6.0, 7.0, 8.0 };
    
    const sum = add(a, b);
    try std.testing.expectEqual(@as(f32, 6.0), sum[0]);
    try std.testing.expectEqual(@as(f32, 12.0), sum[3]);

    const product = mul(a, b);
    try std.testing.expectEqual(@as(f32, 5.0), product[0]);
    try std.testing.expectEqual(@as(f32, 32.0), product[3]);

    const accum = mac(a, a, b);
    try std.testing.expectEqual(@as(f32, 6.0), accum[0]);
    try std.testing.expectEqual(@as(f32, 36.0), accum[3]);
}
