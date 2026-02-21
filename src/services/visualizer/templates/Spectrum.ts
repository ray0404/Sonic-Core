import { VisualizerRenderer } from './types';

export const renderSpectrum: VisualizerRenderer = (ctx, width, height, data) => {
  // Clear with semi-transparent black
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, width, height);

  const barWidth = (width / data.length) * 2.5;
  let barHeight;
  let x = 0;

  for (let i = 0; i < data.length; i++) {
    barHeight = data[i] * height / 2;

    const r = barHeight + (25 * (i / data.length));
    const g = 250 * (i / data.length);
    const b = 50;

    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(x, height - barHeight / 2, barWidth, barHeight / 2);

    x += barWidth + 1;
  }
};
