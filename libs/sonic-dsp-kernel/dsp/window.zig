const std = @import("std");
const math = std.math;

/// A Hanning Window primitive optimized at compile-time.
pub fn HanningWindow(comptime N: usize) type {
    return struct {
        pub const window = generateWindow();

        fn generateWindow() [N]f32 {
            @setEvalBranchQuota(1000000);
            var result: [N]f32 = undefined;
            for (0..N) |i| {
                const angle = 2.0 * math.pi * @as(f32, @floatFromInt(i)) / @as(f32, @floatFromInt(N - 1));
                result[i] = 0.5 * (1.0 - @cos(angle));
            }
            return result;
        }
        
        pub fn apply(buffer: *[N]f32) void {
            for (0..N) |i| {
                buffer[i] *= window[i];
            }
        }
    };
}

test "Hanning Window comptime generated" {
    const N = 256;
    const Win = HanningWindow(N);
    
    // First sample is 0
    try std.testing.expectApproxEqAbs(Win.window[0], 0.0, 0.001);
    // Last sample is 0
    try std.testing.expectApproxEqAbs(Win.window[N - 1], 0.0, 0.001);
    // Middle sample is 1.0 (approx due to even/odd symmetry)
    try std.testing.expectApproxEqAbs(Win.window[N / 2], 1.0, 0.001);
}
