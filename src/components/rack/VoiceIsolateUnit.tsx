import React from 'react';
import { ModuleShell } from '../ui/ModuleShell';
import { Knob } from '../ui/Knob';
import { RackModule } from '@/store/useAudioStore';

interface PureProps {
  amount: number;
  
  isBypassed: boolean;
  onBypass: () => void;
  onRemove: () => void;
  dragHandleProps?: any;

  onAmountChange: (v: number) => void;
}

export const PureVoiceIsolateUnit: React.FC<PureProps> = ({
  amount,
  isBypassed, onBypass, onRemove, dragHandleProps,
  onAmountChange
}) => {
  return (
    <ModuleShell
      title="Voice Isolate"
      isBypassed={isBypassed}
      onBypass={onBypass}
      onRemove={onRemove}
      color="text-indigo-400"
      dragHandleProps={dragHandleProps}
    >
      <div className="flex flex-wrap gap-2 justify-center">
          <Knob
              label="Amount"
              value={amount}
              min={0}
              max={1}
              onChange={onAmountChange}
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

export const VoiceIsolateUnit: React.FC<ConnectedProps> = ({ module, onRemove, onBypass, onUpdate, dragHandleProps }) => {
    return (
        <PureVoiceIsolateUnit
            amount={module.parameters.amount}
            
            isBypassed={module.bypass}
            onBypass={onBypass}
            onRemove={onRemove}
            dragHandleProps={dragHandleProps}

            onAmountChange={(v) => onUpdate('amount', v)}
        />
    );
};
