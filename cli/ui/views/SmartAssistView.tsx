import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useTUIStore } from '../store.js';
import { SonicEngine } from '../../../packages/sonic-core/src/engine-interface.js';

export const SmartAssistView = ({ engine }: { engine: SonicEngine }) => {
  const { setView, setRack, setMessage, suggestions, setSuggestions } = useTUIStore();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(!suggestions);

  useEffect(() => {
    if (!suggestions) {
        const fetchSuggestions = async () => {
            try {
                const results = await engine.getSuggestions();
                setSuggestions(results);
            } catch (e) {
                setMessage('Error generating suggestions');
            } finally {
                setLoading(false);
            }
        };
        fetchSuggestions();
    } else {
        setLoading(false);
    }
  }, [engine, suggestions, setSuggestions, setMessage]);

  useInput(async (input, key) => {
    if (key.escape || input === 'a') {
        setView('ANALYZER');
        return;
    }

    if (!suggestions || suggestions.length === 0) return;

    if (key.upArrow) {
      setSelectedIndex(Math.max(0, selectedIndex - 1));
    }
    if (key.downArrow) {
      setSelectedIndex(Math.min(suggestions.length - 1, selectedIndex + 1));
    }

    if (key.return) {
        // Apply all suggestions
        setLoading(true);
        try {
            // First clear current rack? 
            // The goal is "optimized DSP rack configuration". 
            // Usually this means replacing or adding a fresh chain.
            // Let's assume we replace the rack for a "Magic Wand" experience.
            
            // In a real app we might ask, but here we'll just do it.
            // We need to implement a 'setRack' or similar in SonicEngine to do this efficiently.
            // For now, we'll just add them one by one (this might be slow due to re-processing).
            
            // Actually, let's add a `setRack` method to the engine for bulk updates.
            // I'll do that in a follow-up.
            
            setMessage('Applying Smart Chain...', 2000);
            
            for (const sugg of suggestions) {
                await engine.addModule(sugg.type);
                // Note: parameters aren't passed to addModule in current interface.
                // We might need to update the last added module.
                const rack = await engine.getRack();
                const lastMod = rack[rack.length - 1];
                for (const [pid, val] of Object.entries(sugg.parameters)) {
                    await engine.updateParam(lastMod.id, pid, val as number);
                }
            }
            
            setRack(await engine.getRack());
            setView('RACK');
        } catch (e) {
            setMessage('Error applying chain');
        } finally {
            setLoading(false);
        }
    }
  });

  if (loading) {
    return (
      <Box flexDirection="column" alignItems="center" justifyContent="center" height={10}>
        <Text color="yellow">Analyzing Spectral Profile...</Text>
        <Text dimColor>Calculating optimal DSP chain</Text>
      </Box>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <Box flexDirection="column" alignItems="center" justifyContent="center" height={10}>
        <Text color="green">Audio profile is healthy!</Text>
        <Text dimColor>No critical corrections suggested.</Text>
        <Box marginTop={1}>
            <Text>Press [escape] to return</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Box justifyContent="space-between" marginBottom={1}>
        <Text color="magenta" bold>✨ Sonic Intelligence Assistant</Text>
        <Text dimColor>[esc] cancel | [enter] apply chain</Text>
      </Box>

      <Box flexDirection="row">
        {/* Suggested Chain */}
        <Box flexDirection="column" flexGrow={1} borderStyle="single" borderColor="magenta" paddingX={1}>
            <Box marginBottom={1}>
                <Text bold color="white">Recommended Processing Chain:</Text>
            </Box>
            {suggestions.map((s, i) => (
                <Box key={i} flexDirection="row">
                    <Text color={i === selectedIndex ? 'cyan' : 'white'}>
                        {i === selectedIndex ? '▶ ' : '  '}
                        {s.name} <Text dimColor>({s.type})</Text>
                    </Text>
                </Box>
            ))}
        </Box>

        {/* Insight Panel */}
        <Box flexDirection="column" width={30} marginLeft={1} borderStyle="classic" paddingX={1}>
            <Text bold color="yellow">Why this chain?</Text>
            <Box marginTop={1} flexDirection="column">
                <Text dimColor>Based on your spectral analysis, we've identified areas for improvement:</Text>
                <Box marginTop={1}>
                    <Text color="cyan">• </Text>
                    <Text>Standardized gain structure</Text>
                </Box>
                {suggestions.some(s => s.type === 'DE_CLIP') && (
                    <Box>
                        <Text color="red">• </Text>
                        <Text>Clipping detected</Text>
                    </Box>
                )}
                {suggestions.some(s => s.type === 'MONO_BASS') && (
                    <Box>
                        <Text color="blue">• </Text>
                        <Text>Phase issues in low-end</Text>
                    </Box>
                )}
                {suggestions.some(s => s.type === 'DE_ESSER') && (
                    <Box>
                        <Text color="yellow">• </Text>
                        <Text>Excessive sibilance</Text>
                    </Box>
                )}
            </Box>
        </Box>
      </Box>
    </Box>
  );
};
