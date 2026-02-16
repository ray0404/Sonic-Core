import React from 'react';
import { ModuleShell } from '../ui/ModuleShell';
import { Knob } from '../ui/Knob';
import { RackModule } from '@/store/useAudioStore';

interface PureProps {
  intensity: number;
  refDb: number;
  
  isBypassed: boolean;
  onBypass: () => void;
  onRemove: () => void;
  dragHandleProps?: any;

  onIntensityChange: (v: number) => void;
  onRefDbChange: (v: number) => void;
}

export const PurePsychoDynamicEQUnit: React.FC<PureProps> = ({
  intensity, refDb,
  isBypassed, onBypass, onRemove, dragHandleProps,
  onIntensityChange, onRefDbChange
}) => {
  return (
    <ModuleShell
      title="PsychoDynamic EQ"
      isBypassed={isBypassed}
      onBypass={onBypass}
      onRemove={onRemove}
      color="text-fuchsia-400"
      dragHandleProps={dragHandleProps}
    >
      <div className="flex flex-wrap gap-2 justify-center">
          <Knob
              label="Intensity"
              value={intensity}
              min={0}
              max={1}
              onChange={onIntensityChange}
          />
          <Knob
              label="Ref Level"
              value={refDb}
              min={-60}
              max={0}
              unit="dB"
              onChange={onRefDbChange}
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

export const PsychoDynamicEQUnit: React.FC<ConnectedProps> = ({ module, onRemove, onBypass, onUpdate, dragHandleProps }) => {
    return (
        <PurePsychoDynamicEQUnit
            intensity={module.parameters.intensity}
            refDb={module.parameters.refDb}
            
            isBypassed={module.bypass}
            onBypass={onBypass}
            onRemove={onRemove}
            dragHandleProps={dragHandleProps}

            onIntensityChange={(v) => onUpdate('intensity', v)}
            onRefDbChange={(v) => onUpdate('refDb', v)}
        />
    );
};
