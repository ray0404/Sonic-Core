import React from 'react';
import { ModuleShell } from '../ui/ModuleShell';
import { Knob } from '../ui/Knob';
import { RackModule } from '@/store/useAudioStore';

interface PureProps {
  amount: number;
  tailMs: number;
  
  isBypassed: boolean;
  onBypass: () => void;
  onRemove: () => void;
  dragHandleProps?: any;

  onAmountChange: (v: number) => void;
  onTailMsChange: (v: number) => void;
}

export const PureEchoVanishUnit: React.FC<PureProps> = ({
  amount, tailMs,
  isBypassed, onBypass, onRemove, dragHandleProps,
  onAmountChange, onTailMsChange
}) => {
  return (
    <ModuleShell
      title="Echo Vanish"
      isBypassed={isBypassed}
      onBypass={onBypass}
      onRemove={onRemove}
      color="text-cyan-400"
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
          <Knob
              label="Tail"
              value={tailMs}
              min={10}
              max={2000}
              unit="ms"
              onChange={onTailMsChange}
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

export const EchoVanishUnit: React.FC<ConnectedProps> = ({ module, onRemove, onBypass, onUpdate, dragHandleProps }) => {
    return (
        <PureEchoVanishUnit
            amount={module.parameters.amount}
            tailMs={module.parameters.tailMs}
            
            isBypassed={module.bypass}
            onBypass={onBypass}
            onRemove={onRemove}
            dragHandleProps={dragHandleProps}

            onAmountChange={(v) => onUpdate('amount', v)}
            onTailMsChange={(v) => onUpdate('tailMs', v)}
        />
    );
};
