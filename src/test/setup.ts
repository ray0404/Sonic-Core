import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock Canvas getContext
HTMLCanvasElement.prototype.getContext = vi.fn();

// Global Web Audio API Mocks

// AudioWorkletNode
class AudioWorkletNodeMock {
  context: any;
  constructor(context: any) {
    this.context = context;
  }
  connect() {}
  disconnect() {}
  parameters = { 
    get: vi.fn(() => ({ 
      value: 0, 
      setTargetAtTime: vi.fn(),
      setValueAtTime: vi.fn()
    })) 
  };
  port = { postMessage: () => {}, onmessage: null };
}
vi.stubGlobal('AudioWorkletNode', AudioWorkletNodeMock);

// Mock Worker
class WorkerMock {
    onmessage = null;
    postMessage = vi.fn();
    terminate = vi.fn();
}
vi.stubGlobal('Worker', WorkerMock);

// AudioNode (often needed if extending)
class AudioNodeMock {
  connect() {}
  disconnect() {}
}
vi.stubGlobal('AudioNode', AudioNodeMock);

// AudioContext (Basic Mock)
// Individual tests can override this if they need specific return values
class AudioContextMock {
  state = 'suspended';
  resume = vi.fn();
  createGain = vi.fn(() => {
    const node = {
      context: this as any,
      gain: { value: 0, setTargetAtTime: vi.fn(), setValueAtTime: vi.fn() },
      connect: vi.fn((dest) => dest),
      disconnect: vi.fn(),
    };
    return node;
  });
  createAnalyser = vi.fn(() => {
    const node = {
      context: this as any,
      fftSize: 2048,
      frequencyBinCount: 1024,
      connect: vi.fn((dest) => dest),
      disconnect: vi.fn(),
      getByteFrequencyData: vi.fn(),
      getByteTimeDomainData: vi.fn(),
      getFloatTimeDomainData: vi.fn(),
    };
    return node;
  });
  createStereoPanner = vi.fn(() => {
    const node = {
      context: this as any,
      pan: { value: 0, setTargetAtTime: vi.fn(), setValueAtTime: vi.fn() },
      connect: vi.fn((dest) => dest),
      disconnect: vi.fn(),
    };
    return node;
  });
  createConvolver = vi.fn(() => {
    const node = { 
      context: this as any,
      connect: vi.fn((dest) => dest), 
      disconnect: vi.fn() 
    };
    return node;
  });
  createChannelSplitter = vi.fn((_channels) => {
    const node = {
      context: this as any,
      connect: vi.fn((dest) => dest),
      disconnect: vi.fn(),
    };
    return node;
  });
  createBufferSource = vi.fn(() => {
    const node = {
      context: this as any,
      connect: vi.fn((dest) => dest),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
      buffer: null,
      onended: null,
    };
    return node;
  });
  createDynamicsCompressor = vi.fn(() => {
    const node = {
      context: this as any,
      threshold: { value: 0, setTargetAtTime: vi.fn(), setValueAtTime: vi.fn() },
      knee: { value: 0, setTargetAtTime: vi.fn(), setValueAtTime: vi.fn() },
      ratio: { value: 0, setTargetAtTime: vi.fn(), setValueAtTime: vi.fn() },
      attack: { value: 0, setTargetAtTime: vi.fn(), setValueAtTime: vi.fn() },
      release: { value: 0, setTargetAtTime: vi.fn(), setValueAtTime: vi.fn() },
      reduction: 0,
      connect: vi.fn((dest) => dest),
      disconnect: vi.fn(),
    };
    return node;
  });
  createBiquadFilter = vi.fn(() => {
    const node = {
      context: this as any,
      type: 'lowpass',
      frequency: { value: 0, setTargetAtTime: vi.fn(), setValueAtTime: vi.fn() },
      detune: { value: 0, setTargetAtTime: vi.fn(), setValueAtTime: vi.fn() },
      Q: { value: 0, setTargetAtTime: vi.fn(), setValueAtTime: vi.fn() },
      gain: { value: 0, setTargetAtTime: vi.fn(), setValueAtTime: vi.fn() },
      connect: vi.fn((dest) => dest),
      disconnect: vi.fn(),
    };
    return node;
  });
  createWaveShaper = vi.fn(() => {
    const node = {
      context: this as any,
      curve: null,
      oversample: 'none',
      connect: vi.fn((dest) => dest),
      disconnect: vi.fn(),
    };
    return node;
  });
  createOscillator = vi.fn(() => {
    const node = {
      context: this as any,
      type: 'sine',
      frequency: { value: 440, setTargetAtTime: vi.fn(), setValueAtTime: vi.fn() },
      detune: { value: 0, setTargetAtTime: vi.fn(), setValueAtTime: vi.fn() },
      start: vi.fn(),
      stop: vi.fn(),
      connect: vi.fn((dest) => dest),
      disconnect: vi.fn(),
      onended: null,
    };
    return node;
  });
  createDelay = vi.fn(() => {
    const node = {
      context: this as any,
      delayTime: { value: 0, setTargetAtTime: vi.fn(), setValueAtTime: vi.fn() },
      connect: vi.fn((dest) => dest),
      disconnect: vi.fn(),
    };
    return node;
  });
  createChannelMerger = vi.fn(() => {
    const node = {
      context: this as any,
      connect: vi.fn((dest) => dest),
      disconnect: vi.fn(),
    };
    return node;
  });
  createBuffer = vi.fn(() => ({
    duration: 1,
    length: 44100,
    numberOfChannels: 1,
    sampleRate: 44100,
    getChannelData: vi.fn(() => new Float32Array(44100)),
    copyFromChannel: vi.fn(),
    copyToChannel: vi.fn(),
  }));
  decodeAudioData = vi.fn();
  audioWorklet = {
    addModule: vi.fn().mockResolvedValue(undefined),
  };
  destination = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    numberOfInputs: 1,
    numberOfOutputs: 0,
    channelCount: 2,
    channelCountMode: 'explicit',
    channelInterpretation: 'speakers',
    context: {} as any,
  };
  currentTime = 0;
  sampleRate = 44100;
}
vi.stubGlobal('AudioContext', AudioContextMock);
// Ensure we handle window.AudioContext for tests that run in "jsdom"
if (typeof window !== 'undefined') {
    vi.stubGlobal('window.AudioContext', AudioContextMock);
}

// Mock standardized-audio-context
vi.mock('standardized-audio-context', async () => {
    return {
        AudioContext: AudioContextMock,
        OfflineAudioContext: AudioContextMock, // reuse same mock for now
        AudioWorkletNode: AudioWorkletNodeMock,
        // Add other exports if needed
    };
});
