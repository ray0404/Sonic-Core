const std = @import("std");

/// A suite of Spectral Analysis Primitives (Music Information Retrieval / MIR).
/// These primitives consume FFT magnitudes to determine the physical shape of the sound,
/// allowing plugins to make "intelligent" dynamic decisions.
pub const SpectralFeatures = struct {
    
    /// Calculates the Spectral Centroid ("Brightness").
    /// Think of it as the "center of mass" of the frequency spectrum.
    /// Higher values mean brighter sounds (more treble).
    /// Returns the centroid in Hz.
    pub fn computeCentroid(magnitudes: []const f32, sample_rate: f32) f32 {
        var num: f32 = 0.0;
        var den: f32 = 0.0;
        
        const num_bins = magnitudes.len;
        const bin_hz = (sample_rate / 2.0) / @as(f32, @floatFromInt(num_bins));
        
        for (magnitudes, 0..) |mag, i| {
            const freq = @as(f32, @floatFromInt(i)) * bin_hz;
            num += freq * mag;
            den += mag;
        }
        
        if (den < 1e-6) return 0.0; // Silence fallback
        return num / den;
    }

    /// Calculates the Spectral Rolloff.
    /// The frequency below which a certain percentage (e.g. 85%) of the total spectral energy is contained.
    /// Useful for distinguishing between voiced/unvoiced speech or snare/kick.
    pub fn computeRolloff(magnitudes: []const f32, sample_rate: f32, percent: f32) f32 {
        var total_energy: f32 = 0.0;
        for (magnitudes) |mag| {
            total_energy += mag;
        }
        
        if (total_energy < 1e-6) return 0.0;
        
        const threshold = total_energy * percent;
        var running_sum: f32 = 0.0;
        
        const num_bins = magnitudes.len;
        const bin_hz = (sample_rate / 2.0) / @as(f32, @floatFromInt(num_bins));
        
        for (magnitudes, 0..) |mag, i| {
            running_sum += mag;
            if (running_sum >= threshold) {
                return @as(f32, @floatFromInt(i)) * bin_hz;
            }
        }
        
        return (sample_rate / 2.0);
    }
};

test "Spectral Centroid Calculation" {
    // Mock a 512 bin FFT magnitude array (1024 window) at 48kHz
    // Nyquist is 24kHz. Bin resolution is ~46.8Hz
    var mags: [512]f32 = [_]f32{0} ** 512;
    
    // Place a spike at bin 100 (approx 4687 Hz)
    mags[100] = 1.0;
    
    const centroid = SpectralFeatures.computeCentroid(&mags, 48000.0);
    
    try std.testing.expectApproxEqAbs(centroid, 4687.5, 1.0);
    
    // Spectral Rolloff at 85% should also be near 4687Hz
    const rolloff = SpectralFeatures.computeRolloff(&mags, 48000.0, 0.85);
    try std.testing.expectApproxEqAbs(rolloff, 4687.5, 1.0);
}
