const std = @import("std");
const math = @import("math_utils.zig");

var gpa = std.heap.GeneralPurposeAllocator(.{}){};
const allocator = gpa.allocator();

pub const AnalysisResult = struct {
    power_spectrum: []f32,
    size: usize,
};

const WINDOW_SIZE: usize = 4096;
const HOP_SIZE: usize = 2048;

fn create_hanning_window(size: usize) ![]f32 {
    const window = try allocator.alloc(f32, size);
    var i: usize = 0;
    while (i < size) : (i += 1) {
        window[i] = 0.5 * (1.0 - std.math.cos(math.TWO_PI * @as(f32, @floatFromInt(i)) / @as(f32, @floatFromInt(size - 1))));
    }
    return window;
}

// 1/3 Octave Smoothing
// Simple implementation: Moving average with width proportional to frequency
fn smooth_spectrum(spectrum: []f32) void {
    const len = spectrum.len;
    // We need a temp buffer
    const temp = allocator.alloc(f32, len) catch return;
    defer allocator.free(temp);
    @memcpy(temp, spectrum);

    const octave_width: f32 = 0.333; // 1/3 octave
    const factor = std.math.pow(f32, 2.0, octave_width) - 1.0; // Approximation of bandwidth

    var i: usize = 0;
    while (i < len) : (i += 1) {
        // Determine window width for this bin
        // Width roughly proportional to index
        const width = @as(f32, @floatFromInt(i)) * factor;
        var w_int = @as(usize, @intFromFloat(width));
        if (w_int < 1) w_int = 1;

        const start = if (i > w_int) i - w_int else 0;
        const end = if (i + w_int >= len) len - 1 else i + w_int;

        var sum: f32 = 0;
        const count = @as(f32, @floatFromInt(end - start + 1));

        var j = start;
        while (j <= end) : (j += 1) {
            sum += temp[j];
        }

        spectrum[i] = sum / count;
    }
}

// Analyze spectrum of a buffer
// Returns a heap-allocated array of power spectrum
fn analyze_signal(data: []f32) ![]f32 {
    const spec_size = WINDOW_SIZE / 2; // Real FFT magnitude size (ignoring DC/Nyquist symmetry for now or keeping strictly positive)
    // Actually math_utils FFT is Complex->Complex size N.
    // Result is symmetric. We only care about 0..N/2.

    const avg_spec = try allocator.alloc(f32, spec_size);
    @memset(avg_spec, 0);

    const window = try create_hanning_window(WINDOW_SIZE);
    defer allocator.free(window);

    const fft_buf = try allocator.alloc(math.Complex, WINDOW_SIZE);
    defer allocator.free(fft_buf);

    var pos: usize = 0;
    var frames: usize = 0;

    while (pos + WINDOW_SIZE <= data.len) : (pos += HOP_SIZE) {
        // Prepare frame
        var i: usize = 0;
        while (i < WINDOW_SIZE) : (i += 1) {
            fft_buf[i] = .{ .re = data[pos + i] * window[i], .im = 0 };
        }

        math.fft_iterative(fft_buf, false);

        // Accumulate Power
        i = 0;
        while (i < spec_size) : (i += 1) {
            const mag = fft_buf[i].magnitude();
            avg_spec[i] += mag * mag; // Power
        }
        frames += 1;
    }

    if (frames > 0) {
        var i: usize = 0;
        while (i < spec_size) : (i += 1) {
            avg_spec[i] /= @as(f32, @floatFromInt(frames));
        }
    }

    // Smooth immediately? Yes, usually good for "Fingerprint"
    smooth_spectrum(avg_spec);

    return avg_spec;
}

// Helper to sum interleaved stereo to mono
fn sum_to_mono(data: []const f32, mono: []f32) void {
    var i: usize = 0;
    while (i < mono.len) : (i += 1) {
        mono[i] = (data[i * 2] + data[i * 2 + 1]) * 0.5;
    }
}

export fn spectralmatch_analyze_ref(ptr: [*]f32, len: usize) ?*AnalysisResult {
    const data = ptr[0..len];
    const mono = allocator.alloc(f32, len / 2) catch return null;
    defer allocator.free(mono);
    sum_to_mono(data, mono);

    const spec = analyze_signal(mono) catch return null;

    const result = allocator.create(AnalysisResult) catch return null;
    result.* = .{
        .power_spectrum = spec,
        .size = spec.len,
    };
    return result;
}

export fn spectralmatch_hydrate_profile(ptr: [*]f32, len: usize) ?*AnalysisResult {
    const spec = allocator.alloc(f32, len) catch return null;
    @memcpy(spec, ptr[0..len]);

    const result = allocator.create(AnalysisResult) catch return null;
    result.* = .{
        .power_spectrum = spec,
        .size = spec.len,
    };
    return result;
}

