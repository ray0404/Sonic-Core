import React from 'react';
import { ModuleShell } from '../ui/ModuleShell';
import { Knob } from '../ui/Knob';
import { RackModule } from '@/store/useAudioStore';

interface PureProps {
  threshold: number;
  
  isBypassed: boolean;
  onBypass: () => void;
  onRemove: () => void;
  dragHandleProps?: any;

  onThresholdChange: (v: number) => void;
}

export const PureDeClipUnit: React.FC<PureProps> = ({
  threshold,
  isBypassed, onBypass, onRemove, dragHandleProps,
  onThresholdChange
}) => {
  return (
    <ModuleShell
      title="De-Clip"
      isBypassed={isBypassed}
      onBypass={onBypass}
      onRemove={onRemove}
      color="text-red-400"
      dragHandleProps={dragHandleProps}
    >
      <div className="flex flex-wrap gap-2 justify-center">
          <Knob
              label="Thresh"
              value={threshold}
              min={0.1}
              max={1.0}
              onChange={onThresholdChange}
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

export const DeClipUnit: React.FC<ConnectedProps> = ({ module, onRemove, onBypass, onUpdate, dragHandleProps }) => {
    return (
        <PureDeClipUnit
            threshold={module.parameters.threshold}
            
            isBypassed={module.bypass}
            onBypass={onBypass}
            onRemove={onRemove}
            dragHandleProps={dragHandleProps}

            onThresholdChange={(v) => onUpdate('threshold', v)}
        />
    );
};
