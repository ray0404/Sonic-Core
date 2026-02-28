const std = @import("std");
const dynamics = @import("../dsp/dynamics.zig");
const shared = @import("../dsp/shared.zig");

pub const Compressor = struct {
    detector_l: dynamics.EnvelopeFollower = .{},
    detector_r: dynamics.EnvelopeFollower = .{},
    threshold: f32 = -24,
    ratio: f32 = 4,
    attack: f32 = 10, // ms
    release: f32 = 100, // ms
    knee: f32 = 5,
    makeup: f32 = 0,
    mix: f32 = 1,
    mode: i32 = 0, // 0=VCA, 1=FET, 2=Opto, 3=VarMu
    sample_rate: f32 = 44100,
    
    last_output_l: f32 = 0,
    last_output_r: f32 = 0,

    pub fn process(self: *Compressor, data: []f32) void {
        self.detector_l.setParams(self.attack, self.release, self.sample_rate);
        self.detector_r.setParams(self.attack, self.release, self.sample_rate);
        const makeup_gain = shared.dbToLinear(self.makeup);

        var i: usize = 0;
        while (i < data.len - 1) : (i += 2) {
            const l = data[i];
            const r = data[i+1];
            
            // 1. Detection Source
            var det_l = l;
            var det_r = r;
            if (self.mode == 1) { // FET: Feedback
                det_l = self.last_output_l;
                det_r = self.last_output_r;
            }

            // 2. Level Detection
            const env_l = self.detector_l.process(det_l);
            const env_r = self.detector_r.process(det_r);
            
            // Link Channels
            const env = @max(env_l, env_r);
            const env_db = shared.linearToDb(env);
            
            // 3. Mode Specific Adjustments
            var current_ratio = self.ratio;
            if (self.mode == 3) { // VarMu: Variable Ratio
                const overshoot = env_db - self.threshold;
                if (overshoot > 0) {
                    current_ratio = 1.0 + (overshoot * (self.knee * 0.1));
                }
            }

            if (self.mode == 2) { // Opto: Program Dependent Release
                // Slower release for higher levels
                const rel_mod = 1.0 - @min(1.0, env);
                const dyn_rel = self.release * (0.5 + rel_mod * 0.5);
                self.detector_l.release_coeff = std.math.exp(-1.0 / (@max(0.001, dyn_rel * 0.001) * self.sample_rate));
                self.detector_r.release_coeff = self.detector_l.release_coeff;
            }
            
            const gr_db = dynamics.GainComputer.compute(self.threshold, current_ratio, if (self.mode == 3) 0 else self.knee, env_db);
            const gain = shared.dbToLinear(-gr_db);
            
            const processed_l = l * gain * makeup_gain;
            const processed_r = r * gain * makeup_gain;

            data[i] = l * (1.0 - self.mix) + processed_l * self.mix;
            data[i+1] = r * (1.0 - self.mix) + processed_r * self.mix;
            
            self.last_output_l = processed_l;
            self.last_output_r = processed_r;
        }
    }
};

pub const Limiter = struct {
    sample_rate: f32 = 44100,
    compressor: Compressor = .{
        .threshold = -0.5,
        .ratio = 20,
        .attack = 0.01, // Near-instant attack
        .release = 50,
        .knee = 0,
        .mix = 1,
    },

    pub fn process(self: *Limiter, data: []f32) void {
        self.compressor.sample_rate = self.sample_rate;
        self.compressor.process(data);

        // Hard Clip Stage to ensure strict ceiling
        const ceiling = shared.dbToLinear(self.compressor.threshold);
        for (data) |*s| {
            if (s.* > ceiling) s.* = ceiling;
            if (s.* < -ceiling) s.* = -ceiling;
        }
    }
};

