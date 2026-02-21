import React from 'react';
import { ModuleShell } from '../ui/ModuleShell';
import { Knob } from '../ui/Knob';
import { RackModule } from '@/store/useAudioStore';

interface PedalCompressorUnitProps {
  module: RackModule;
  onRemove: () => void;
  onBypass: () => void;
  onUpdate: (param: string, value: any) => void;
  dragHandleProps?: any;
}

export const PedalCompressorUnit: React.FC<PedalCompressorUnitProps> = ({
  module,
  onRemove,
  onBypass,
  onUpdate,
  dragHandleProps
}) => {
  const { parameters, bypass } = module;

  return (
    <ModuleShell
      title="Pedal: Comp"
      color="text-blue-400"
      onRemove={onRemove}
      onBypass={onBypass}
      isBypassed={bypass}
      dragHandleProps={dragHandleProps}
    >
      <div className="flex items-center justify-around gap-4">
        <Knob
          label="Thresh"
          unit="dB"
          value={parameters.threshold}
          min={-60}
          max={0}
          step={1}
          onChange={(v: number) => onUpdate('threshold', v)}
        />
        <Knob
          label="Ratio"
          value={parameters.ratio}
          min={1}
          max={20}
          step={0.1}
          onChange={(v: number) => onUpdate('ratio', v)}
        />
      </div>
    </ModuleShell>
  );
};
