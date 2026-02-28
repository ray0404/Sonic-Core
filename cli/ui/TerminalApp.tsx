import React, { useEffect } from 'react';
import { Box, useInput, useApp } from 'ink';
import { SonicEngine } from '../../packages/sonic-core/src/engine-interface.ts';
import { useTUIStore } from './store.ts';
import { linearToDb } from '../../packages/sonic-core/src/utils/audio-math.ts';

// Import Views
import { MainView } from './views/MainView.ts';
import { RackView } from './views/RackView.ts';
import { AddModuleView } from './views/AddModuleView.ts';
import { ModuleEditView } from './views/ModuleEditView.ts';
import { LoadFileView } from './views/LoadFileView.ts';
import { ExportView } from './views/ExportView.ts';
import { AnalyzerView } from './views/AnalyzerView.ts';
import { SmartAssistView } from './views/SmartAssistView.ts';

export const TerminalApp = ({ engine }: { engine: SonicEngine }) => {
  const { view, setView, setRack, setPlayback, setMetering, setMessage, setModuleDescriptors, playback, setSuggestions } = useTUIStore();
  const { exit } = useApp();

  // Initial state hydration
  useEffect(() => {
    const syncInitialState = async () => {
      try {
        const [initialRack, initialPlayback, descriptors] = await Promise.all([
          engine.getRack(),
          engine.getPlaybackState(),
          engine.getModuleDescriptors(),
        ]);
        
        setRack(initialRack || []);
        setPlayback(initialPlayback || { isPlaying: false, currentTime: 0, duration: 0 });
        setModuleDescriptors(descriptors || {});

      } catch (e) {
        setMessage('Error connecting to engine.');
      }
    };
    syncInitialState();
  }, [engine, setRack, setPlayback, setMessage, setModuleDescriptors]);

  // Real-time polling for playback state and meters
  useEffect(() => {
    // 1. High-frequency loop for meters and transport (30Hz for Android stability)
    const meterInterval = setInterval(async () => {
      try {
        const [state, meters] = await Promise.all([
          engine.getPlaybackState(),
          engine.getMetering()
        ]);
        
        setPlayback(state);
        
        setMetering({
          input: linearToDb(meters.levels[0]),
          output: linearToDb(meters.levels[1] || meters.levels[0]),
          gainReduction: 0,
          rack: meters.rackReduction || {},
          fftData: meters.fftData,
          stats: meters.stats
        });
      } catch (e) {
        // Silently fail polling
      }
    }, 33);

    // 2. Low-frequency loop for rack sync (2Hz)
    const rackInterval = setInterval(async () => {
        try {
            const rack = await engine.getRack();
            setRack(rack);
        } catch (e) {
            // Silently fail
        }
    }, 500);

    return () => {
        clearInterval(meterInterval);
        clearInterval(rackInterval);
    };
  }, [engine, setPlayback, setMetering, setRack]);

  // Global Shortcuts
  useInput(async (input, key) => {
      const currentView = useTUIStore.getState().view;
      
      // Strict blocking for views that require full keyboard input
      if (['LOAD_FILE', 'EXPORT', 'SMART_ASSIST'].includes(currentView)) return;

      // For Module Edit, we need to be careful. 
      // If we are just navigating (arrows), shortcuts are fine.
      // But we don't know if user is 'typing' a number.
      // For safety, we block letter keys in MODULE_EDIT, but allow Space (Play/Pause).
      const isInputSensitive = currentView === 'MODULE_EDIT';

      // Play/Pause - Global
      if (input === ' ') {
          await engine.togglePlay();
          return;
      }

      // Toggle Advanced Analyzer
      if (input === 'a' || input === 'A') {
          if (currentView === 'ANALYZER') {
              setView('MAIN');
          } else {
              setView('ANALYZER');
          }
          return;
      }

      // Smart Assist Trigger from Analyzer
      if (currentView === 'ANALYZER' && (input === 'i' || input === 'I')) {
          setSuggestions(null); // Force refresh
          setView('SMART_ASSIST');
          return;
      }

      // Toggle Stats Pane in Analyzer
      if (currentView === 'ANALYZER' && key.rightArrow) {
          const { showAnalyzerStats, setShowAnalyzerStats } = useTUIStore.getState();
          setShowAnalyzerStats(!showAnalyzerStats);
          return;
      }

      // Exit (Global-ish, but dangerous if typing)
      if (currentView === 'MAIN' && (input === 'x' || input === 'X')) {
          exit();
          return;
      }

      // Escape to Main
      if (key.escape && currentView !== 'MAIN') {
           setView('MAIN');
           return;
      }

      // --- Shortcuts blocked in sensitive views ---
      if (isInputSensitive) return;

      // Transport
      if (input === 's') { // Stop
          if (playback.isPlaying) await engine.togglePlay();
          await engine.seek(0);
      }
      if (input === ',') { // Rewind
          await engine.seek(Math.max(0, playback.currentTime - 5));
      }
      if (input === '.') { // Forward
          await engine.seek(Math.min(playback.duration, playback.currentTime + 5));
      }

      // Navigation
      if (input === 'm') {
          setView('RACK');
      }
      if (input === 'f' && currentView === 'MAIN') { // Load File
          setView('LOAD_FILE');
      }
      // Export is 'S' (Shift+s) to avoid conflict with Stop 's'? 
      // Or maybe 'e'. The prompt suggested 's' for Stop.
      if (currentView === 'MAIN' && input === 'S') { // Shift+S for Export
           setView('EXPORT');
      }
  });

  const renderView = () => {
    switch (view) {
      case 'RACK':
        return <RackView engine={engine} />;
      case 'ADD_MODULE':
        return <AddModuleView engine={engine} />;
      case 'MODULE_EDIT':
        return <ModuleEditView engine={engine} />;
      case 'LOAD_FILE':
        return <LoadFileView engine={engine} />;
      case 'EXPORT':
        return <ExportView engine={engine} />;
      case 'ANALYZER':
        return <AnalyzerView engine={engine} />;
      case 'SMART_ASSIST':
        return <SmartAssistView engine={engine} />;
      case 'MAIN':
      default:
        return <MainView engine={engine} />;
    }
  };

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="cyan" minHeight={15}>
      {renderView()}
    </Box>
  );
};
