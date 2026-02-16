const std = @import("std");
const math = @import("../math_utils.zig");

pub fn DelayLine(comptime MaxSize: usize) type {
    return struct {
        buffer: [MaxSize]f32 = [_]f32{0} ** MaxSize,
        write_ptr: usize = 0,

        pub fn process(self: *DelayLine(MaxSize), input: f32, delay_samples: f32) f32 {
            const read_ptr = @as(f32, @floatFromInt(self.write_ptr)) - delay_samples;
            const output = self.readInterpolated(read_ptr);
            
            self.buffer[self.write_ptr] = input;
            self.write_ptr = (self.write_ptr + 1) % MaxSize;
            
            return output;
        }

        pub fn readInterpolated(self: *DelayLine(MaxSize), ptr: f32) f32 {
            const max_f = @as(f32, @floatFromInt(MaxSize));
            // Wrap pointer
            var p = ptr;
            while (p < 0) p += max_f;
            while (p >= max_f) p -= max_f;

            const idx1 = @as(usize, @intFromFloat(p));
            const idx2 = (idx1 + 1) % MaxSize;
            const frac = p - @as(f32, @floatFromInt(idx1));

            // Linear interpolation
            return self.buffer[idx1] * (1.0 - frac) + self.buffer[idx2] * frac;
        }
        
        pub fn reset(self: *DelayLine(MaxSize)) void {
            @memset(&self.buffer, 0);
            self.write_ptr = 0;
        }
    };
}
