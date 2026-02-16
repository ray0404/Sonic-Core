import React from 'react';
import { ModuleShell } from '../ui/ModuleShell';
import { Knob } from '../ui/Knob';
import { RackModule } from '@/store/useAudioStore';
import { clsx } from 'clsx';

interface PureProps {
  drive: number;
  type: number;
  outputGain: number;
  mix: number;
  
  isBypassed: boolean;
  onBypass: () => void;
  onRemove: () => void;
  dragHandleProps?: any;

  onDriveChange: (v: number) => void;
  onTypeChange: (v: number) => void;
  onOutputGainChange: (v: number) => void;
  onMixChange: (v: number) => void;
}

export const PureZigSaturationUnit: React.FC<PureProps> = ({
  drive, type, outputGain, mix,
  isBypassed, onBypass, onRemove, dragHandleProps,
  onDriveChange, onTypeChange, onOutputGainChange, onMixChange
}) => {
  const types = ['Tape', 'Tube', 'Fuzz'];

  return (
    <ModuleShell
      title="Saturation (Zig)"
      isBypassed={isBypassed}
      onBypass={onBypass}
      onRemove={onRemove}
      color="text-orange-500"
      dragHandleProps={dragHandleProps}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 justify-center">
            <Knob label="Drive" value={drive} min={0} max={1} onChange={onDriveChange} />
            <Knob label="Output" value={outputGain} min={-24} max={24} unit="dB" onChange={onOutputGainChange} />
            <Knob label="Mix" value={mix} min={0} max={1} onChange={onMixChange} />
        </div>

        <div className="flex flex-col items-center gap-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Circuit</span>
            <div className="flex bg-slate-950/50 rounded p-0.5 border border-slate-800">
                {types.map((label, idx) => (
                    <button
                        key={label}
                        onClick={() => onTypeChange(idx)}
                        className={clsx(
                            "px-2 py-1 text-[9px] font-bold rounded transition-all",
                            type === idx ? "bg-orange-500 text-slate-950 shadow-glow" : "text-slate-500 hover:text-slate-300"
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>
        </div>
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

export const ZigSaturationUnit: React.FC<ConnectedProps> = ({ module, onRemove, onBypass, onUpdate, dragHandleProps }) => {
    return (
        <PureZigSaturationUnit
            drive={module.parameters.drive}
            type={module.parameters.type}
            outputGain={module.parameters.outputGain}
            mix={module.parameters.mix}
            
            isBypassed={module.bypass}
            onBypass={onBypass}
            onRemove={onRemove}
            dragHandleProps={dragHandleProps}

            onDriveChange={(v) => onUpdate('drive', v)}
            onTypeChange={(v) => onUpdate('type', v)}
            onOutputGainChange={(v) => onUpdate('outputGain', v)}
            onMixChange={(v) => onUpdate('mix', v)}
        />
    );
};
