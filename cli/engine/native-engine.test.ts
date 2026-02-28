import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NativeEngine } from './native-engine.ts';
import { SonicForgeSDK } from '../../packages/sonic-core/src/sdk.ts';

// Mock SonicForgeSDK
vi.mock('../../packages/sonic-core/src/sdk', () => {
  const MockSDK = vi.fn();
  MockSDK.prototype.init = vi.fn().mockResolvedValue(undefined);
  MockSDK.prototype.analyzeAudio = vi.fn();
  MockSDK.prototype.getFFTMagnitudes = vi.fn().mockReturnValue(new Float32Array(64).fill(0));
  return { SonicForgeSDK: MockSDK };
});

// Mock fs and other modules if needed
vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn().mockReturnValue(Buffer.from('mock wasm')),
  }
}));

describe('NativeEngine', () => {
  let engine: NativeEngine;
  let mockSdk: any;

  beforeEach(async () => {
    engine = new NativeEngine('mock/path.wasm');
    await engine.init();
    // @ts-ignore - accessing private for testing
    mockSdk = engine.sdk;
  });

  it('should sanitize NaN and Infinite values from SDK analysis', async () => {
    // SDK returns garbage
    mockSdk.analyzeAudio.mockReturnValue(new Float32Array([
        NaN,      // lufs
        Infinity, // lra
        -Infinity,// peak
        NaN,      // rms
        NaN,      // crest
        NaN,      // correlation
        NaN,      // width
        NaN,      // balance
        NaN,      // dcOffset
        NaN,      // low
        NaN,      // mid
        NaN,      // high
        NaN,      // momentary
        NaN       // shortTerm
    ]));

    // @ts-ignore
    engine.updateMetering(new Float32Array(1024).fill(0));

    // @ts-ignore
    const data = engine.meteringData;

    expect(data.stats!.lufs).toBe(-100);
    expect(data.stats!.lra).toBe(0);
    expect(data.stats!.crest).toBe(0);
    expect(data.stats!.correlation).toBe(1); // Should fallback to 1 for mono/null
    expect(data.stats!.width).toBe(0);
    expect(data.levels[0]).toBeLessThan(0.0001); // Should be mapped from -100dB
  });

  it('should support A/B mode toggling', () => {
    // @ts-ignore
    expect(engine.abMode).toBe('B'); // Default processed
    engine.setABMode('A');
    // @ts-ignore
    expect(engine.abMode).toBe('A');
    engine.setABMode('B');
    // @ts-ignore
    expect(engine.abMode).toBe('B');
  });
});
