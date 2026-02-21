import { useEffect } from 'react';
import { useAudioStore } from '@/store/useAudioStore';
import { useUIStore } from '@/store/useUIStore';
import { MasteringWorkspace } from '@/components/layout/MasteringWorkspace';
import { SmartToolsWorkspace } from '@/components/layout/SmartToolsWorkspace';

function App() {
  const { isInitialized, initializeEngine } = useAudioStore();
  const { activeView } = useUIStore();

  useEffect(() => {
    // Attempt auto-init on user interaction if needed
  }, []);

  const handleStart = async () => {
      await initializeEngine();
  };

  if (!isInitialized) {
      return (
          <div className="flex items-center justify-center h-full w-full bg-background">
              <button
                onClick={handleStart}
                className="px-8 py-4 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl shadow-2xl transition-all transform hover:scale-105"
              >
                  Initialize Sonic Forge
              </button>
          </div>
      )
  }

  if (activeView === 'SMART_TOOLS') {
      return <SmartToolsWorkspace />;
  }

  return <MasteringWorkspace />;
}

export default App;
