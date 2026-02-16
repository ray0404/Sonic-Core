import React from 'react';
import { ModuleShell } from '../ui/ModuleShell';
import { Knob } from '../ui/Knob';
import { RackModule } from '@/store/useAudioStore';

interface PureProps {
  sensitivity: number;
  strength: number;
  cutoff: number;
  
  isBypassed: boolean;
  onBypass: () => void;
  onRemove: () => void;
  dragHandleProps?: any;

  onSensitivityChange: (v: number) => void;
  onStrengthChange: (v: number) => void;
  onCutoffChange: (v: number) => void;
}

export const PurePlosiveGuardUnit: React.FC<PureProps> = ({
  sensitivity, strength, cutoff,
  isBypassed, onBypass, onRemove, dragHandleProps,
  onSensitivityChange, onStrengthChange, onCutoffChange
}) => {
  return (
    <ModuleShell
      title="Plosive Guard"
      isBypassed={isBypassed}
      onBypass={onBypass}
      onRemove={onRemove}
      color="text-orange-400"
      dragHandleProps={dragHandleProps}
    >
      <div className="flex flex-wrap gap-2 justify-center">
          <Knob
              label="Sensitivity"
              value={sensitivity}
              min={0}
              max={1}
              onChange={onSensitivityChange}
          />
          <Knob
              label="Strength"
              value={strength}
              min={0}
              max={1}
              onChange={onStrengthChange}
          />
          <Knob
              label="Cutoff"
              value={cutoff}
              min={80}
              max={200}
              unit="Hz"
              onChange={onCutoffChange}
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

export const PlosiveGuardUnit: React.FC<ConnectedProps> = ({ module, onRemove, onBypass, onUpdate, dragHandleProps }) => {
    return (
        <PurePlosiveGuardUnit
            sensitivity={module.parameters.sensitivity}
            strength={module.parameters.strength}
            cutoff={module.parameters.cutoff}
            
            isBypassed={module.bypass}
            onBypass={onBypass}
            onRemove={onRemove}
            dragHandleProps={dragHandleProps}

            onSensitivityChange={(v) => onUpdate('sensitivity', v)}
            onStrengthChange={(v) => onUpdate('strength', v)}
            onCutoffChange={(v) => onUpdate('cutoff', v)}
        />
    );
};
