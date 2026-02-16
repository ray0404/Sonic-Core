import React from 'react';
import { ModuleShell } from '../ui/ModuleShell';
import { Knob } from '../ui/Knob';
import { RackModule } from '@/store/useAudioStore';

interface PureProps {
  nominalFreq: number;
  scanMin: number;
  scanMax: number;
  amount: number;
  
  isBypassed: boolean;
  onBypass: () => void;
  onRemove: () => void;
  dragHandleProps?: any;

  onNominalFreqChange: (v: number) => void;
  onScanMinChange: (v: number) => void;
  onScanMaxChange: (v: number) => void;
  onAmountChange: (v: number) => void;
}

export const PureTapeStabilizerUnit: React.FC<PureProps> = ({
  nominalFreq, scanMin, scanMax, amount,
  isBypassed, onBypass, onRemove, dragHandleProps,
  onNominalFreqChange, onScanMinChange, onScanMaxChange, onAmountChange
}) => {
  return (
    <ModuleShell
      title="Tape Stabilizer"
      isBypassed={isBypassed}
      onBypass={onBypass}
      onRemove={onRemove}
      color="text-rose-400"
      dragHandleProps={dragHandleProps}
    >
      <div className="flex flex-wrap gap-2 justify-center">
          <Knob
              label="Tone"
              value={nominalFreq}
              min={1000}
              max={5000}
              unit="Hz"
              onChange={onNominalFreqChange}
          />
          <Knob
              label="Scan Min"
              value={scanMin}
              min={1000}
              max={5000}
              unit="Hz"
              onChange={onScanMinChange}
          />
          <Knob
              label="Scan Max"
              value={scanMax}
              min={1000}
              max={5000}
              unit="Hz"
              onChange={onScanMaxChange}
          />
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

export const TapeStabilizerUnit: React.FC<ConnectedProps> = ({ module, onRemove, onBypass, onUpdate, dragHandleProps }) => {
    return (
        <PureTapeStabilizerUnit
            nominalFreq={module.parameters.nominalFreq}
            scanMin={module.parameters.scanMin}
            scanMax={module.parameters.scanMax}
            amount={module.parameters.amount}
            
            isBypassed={module.bypass}
            onBypass={onBypass}
            onRemove={onRemove}
            dragHandleProps={dragHandleProps}

            onNominalFreqChange={(v) => onUpdate('nominalFreq', v)}
            onScanMinChange={(v) => onUpdate('scanMin', v)}
            onScanMaxChange={(v) => onUpdate('scanMax', v)}
            onAmountChange={(v) => onUpdate('amount', v)}
        />
    );
};
