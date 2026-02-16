const std = @import("std");
const delay = @import("../dsp/delay.zig");
const shared = @import("../dsp/shared.zig");

pub const FeedbackDelay = struct {
    delay_l: delay.DelayLine(96000) = .{}, // ~2s at 48kHz
    delay_r: delay.DelayLine(96000) = .{},
    
    time: f32 = 0.5,
    feedback: f32 = 0.3,
    wet: f32 = 0.5,
    sample_rate: f32 = 44100,

    pub fn process(self: *FeedbackDelay, data: []f32) void {
        const delay_samples = self.time * self.sample_rate;
        
        var i: usize = 0;
        while (i < data.len - 1) : (i += 2) {
            const s_l = data[i];
            const s_r = data[i+1];
            
            // Read from delay lines
            // We'll implement feedback manually here to avoid complex DelayLine return types
            const read_ptr = @as(f32, @floatFromInt(self.delay_l.write_ptr)) - delay_samples;
            const delayed_l = self.delay_l.readInterpolated(read_ptr);
            const delayed_r = self.delay_r.readInterpolated(read_ptr);
            
            // Write to delay lines with feedback
            self.delay_l.buffer[self.delay_l.write_ptr] = s_l + delayed_l * self.feedback;
            self.delay_r.buffer[self.delay_r.write_ptr] = s_r + delayed_r * self.feedback;
            
            self.delay_l.write_ptr = (self.delay_l.write_ptr + 1) % 96000;
            self.delay_r.write_ptr = (self.delay_r.write_ptr + 1) % 96000;
            
            data[i] = s_l * (1.0 - self.wet) + delayed_l * self.wet;
            data[i+1] = s_r * (1.0 - self.wet) + delayed_r * self.wet;
        }
    }
};

pub const Chorus = struct {
    delay_l: delay.DelayLine(4800) = .{}, // ~100ms
    delay_r: delay.DelayLine(4800) = .{},
    
    rate: f32 = 1.5,
    base_time: f32 = 0.03,
    depth: f32 = 0.002,
    feedback: f32 = 0,
    wet: f32 = 0.5,
    sample_rate: f32 = 44100,
    
    pub fn process(self: *Chorus, data: []f32) void {
        var i: usize = 0;
        while (i < data.len - 1) : (i += 2) {
            const s_l = data[i];
            const s_r = data[i+1];
            
            const t = @as(f32, @floatFromInt(i / 2)) / self.sample_rate;
            const lfo_l = std.math.sin(shared.TWO_PI * self.rate * t);
            const lfo_r = std.math.sin(shared.TWO_PI * self.rate * t + shared.PI * 0.5);
            
            const delay_l_samples = (self.base_time + self.depth * lfo_l) * self.sample_rate;
            const delay_r_samples = (self.base_time + self.depth * lfo_r) * self.sample_rate;
            
            const read_l = @as(f32, @floatFromInt(self.delay_l.write_ptr)) - delay_l_samples;
            const read_r = @as(f32, @floatFromInt(self.delay_r.write_ptr)) - delay_r_samples;
            
            const delayed_l = self.delay_l.readInterpolated(read_l);
            const delayed_r = self.delay_r.readInterpolated(read_r);
            
            self.delay_l.buffer[self.delay_l.write_ptr] = s_l + delayed_l * self.feedback;
            self.delay_r.buffer[self.delay_r.write_ptr] = s_r + delayed_r * self.feedback;
            
            self.delay_l.write_ptr = (self.delay_l.write_ptr + 1) % 4800;
            self.delay_r.write_ptr = (self.delay_r.write_ptr + 1) % 4800;
            
            data[i] = s_l * (1.0 - self.wet) + delayed_l * self.wet;
            data[i+1] = s_r * (1.0 - self.wet) + delayed_r * self.wet;
        }
    }
};

pub fn processFeedbackDelay(data: []f32, sample_rate: f32, time: f32, feedback: f32, wet: f32) void {
    var d = FeedbackDelay{ .sample_rate = sample_rate, .time = time, .feedback = feedback, .wet = wet };
    d.process(data);
}

pub fn processChorus(data: []f32, sample_rate: f32, rate: f32, base_time: f32, depth: f32, feedback: f32, wet: f32) void {
    var c = Chorus{ .sample_rate = sample_rate, .rate = rate, .base_time = base_time, .depth = depth, .feedback = feedback, .wet = wet };
    c.process(data);
}
