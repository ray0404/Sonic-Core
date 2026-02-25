const std = @import("std");
const Complex = std.math.Complex(f32);
const math = std.math;

/// A Generic FFT implementation that precalculates twiddle factors and 
/// bit-reversal indices at compile-time to save runtime cycles.
pub fn Fft(comptime N: usize) type {
    return struct {
        pub const twiddles = generateTwiddles();
        pub const bit_reversed_indices = generateBitReversedIndices();

        fn generateTwiddles() [N / 2]Complex {
            @setEvalBranchQuota(1000000);
            var result: [N / 2]Complex = undefined;
            for (0..N / 2) |i| {
                const angle = -2.0 * math.pi * @as(f32, @floatFromInt(i)) / @as(f32, @floatFromInt(N));
                result[i] = Complex.init(@cos(angle), @sin(angle));
            }
            return result;
        }

        fn generateBitReversedIndices() [N]usize {
            @setEvalBranchQuota(1000000);
            var result: [N]usize = undefined;
            const log2N = math.log2(N);
            for (0..N) |i| {
                var reversed: usize = 0;
                var x = i;
                for (0..log2N) |_| {
                    reversed = (reversed << 1) | (x & 1);
                    x >>= 1;
                }
                result[i] = reversed;
            }
            return result;
        }

        pub fn forward(buffer: *[N]Complex) void {
            // Bit-reverse copy
            var temp: [N]Complex = undefined;
            for (0..N) |i| {
                temp[i] = buffer[bit_reversed_indices[i]];
            }
            @memcpy(buffer, &temp);

            var step: usize = 1;
            while (step < N) : (step *= 2) {
                const twiddle_step = (N / 2) / step;
                var i: usize = 0;
                while (i < N) : (i += 2 * step) {
                    for (0..step) |j| {
                        const t = twiddles[j * twiddle_step].mul(buffer[i + j + step]);
                        const u = buffer[i + j];
                        buffer[i + j] = u.add(t);
                        buffer[i + j + step] = u.sub(t);
                    }
                }
            }
        }
        
        pub fn inverse(buffer: *[N]Complex) void {
            // conjugate
            for (0..N) |i| {
                buffer[i].im = -buffer[i].im;
            }
            forward(buffer);
            const scale = 1.0 / @as(f32, @floatFromInt(N));
            for (0..N) |i| {
                buffer[i].re *= scale;
                // conjugate back (and scale)
                buffer[i].im = -buffer[i].im * scale; // Note: scaling both re and im
            }
        }
    };
}

test "comptime FFT forward and inverse" {
    const N = 8;
    const MyFft = Fft(N);
    var buf: [N]Complex = undefined;
    for (0..N) |i| {
        buf[i] = Complex.init(@as(f32, @floatFromInt(i)), 0);
    }
    
    MyFft.forward(&buf);
    // After forward FFT, the DC component (buf[0].re) should be the sum of inputs (0+1+2+3+4+5+6+7) = 28
    try std.testing.expectApproxEqAbs(buf[0].re, 28.0, 0.001);
    
    MyFft.inverse(&buf);
    // After IFFT, it should return to original values
    try std.testing.expectApproxEqAbs(buf[0].re, 0.0, 0.001);
    try std.testing.expectApproxEqAbs(buf[7].re, 7.0, 0.001);
}
