import React from 'react';
import { ModuleShell } from '../ui/ModuleShell';
import { Knob } from '../ui/Knob';
import { RackModule } from '@/store/useAudioStore';

interface PedalOverdriveUnitProps {
  module: RackModule;
  onRemove: () => void;
  onBypass: () => void;
  onUpdate: (param: string, value: any) => void;
  dragHandleProps?: any;
}

export const PedalOverdriveUnit: React.FC<PedalOverdriveUnitProps> = ({
  module,
  onRemove,
  onBypass,
  onUpdate,
  dragHandleProps
}) => {
  const { parameters, bypass } = module;

  return (
    <ModuleShell
      title="Pedal: OD"
      color="text-lime-400"
      onRemove={onRemove}
      onBypass={onBypass}
      isBypassed={bypass}
      dragHandleProps={dragHandleProps}
    >
      <div className="flex items-center justify-around gap-4">
        <Knob
          label="Drive"
          value={parameters.drive}
          min={0}
          max={100}
          step={1}
          onChange={(v: number) => onUpdate('drive', v)}
        />
        <Knob
          label="Tone"
          value={parameters.tone}
          min={0}
          max={100}
          step={1}
          onChange={(v: number) => onUpdate('tone', v)}
        />
        <Knob
          label="Level"
          value={parameters.level}
          min={0}
          max={1}
          step={0.01}
          onChange={(v: number) => onUpdate('level', v)}
        />
      </div>
    </ModuleShell>
  );
};
