import React, { useState } from 'react';
import { Sparkles, Play, Square, Music, Send, Loader2, Guitar } from 'lucide-react';
import { JamComposer } from '@/services/ai/JamComposer';
import { ToneModeler } from '@/services/ai/ToneModeler';
import { useAudioStore } from '@/store/useAudioStore';

export const JamSession: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [blueprint, setBlueprint] = useState<any>(null);
  
  const { activeTrackId, tracks, master, updateModuleParam } = useAudioStore();
  const [isPlaying, setIsPlaying] = useState(false);

  const jamComposer = new JamComposer();
  const toneModeler = new ToneModeler();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
        const activeTrack = activeTrackId === 'MASTER' ? master : tracks[activeTrackId];

        // 1. Generate Blueprint
        const bp = await jamComposer.generateBlueprint(prompt);
        if (bp) {
            setBlueprint(bp);
            
            // Update Drum Machine
            const drumModule = activeTrack?.rack.find((m: any) => m.type === 'DRUM_MACHINE');
            if (drumModule) {
                updateModuleParam(activeTrackId, drumModule.id, 'tempo', bp.tempo);
            }

            // Update Tab Player
            const tabModule = activeTrack?.rack.find((m: any) => m.type === 'TAB_PLAYER');
            if (tabModule) {
                updateModuleParam(activeTrackId, tabModule.id, 'tempo', bp.tempo);
            }
        }

        // 2. Generate Tone
        const rig = await toneModeler.generateRig(prompt);
        if (rig) {
            const guitarRigModule = activeTrack?.rack.find((m: any) => m.type === 'GUITAR_RIG');
            if (guitarRigModule) {
                Object.entries(rig.params).forEach(([key, value]) => {
                    updateModuleParam(activeTrackId, guitarRigModule.id, key, value);
                });
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        setIsGenerating(false);
    }
  };

  const togglePlay = () => {
      const nextPlaying = !isPlaying;
      setIsPlaying(nextPlaying);

      const activeTrack = activeTrackId === 'MASTER' ? master : tracks[activeTrackId];
      const drumModule = activeTrack?.rack.find(m => m.type === 'DRUM_MACHINE');
      const tabModule = activeTrack?.rack.find(m => m.type === 'TAB_PLAYER');

      if (drumModule) updateModuleParam(activeTrackId, drumModule.id, 'play', nextPlaying ? 1 : 0);
      if (tabModule) updateModuleParam(activeTrackId, tabModule.id, 'play', nextPlaying ? 1 : 0);
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-slate-900/50 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="text-white" size={20} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-white tracking-tight">AI Jam Session</h2>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Creative Co-Pilot</p>
            </div>
        </div>

        <div className="flex gap-2">
            <div className="flex-1 relative">
                <input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe a vibe (e.g. 'Crunchy 70s rock in A minor', 'Ambient jazz with lots of delay')"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white p-2 rounded-lg transition-all shadow-lg active:scale-95"
                    >
                        {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </div>
            </div>
        </div>

        {blueprint && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500 flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter flex items-center gap-1">
                                <Music size={12} /> Composition
                            </span>
                            <span className="text-xs font-bold text-purple-400">{blueprint.tempo} BPM • Key: {blueprint.key}</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {blueprint.chordProgression.map((chord: string, i: number) => (
                                <div key={i} className="px-3 py-1.5 bg-slate-800 rounded-lg text-sm font-bold text-slate-200 border border-slate-700/50 shadow-sm min-w-[40px] text-center">
                                    {chord}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter flex items-center gap-1">
                                <Guitar size={12} /> AI Tone matching
                            </span>
                            <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/20">APPLIED</span>
                        </div>
                        <p className="text-xs text-slate-400 italic">"{blueprint.styleDescription}"</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 bg-purple-950/20 p-3 rounded-xl border border-purple-500/20">
                    <button 
                        onClick={togglePlay}
                        className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white shadow-glow hover:bg-purple-500 transition-all active:scale-90"
                    >
                        {isPlaying ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                    </button>
                    <div className="flex-1">
                        <div className="text-xs font-bold text-purple-200 uppercase tracking-wide">Backing Track Ready</div>
                        <div className="text-[10px] text-purple-400/60 font-mono">SYNTHESIZED MIDI • LOOP ENABLED</div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
