import React from 'react';
import { ModuleShell } from '../ui/ModuleShell';
import { Knob } from '../ui/Knob';
import { RackModule } from '@/store/useAudioStore';

interface PureProps {
  targetLufs: number;
  maxGainDb: number;
  gateThresholdDb: number;
  
  isBypassed: boolean;
  onBypass: () => void;
  onRemove: () => void;
  dragHandleProps?: any;

  onTargetLufsChange: (v: number) => void;
  onMaxGainDbChange: (v: number) => void;
  onGateThresholdDbChange: (v: number) => void;
}

export const PureSmartLevelUnit: React.FC<PureProps> = ({
  targetLufs, maxGainDb, gateThresholdDb,
  isBypassed, onBypass, onRemove, dragHandleProps,
  onTargetLufsChange, onMaxGainDbChange, onGateThresholdDbChange
}) => {
  return (
    <ModuleShell
      title="Smart Level"
      isBypassed={isBypassed}
      onBypass={onBypass}
      onRemove={onRemove}
      color="text-amber-400"
      dragHandleProps={dragHandleProps}
    >
      <div className="flex flex-wrap gap-2 justify-center">
          <Knob
              label="Target"
              value={targetLufs}
              min={-24}
              max={-6}
              unit="LUFS"
              onChange={onTargetLufsChange}
          />
          <Knob
              label="Max Gain"
              value={maxGainDb}
              min={0}
              max={24}
              unit="dB"
              onChange={onMaxGainDbChange}
          />
          <Knob
              label="Gate"
              value={gateThresholdDb}
              min={-100}
              max={-30}
              unit="dB"
              onChange={onGateThresholdDbChange}
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

export const SmartLevelUnit: React.FC<ConnectedProps> = ({ module, onRemove, onBypass, onUpdate, dragHandleProps }) => {
    return (
        <PureSmartLevelUnit
            targetLufs={module.parameters.targetLufs}
            maxGainDb={module.parameters.maxGainDb}
            gateThresholdDb={module.parameters.gateThresholdDb}
            
            isBypassed={module.bypass}
            onBypass={onBypass}
            onRemove={onRemove}
            dragHandleProps={dragHandleProps}

            onTargetLufsChange={(v) => onUpdate('targetLufs', v)}
            onMaxGainDbChange={(v) => onUpdate('maxGainDb', v)}
            onGateThresholdDbChange={(v) => onUpdate('gateThresholdDb', v)}
        />
    );
};
