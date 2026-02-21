import React from 'react';
import { ModuleShell } from '../ui/ModuleShell';
import { Knob } from '../ui/Knob';
import { RackModule } from '@/store/useAudioStore';

interface MetronomeUnitProps {
  module: RackModule;
  onRemove: () => void;
  onBypass: () => void;
  onUpdate: (param: string, value: any) => void;
  dragHandleProps?: any;
}

export const MetronomeUnit: React.FC<MetronomeUnitProps> = ({
  module,
  onRemove,
  onBypass,
  onUpdate,
  dragHandleProps
}) => {
  const { parameters, bypass } = module;

  return (
    <ModuleShell
      title="Metronome"
      color="text-white"
      onRemove={onRemove}
      onBypass={onBypass}
      isBypassed={bypass}
      dragHandleProps={dragHandleProps}
    >
      <div className="flex items-center justify-around gap-4">
        <Knob label="Tempo" value={parameters.tempo} min={40} max={240} step={1} unit="BPM" onChange={(v) => onUpdate('tempo', v)} />
        <button
            onClick={() => onUpdate('enabled', !parameters.enabled)}
            className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${parameters.enabled ? 'border-white bg-white/20 text-white animate-pulse' : 'border-slate-700 text-slate-500'}`}
        >
            {parameters.enabled ? 'ON' : 'OFF'}
        </button>
      </div>
    </ModuleShell>
  );
};
