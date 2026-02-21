import React from 'react';
import { ModuleShell } from '../ui/ModuleShell';
import { Knob } from '../ui/Knob';
import { RackModule } from '@/store/useAudioStore';

interface PedalChorusUnitProps {
  module: RackModule;
  onRemove: () => void;
  onBypass: () => void;
  onUpdate: (param: string, value: any) => void;
  dragHandleProps?: any;
}

export const PedalChorusUnit: React.FC<PedalChorusUnitProps> = ({
  module,
  onRemove,
  onBypass,
  onUpdate,
  dragHandleProps
}) => {
  const { parameters, bypass } = module;

  return (
    <ModuleShell
      title="Pedal: Chorus"
      color="text-purple-400"
      onRemove={onRemove}
      onBypass={onBypass}
      isBypassed={bypass}
      dragHandleProps={dragHandleProps}
    >
      <div className="flex items-center justify-around gap-4">
        <Knob
          label="Rate"
          unit="Hz"
          value={parameters.rate}
          min={0.1}
          max={5}
          step={0.1}
          onChange={(v: number) => onUpdate('rate', v)}
        />
        <Knob
          label="Depth"
          value={parameters.depth}
          min={0}
          max={100}
          step={1}
          onChange={(v: number) => onUpdate('depth', v)}
        />
      </div>
    </ModuleShell>
  );
};
