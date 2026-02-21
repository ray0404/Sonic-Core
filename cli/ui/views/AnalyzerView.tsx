import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { MeterBar } from '../components/MeterBar.js';
import { SpectralVisualizer } from '../components/SpectralVisualizer.js';
import { useTUIStore } from '../store.js';
import { SonicEngine } from '../../../packages/sonic-core/src/engine-interface.js';

export const AnalyzerView = ({ engine }: { engine: SonicEngine }) => {
  const { playback, metering, setView, showAnalyzerStats } = useTUIStore();
  const { stdout } = useStdout();

  const stats = metering.stats || {
    lufs: -100,
    lra: 0,
    crest: 0,
    correlation: 1,
    width: 0,
    balance: 0,
    specLow: 0.33,
    specMid: 0.33,
    specHigh: 0.33
  };

  // Dynamic width calculation
  // Total terminal width - border padding - stats width (if visible) - Y-axis labels
  const terminalWidth = stdout?.columns || 80;
  const yAxisWidth = 6;
  const statsWidth = showAnalyzerStats ? Math.round(terminalWidth * 0.3) : 0;
  const borderPadding = 4;
  const spectrogramWidth = terminalWidth - yAxisWidth - statsWidth - borderPadding;

  const getCorrelationBar = (val: number) => {
    const width = 15;
    // Map -1..1 to 0..width
    const pos = Math.round(((val + 1) / 2) * width);
    const bar = ' '.repeat(pos) + '█' + ' '.repeat(Math.max(0, width - pos));
    return `[L]${bar}[R]`;
  };

  const getSpectralBar = (l: number, m: number, h: number) => {
    const width = 20;
    const lDots = Math.round(l * width);
    const mDots = Math.round(m * width);
    const hDots = Math.max(0, width - lDots - mDots);
    return (
        <Text>
            <Text color="red">{'█'.repeat(lDots)}</Text>
            <Text color="green">{'█'.repeat(mDots)}</Text>
            <Text color="blue">{'█'.repeat(hDots)}</Text>
        </Text>
    );
  };

  return (
    <Box flexDirection="column">
      <Box justifyContent="space-between" marginBottom={1}>
        <Text color="cyan" bold>Advanced Master Analyzer</Text>
        <Text dimColor>[a] return | [→] toggle stats | [i] smart assist</Text>
      </Box>

      <Box flexDirection="row">
        {/* Left Panel: High-Res Spectrum with Axes */}
        <Box flexDirection="column" flexGrow={1} borderStyle="single" borderColor="magenta" paddingX={1}>
            <Text bold color="magenta">Inverse Fletcher-Munson Spectrogram (HD)</Text>
            
            <Box flexDirection="row" marginTop={1}>
                {/* Y-Axis (Amplitude dB) */}
                <Box flexDirection="column" marginRight={1} justifyContent="space-between" height={10}>
                    <Text dimColor> 0dB</Text>
                    <Text dimColor>-15 </Text>
                    <Text dimColor>-30 </Text>
                    <Text dimColor>-45 </Text>
                    <Text dimColor>-60 </Text>
                </Box>

                {/* Spectral Graph Area */}
                <Box flexDirection="column" flexGrow={1}>
                    <SpectralVisualizer fftData={metering.fftData} width={spectrogramWidth} height={10} />
                    
                    {/* X-Axis (Frequency) */}
                    <Box justifyContent="space-between" marginTop={0}>
                        <Text dimColor>20Hz</Text>
                        <Text dimColor>100</Text>
                        <Text dimColor>500</Text>
                        <Text dimColor>1k</Text>
                        <Text dimColor>5k</Text>
                        <Text dimColor>20k</Text>
                    </Box>
                </Box>
            </Box>
        </Box>

        {/* Right Panel: Technical Stats */}
        {showAnalyzerStats && (
            <Box flexDirection="column" width={statsWidth} borderStyle="single" borderColor="blue" paddingX={1} marginLeft={1}>
                <Text bold color="blue">Analysis</Text>
                <Box flexDirection="column" marginTop={1}>
                    <Text>Loudness: <Text color="yellow">{stats.lufs.toFixed(1)} LUFS</Text></Text>
                    <Text>Dynamics: <Text color="green">{stats.lra.toFixed(1)} LRA</Text></Text>
                    <Text>Crest:    <Text color="cyan">{stats.crest.toFixed(1)} dB</Text></Text>
                    
                    <Box marginTop={1} flexDirection="column">
                        <Text bold>Correlation</Text>
                        <Text color="white">{getCorrelationBar(stats.correlation)}</Text>
                    </Box>

                    <Box marginTop={1} flexDirection="column">
                        <Text bold>Stereo Width</Text>
                        <MeterBar label="W" value={stats.width * 100 - 60} />
                    </Box>

                    <Box marginTop={1} flexDirection="column">
                        <Text bold>Spectral Balance</Text>
                        {getSpectralBar(stats.specLow, stats.specMid, stats.specHigh)}
                        <Box justifyContent="space-between">
                            <Text color="red">L</Text>
                            <Text color="green">M</Text>
                            <Text color="blue">H</Text>
                        </Box>
                    </Box>
                </Box>
            </Box>
        )}
      </Box>

      <Box marginTop={1} flexDirection="row" justifyContent="space-between">
        <Box flexDirection="row">
            <MeterBar label="IN " value={metering.input} />
            <Box marginX={2} />
            <MeterBar label="OUT" value={metering.output} />
        </Box>
        <Text>Time: {playback.currentTime.toFixed(2)}s</Text>
      </Box>
    </Box>
  );
};
