import React from 'react';
import { ModuleShell } from '../ui/ModuleShell';
import { Knob } from '../ui/Knob';
import { RackModule } from '@/store/useAudioStore';

interface PureProps {
  sensitivity: number;
  threshold: number;
  
  isBypassed: boolean;
  onBypass: () => void;
  onRemove: () => void;
  dragHandleProps?: any;

  onSensitivityChange: (v: number) => void;
  onThresholdChange: (v: number) => void;
}

export const PureDeBleedUnit: React.FC<PureProps> = ({
  sensitivity, threshold,
  isBypassed, onBypass, onRemove, dragHandleProps,
  onSensitivityChange, onThresholdChange
}) => {
  return (
    <ModuleShell
      title="De-Bleed"
      isBypassed={isBypassed}
      onBypass={onBypass}
      onRemove={onRemove}
      color="text-teal-400"
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
              label="Threshold"
              value={threshold}
              min={-100}
              max={0}
              unit="dB"
              onChange={onThresholdChange}
          />
      </div>
      <div className="mt-2 text-[9px] text-slate-500 font-mono text-center">
          REQUIRES SIDECHAIN INPUT
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

export const DeBleedUnit: React.FC<ConnectedProps> = ({ module, onRemove, onBypass, onUpdate, dragHandleProps }) => {
    return (
        <PureDeBleedUnit
            sensitivity={module.parameters.sensitivity}
            threshold={module.parameters.threshold}
            
            isBypassed={module.bypass}
            onBypass={onBypass}
            onRemove={onRemove}
            dragHandleProps={dragHandleProps}

            onSensitivityChange={(v) => onUpdate('sensitivity', v)}
            onThresholdChange={(v) => onUpdate('threshold', v)}
        />
    );
};