pub const DeEsser = struct {
    hp_filter: @import("../dsp/filters.zig").Biquad = .{},
    compressor: Compressor = .{
        .threshold = -20,
        .ratio = 4,
        .attack = 5,
        .release = 50,
        .knee = 3,
        .mix = 1,
    },
    sample_rate: f32 = 44100,
    frequency: f32 = 6000,

    pub fn process(self: *DeEsser, data: []f32) void {
        self.hp_filter.setParams(.highpass, self.frequency, 0, 0.707, self.sample_rate);
        self.compressor.sample_rate = self.sample_rate;
        const makeup_gain = shared.dbToLinear(self.compressor.makeup);

        var i: usize = 0;
        while (i < data.len - 1) : (i += 2) {
            const s_l = data[i];
            const s_r = data[i+1];
            
            // Sidechain: High-pass filtered
            const hp_l = self.hp_filter.process(s_l);
            const hp_r = self.hp_filter.process(s_r);
            const sidechain = @max(@abs(hp_l), @abs(hp_r));
            
            const env = self.compressor.detector_l.process(sidechain);
            const env_db = shared.linearToDb(env);
            
            const gr_db = dynamics.GainComputer.compute(self.compressor.threshold, self.compressor.ratio, self.compressor.knee, env_db);
            const gain = shared.dbToLinear(-gr_db);
            
            data[i] = s_l * (1.0 - self.compressor.mix) + (s_l * gain * makeup_gain) * self.compressor.mix;
            data[i+1] = s_r * (1.0 - self.compressor.mix) + (s_r * gain * makeup_gain) * self.compressor.mix;
        }
    }
};

pub fn processCompressor(
    data: []f32,
    sample_rate: f32,
    threshold: f32,
    ratio: f32,
    attack: f32,
    release: f32,
    makeup: f32,
    mix: f32,
    mode: i32
) void {
    var comp = Compressor{
        .threshold = threshold,
        .ratio = ratio,
        .attack = attack * 1000.0, // Convert to ms for this implementation
        .release = release * 1000.0,
        .makeup = makeup,
        .mix = mix,
        .mode = mode,
        .sample_rate = sample_rate,
    };
    comp.process(data);
}

pub fn processLimiter(data: []f32, sample_rate: f32, threshold: f32, release: f32) void {
    var lim = Limiter{ .sample_rate = sample_rate };
    lim.compressor.threshold = threshold;
    lim.compressor.release = release * 1000.0;
    lim.process(data);
}

pub fn processDeesser(data: []f32, sample_rate: f32, frequency: f32, threshold: f32, ratio: f32, attack: f32, release: f32) void {
    var deesser = DeEsser{
        .sample_rate = sample_rate,
        .frequency = frequency,
    };
    deesser.compressor.threshold = threshold;
    deesser.compressor.ratio = ratio;
    deesser.compressor.attack = attack * 1000.0;
    deesser.compressor.release = release * 1000.0;
    deesser.process(data);
}

pub const TransientShaper = struct {
    attack_env: dynamics.EnvelopeFollower = .{},
    sustain_env: dynamics.EnvelopeFollower = .{},
    attack_gain: f32 = 0,
    sustain_gain: f32 = 0,
    mix: f32 = 1,
    sample_rate: f32 = 44100,

    pub fn process(self: *TransientShaper, data: []f32) void {
        self.attack_env.setParams(1.0, 50.0, self.sample_rate);
        self.sustain_env.setParams(50.0, 200.0, self.sample_rate);
        
        const att_g = shared.dbToLinear(self.attack_gain);
        const sus_g = shared.dbToLinear(self.sustain_gain);

        var i: usize = 0;
        while (i < data.len - 1) : (i += 2) {
            const l = data[i];
            const r = data[i+1];
            const mono = @max(@abs(l), @abs(r));
            
            const att = self.attack_env.process(mono);
            const sus = self.sustain_env.process(mono);
            
            // Heuristic transient detection
            const is_attack = att > sus;
            const gain = if (is_attack) att_g else sus_g;
            
            data[i] = l * (1.0 - self.mix) + (l * gain) * self.mix;
            data[i+1] = r * (1.0 - self.mix) + (r * gain) * self.mix;
        }
    }
};

pub fn processTransientShaper(data: []f32, sample_rate: f32, attack_db: f32, sustain_db: f32, mix: f32) void {
    var ts = TransientShaper{
        .sample_rate = sample_rate,
        .attack_gain = attack_db,
        .sustain_gain = sustain_db,
        .mix = mix,
    };
    ts.process(data);
}
