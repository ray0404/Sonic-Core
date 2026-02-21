
/**
 * Generates a distortion curve simulating tube saturation.
 * @param amount - The amount of distortion (0-100 recommended, though algorithm handles higher).
 * @returns A Float32Array representing the wave shaping curve.
 */
export const makeTubeCurve = (amount: number): any => {
  const k = amount;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  for (let i = 0; i < n_samples; ++i) {
    const x = i * 2 / n_samples - 1;
    if (x < -0.08905) {
      curve[i] = -(3 / 4) * (1 - (Math.pow(1 - (Math.abs(x) - 0.032847), 12) + (1 / 3) * (Math.abs(x) - 0.032847))) + 0.01;
    } else if (x >= -0.08905 && x < 0.320018) {
      curve[i] = -6.153 * (x * x) + 3.9375 * x;
    } else {
      curve[i] = 0.630035;
    }
    // Apply gain scaling
    curve[i] = (1 - k / 100) * x + (k / 100) * curve[i] * 1.5;
  }
  return curve as any;
};

/**
 * Generates a hard clipping fuzz distortion curve.
 * @param amount - The intensity of the fuzz effect.
 * @returns A Float32Array representing the wave shaping curve.
 */
export const makeFuzzCurve = (amount: number): any => {
  const k = amount * 10;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = i * 2 / n_samples - 1;
    curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
  }
  return curve as any;
};
