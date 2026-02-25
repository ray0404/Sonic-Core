import { describe, it, expect } from 'vitest';
import { parseZigMetadataString } from './sonicforge_autogen';

describe('SonicForge Autogen Parser', () => {
    it('correctly parses a valid plugin metadata block', () => {
        const mockZigContent = `
const std = @import("std");
const plugin_interface = @import("../plugin_interface.zig");

pub const metadata = plugin_interface.PluginMeta{
    .id = "test-plugin",
    .name = "Test Plugin",
    .parameters = &[_]plugin_interface.ParameterMeta{
        .{ .name = "freq", .label = "Frequency", .min = 20.0, .max = 20000.0, .default_val = 1000.0, .unit = "Hz" },
        .{ .name = "mix", .label = "Mix", .min = 0.0, .max = 1.0, .default_val = 0.5 },
    }
};

// other code...
`;

        const result = parseZigMetadataString(mockZigContent);
        
        expect(result).not.toBeNull();
        expect(result?.id).toBe('test-plugin');
        expect(result?.name).toBe('Test Plugin');
        expect(result?.className).toBe('TestPlugin');
        expect(result?.parameters).toHaveLength(2);
        
        const freqParam = result?.parameters[0];
        expect(freqParam?.name).toBe('freq');
        expect(freqParam?.label).toBe('Frequency');
        expect(freqParam?.min).toBe(20.0);
        expect(freqParam?.max).toBe(20000.0);
        expect(freqParam?.default_val).toBe(1000.0);
        expect(freqParam?.unit).toBe('Hz');

        const mixParam = result?.parameters[1];
        expect(mixParam?.name).toBe('mix');
        expect(mixParam?.unit).toBe(''); // default empty unit when omitted
    });
    
    it('returns null for content without metadata', () => {
        const result = parseZigMetadataString("const foo = 1;");
        expect(result).toBeNull();
    });
});
