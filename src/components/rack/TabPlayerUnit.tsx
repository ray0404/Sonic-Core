import React from 'react';
import { ModuleShell } from '../ui/ModuleShell';
import { Knob } from '../ui/Knob';
import { RackModule } from '@/store/useAudioStore';

interface TabPlayerUnitProps {
  module: RackModule;
  onRemove: () => void;
  onBypass: () => void;
  onUpdate: (param: string, value: any) => void;
  dragHandleProps?: any;
}

export const TabPlayerUnit: React.FC<TabPlayerUnitProps> = ({
  module,
  onRemove,
  onBypass,
  onUpdate,
  dragHandleProps
}) => {
  const { parameters, bypass } = module;

  return (
    <ModuleShell
      title="Tab Player"
      color="text-cyan-400"
      onRemove={onRemove}
      onBypass={onBypass}
      isBypassed={bypass}
      dragHandleProps={dragHandleProps}
    >
      <div className="flex items-center justify-around gap-4">
        <Knob label="Tempo" value={parameters.tempo} min={40} max={240} step={1} unit="BPM" onChange={(v) => onUpdate('tempo', v)} />
        
        <div className="flex flex-col gap-2">
            {['Acoustic', 'Clean', 'Distorted'].map((m, i) => (
                <button
                    key={m}
                    onClick={() => onUpdate('mode', i)}
                    className={`px-2 py-1 text-[10px] rounded uppercase font-bold ${parameters.mode === i ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-500'}`}
                >
                    {m}
                </button>
            ))}
        </div>

        <button
            onClick={() => onUpdate('play', !parameters.play)}
            className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${parameters.play ? 'border-cyan-500 bg-cyan-500/20 text-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]' : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}
        >
            {parameters.play ? 'STOP' : 'PLAY'}
        </button>
      </div>
    </ModuleShell>
  );
};
