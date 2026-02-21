import React from 'react';
import { ModuleShell } from '../ui/ModuleShell';
import { Knob } from '../ui/Knob';
import { RackModule } from '@/store/useAudioStore';

interface DrumMachineUnitProps {
  module: RackModule;
  onRemove: () => void;
  onBypass: () => void;
  onUpdate: (param: string, value: any) => void;
  dragHandleProps?: any;
}

export const DrumMachineUnit: React.FC<DrumMachineUnitProps> = ({
  module,
  onRemove,
  onBypass,
  onUpdate,
  dragHandleProps
}) => {
  const { parameters, bypass } = module;

  return (
    <ModuleShell
      title="Drum Machine"
      color="text-pink-500"
      onRemove={onRemove}
      onBypass={onBypass}
      isBypassed={bypass}
      dragHandleProps={dragHandleProps}
    >
      <div className="flex items-center justify-around gap-4">
        <Knob label="Tempo" value={parameters.tempo} min={40} max={240} step={1} unit="BPM" onChange={(v) => onUpdate('tempo', v)} />
        <Knob label="Volume" value={parameters.volume} min={0} max={1} step={0.01} onChange={(v) => onUpdate('volume', v)} />
        
        <button
            onClick={() => onUpdate('play', !parameters.play)}
            className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${parameters.play ? 'border-pink-500 bg-pink-500/20 text-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.4)]' : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}
        >
            {parameters.play ? 'STOP' : 'PLAY'}
        </button>
      </div>
    </ModuleShell>
  );
};
