import React from 'react';
import { ModuleShell } from '../ui/ModuleShell';
import { Knob } from '../ui/Knob';
import { RackModule } from '@/store/useAudioStore';

interface PureProps {
  frequency: number;
  
  isBypassed: boolean;
  onBypass: () => void;
  onRemove: () => void;
  dragHandleProps?: any;

  onFrequencyChange: (v: number) => void;
}

export const PureMonoBassUnit: React.FC<PureProps> = ({
  frequency,
  isBypassed, onBypass, onRemove, dragHandleProps,
  onFrequencyChange
}) => {
  return (
    <ModuleShell
      title="Mono Bass"
      isBypassed={isBypassed}
      onBypass={onBypass}
      onRemove={onRemove}
      color="text-sky-400"
      dragHandleProps={dragHandleProps}
    >
      <div className="flex flex-wrap gap-2 justify-center">
          <Knob
              label="Cutoff"
              value={frequency}
              min={20}
              max={500}
              unit="Hz"
              onChange={onFrequencyChange}
          />
      </div>
    </ModuleShell>
  );
};

interface ConnectedProps {
  module: RackModule;
  onRemove: () => void;
  onBypass: () => void;
  onUpdate: (param: string, value: any) => void;
  dragHandleProps?: any;
}

export const MonoBassUnit: React.FC<ConnectedProps> = ({ module, onRemove, onBypass, onUpdate, dragHandleProps }) => {
    return (
        <PureMonoBassUnit
            frequency={module.parameters.frequency}
            
            isBypassed={module.bypass}
            onBypass={onBypass}
            onRemove={onRemove}
            dragHandleProps={dragHandleProps}

            onFrequencyChange={(v) => onUpdate('frequency', v)}
        />
    );
};
