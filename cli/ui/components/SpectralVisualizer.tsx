import React, { useMemo, useRef } from 'react';
import { Box, Text } from 'ink';

export interface SpectralVisualizerProps {
  fftData?: Float32Array;
  width?: number;
  height?: number; // In braille character rows (each is 4 dots high)
}

export const SpectralVisualizer: React.FC<SpectralVisualizerProps> = ({ 
  fftData, 
  width = 40, 
  height = 3 
}) => {
  const lastValues = useRef<Float32Array | null>(null);
  const totalBars = width * 2;

  // Logarithmic frequency mapping with bin aggregation
  const processedData = useMemo(() => {
    if (!fftData || fftData.length === 0) return new Float32Array(totalBars).fill(0);

    const result = new Float32Array(totalBars);
    const fMin = 20;
    const fMax = 20000;
    const sampleRate = 48000; // Expected default
    const numFftBins = fftData.length;
    const binSize = (sampleRate / 2) / numFftBins;

    for (let i = 0; i < totalBars; i++) {
      // Logarithmic mapping: f = fmin * (fmax/fmin)^(i/N)
      const fStart = fMin * Math.pow(fMax / fMin, i / totalBars);
      const fEnd = fMin * Math.pow(fMax / fMin, (i + 1) / totalBars);

      const binStart = Math.max(0, Math.floor(fStart / binSize));
      const binEnd = Math.min(numFftBins - 1, Math.ceil(fEnd / binSize));

      let energySum = 0;

      for (let j = binStart; j <= binEnd; j++) {
        // Magnitude is already weighted in Zig kernel
        const val = fftData[j];
        energySum += val * val;
      }

      // Root-mean-square for the band
      const count = (binEnd - binStart) + 1;
      const rms = Math.sqrt(energySum / Math.max(1, count));
      
      // Convert to dB. Using -70dB as the noise floor for more "jumpy" visuals.
      const db = rms > 0 ? 20 * Math.log10(rms) : -100;
      
      // Dynamic range: -60dB (quiet) to 0dB (loud)
      const normalized = Math.max(0, Math.min(1, (db + 60) / 60));
      result[i] = normalized;
    }

    // Temporal Smoothing (Ballistics)
    if (!lastValues.current || lastValues.current.length !== totalBars) {
      lastValues.current = new Float32Array(result);
    } else {
      for (let i = 0; i < totalBars; i++) {
        // Instant attack, fast decay for high-speed transient tracking
        const decay = 0.5; // Fast decay
        const attack = 1.0; // Instant rise
        
        if (result[i] > lastValues.current[i]) {
          lastValues.current[i] = result[i]; // Use instant attack for transients
        } else {
          lastValues.current[i] = lastValues.current[i] * decay;
        }
      }
    }

    return lastValues.current;
  }, [fftData, totalBars]);

  if (!fftData || fftData.length === 0) {
    return (
      <Box height={height + 1} borderStyle="round" borderColor="dim">
        <Text dimColor> No Audio Signal </Text>
      </Box>
    );
  }

  const getBrailleChar = (left: number[], right: number[]) => {
    let code = 0;
    // Braille dots: 1-top-left, 4-top-right, 7-bottom-left, 8-bottom-right
    if (left[0]) code |= 0x01;
    if (left[1]) code |= 0x02;
    if (left[2]) code |= 0x04;
    if (left[3]) code |= 0x40;
    
    if (right[0]) code |= 0x08;
    if (right[1]) code |= 0x10;
    if (right[2]) code |= 0x20;
    if (right[3]) code |= 0x80;
    
    return String.fromCharCode(0x2800 + code);
  };

  const getDotsForValue = (val: number, rowIdx: number, totalRows: number) => {
    const dotsPerRow = 4;
    const totalDots = totalRows * dotsPerRow;
    const scaledVal = val * totalDots;
    
    const startDot = rowIdx * dotsPerRow;
    const localVal = Math.max(0, Math.min(dotsPerRow, scaledVal - startDot));
    
    const dots = [0, 0, 0, 0];
    for (let i = 0; i < 4; i++) {
      if (localVal > i) dots[i] = 1;
    }
    // dot 0 is top, dot 3 is bottom
    return dots.reverse(); 
  };

  const rows = [];
  for (let r = height - 1; r >= 0; r--) {
    let rowStr = '';
    for (let i = 0; i < totalBars; i += 2) {
      const leftDots = getDotsForValue(processedData[i], r, height);
      const rightDots = getDotsForValue(processedData[i+1], r, height);
      rowStr += getBrailleChar(leftDots, rightDots);
    }
    rows.push(rowStr);
  }

  return (
    <Box flexDirection="column">
      {rows.map((row, i) => (
        <Text key={i} color="magenta">
          {row}
        </Text>
      ))}
    </Box>
  );
};
