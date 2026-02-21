import React from 'react';
import { ModuleShell } from '../ui/ModuleShell';
import { Knob } from '../ui/Knob';
import { RackModule } from '@/store/useAudioStore';

interface PedalDelayUnitProps {
  module: RackModule;
  onRemove: () => void;
  onBypass: () => void;
  onUpdate: (param: string, value: any) => void;
  dragHandleProps?: any;
}

export const PedalDelayUnit: React.FC<PedalDelayUnitProps> = ({
  module,
  onRemove,
  onBypass,
  onUpdate,
  dragHandleProps
}) => {
  const { parameters, bypass } = module;

  return (
    <ModuleShell
      title="Pedal: Delay"
      color="text-green-400"
      onRemove={onRemove}
      onBypass={onBypass}
      isBypassed={bypass}
      dragHandleProps={dragHandleProps}
    >
      <div className="flex items-center justify-around gap-4">
        <Knob
          label="Time"
          unit="s"
          value={parameters.time}
          min={0}
          max={1}
          step={0.01}
          onChange={(v: number) => onUpdate('time', v)}
        />
        <Knob
          label="FB"
          value={parameters.feedback}
          min={0}
          max={0.9}
          step={0.01}
          onChange={(v: number) => onUpdate('feedback', v)}
        />
      </div>
    </ModuleShell>
  );
};
