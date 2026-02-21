import React from 'react';
import { ModuleShell } from '../ui/ModuleShell';
import { Knob } from '../ui/Knob';
import { RackModule } from '@/store/useAudioStore';

interface PedalReverbUnitProps {
  module: RackModule;
  onRemove: () => void;
  onBypass: () => void;
  onUpdate: (param: string, value: any) => void;
  dragHandleProps?: any;
}

export const PedalReverbUnit: React.FC<PedalReverbUnitProps> = ({
  module,
  onRemove,
  onBypass,
  onUpdate,
  dragHandleProps
}) => {
  const { parameters, bypass } = module;

  return (
    <ModuleShell
      title="Pedal: Reverb"
      color="text-orange-400"
      onRemove={onRemove}
      onBypass={onBypass}
      isBypassed={bypass}
      dragHandleProps={dragHandleProps}
    >
      <div className="flex items-center justify-around gap-4">
        <Knob
          label="Decay"
          unit="s"
          value={parameters.decay}
          min={0.1}
          max={10}
          step={0.1}
          onChange={(v: number) => onUpdate('decay', v)}
        />
        <Knob
          label="Mix"
          value={parameters.mix}
          min={0}
          max={1}
          step={0.01}
          onChange={(v: number) => onUpdate('mix', v)}
        />
      </div>
    </ModuleShell>
  );
};