export fn spectralmatch_free_analysis(ptr: *AnalysisResult) void {
    allocator.free(ptr.power_spectrum);
    allocator.destroy(ptr);
}

export fn process_spectralmatch(
    target_ptr: [*]f32,
    target_len: usize,
    ref_analysis: *AnalysisResult,
    amount: f32, // 0.0 to 1.0
    smooth_factor: f32 // Not used in this simple impl, or could use for smoothing target
) void {
    _ = smooth_factor;
    const target_data = target_ptr[0..target_len];
    const num_frames = target_len / 2;

    // 1. Analyze Target (Sum to Mono first)
    const mono = allocator.alloc(f32, num_frames) catch return;
    defer allocator.free(mono);
    sum_to_mono(target_data, mono);

    const target_spec = analyze_signal(mono) catch return;
    defer allocator.free(target_spec);

    // 2. Compute Filter Magnitude
    const filter_len = ref_analysis.size;
    const filter_mag = allocator.alloc(f32, filter_len) catch return;
    defer allocator.free(filter_mag);

    var i: usize = 0;
    while (i < filter_len) : (i += 1) {
        const ref = ref_analysis.power_spectrum[i];
        const tgt = target_spec[i] + 1e-9; // Avoid div by zero

        const ratio = ref / tgt;
        var db = math.linearToDb(std.math.sqrt(ratio));

        if (db > 12.0) db = 12.0;
        if (db < -12.0) db = -12.0;
        db *= amount;

        filter_mag[i] = math.dbToLinear(db);
    }

    // 3. Generate Linear Phase IR
    const fft_size = WINDOW_SIZE;
    const ir_spec = allocator.alloc(math.Complex, fft_size) catch return;
    defer allocator.free(ir_spec);

    i = 0;
    while (i < fft_size) : (i += 1) {
        ir_spec[i] = .{ .re = 0, .im = 0 };
    }

    i = 0;
    while (i < filter_len) : (i += 1) {
        ir_spec[i].re = filter_mag[i];
    }
    i = 1;
    while (i < filter_len) : (i += 1) {
        ir_spec[fft_size - i] = ir_spec[i];
    }

    math.fft_iterative(ir_spec, true);

    const ir = allocator.alloc(f32, fft_size) catch return;
    defer allocator.free(ir);

    const shift = fft_size / 2;
    i = 0;
    while (i < fft_size) : (i += 1) {
        var src_idx = i;
        if (i < shift) {
            src_idx = fft_size - shift + i;
        } else {
            src_idx = i - shift;
        }
        ir[i] = ir_spec[src_idx].re;
    }

    const h_window = create_hanning_window(fft_size) catch return;
    defer allocator.free(h_window);
    i = 0;
    while (i < fft_size) : (i += 1) {
        ir[i] *= h_window[i];
    }

    // 4. Convolution (Overlap-Add) - Per Channel
    const N = 8192;
    const L = N - fft_size + 1; 

    const ir_padded = allocator.alloc(math.Complex, N) catch return;
    defer allocator.free(ir_padded);
    @memset(ir_padded, .{ .re=0, .im=0 });

    i = 0;
    while (i < fft_size) : (i += 1) {
        ir_padded[i] = .{ .re = ir[i], .im = 0 };
    }
    math.fft_iterative(ir_padded, false);

    const chan_output = allocator.alloc(f32, num_frames + fft_size) catch return;
    defer allocator.free(chan_output);
    const fft_conv_buf = allocator.alloc(math.Complex, N) catch return;
    defer allocator.free(fft_conv_buf);

    for (0..2) |channel| {
        @memset(chan_output, 0);
        var pos: usize = 0;
        while (pos < num_frames) : (pos += L) {
            @memset(fft_conv_buf, .{ .re=0, .im=0 });
            var blockSize = L;
            if (pos + blockSize > num_frames) blockSize = num_frames - pos;

            var j: usize = 0;
            while (j < blockSize) : (j += 1) {
                fft_conv_buf[j].re = target_data[(pos + j) * 2 + channel];
            }

            math.fft_iterative(fft_conv_buf, false);
            j = 0;
            while (j < N) : (j += 1) {
                fft_conv_buf[j] = fft_conv_buf[j].mul(ir_padded[j]);
            }
            math.fft_iterative(fft_conv_buf, true);

            j = 0;
            while (j < N and pos + j < chan_output.len) : (j += 1) {
                chan_output[pos + j] += fft_conv_buf[j].re;
            }
        }

        // Copy back to interleaved
        i = 0;
        while (i < num_frames) : (i += 1) {
            target_data[i * 2 + channel] = chan_output[i];
        }
    }
}
