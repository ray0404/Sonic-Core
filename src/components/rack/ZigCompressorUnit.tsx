import React from 'react';
import { ModuleShell } from '../ui/ModuleShell';
import { Knob } from '../ui/Knob';
import { RackModule } from '@/store/useAudioStore';
import { clsx } from 'clsx';

interface PureProps {
  threshold: number;
  ratio: number;
  attack: number;
  release: number;
  makeup: number;
  mix: number;
  mode: number;
  
  isBypassed: boolean;
  onBypass: () => void;
  onRemove: () => void;
  dragHandleProps?: any;

  onThresholdChange: (v: number) => void;
  onRatioChange: (v: number) => void;
  onAttackChange: (v: number) => void;
  onReleaseChange: (v: number) => void;
  onMakeupChange: (v: number) => void;
  onMixChange: (v: number) => void;
  onModeChange: (v: number) => void;
}

export const PureZigCompressorUnit: React.FC<PureProps> = ({
  threshold, ratio, attack, release, makeup, mix, mode,
  isBypassed, onBypass, onRemove, dragHandleProps,
  onThresholdChange, onRatioChange, onAttackChange, onReleaseChange, onMakeupChange, onMixChange, onModeChange
}) => {
  const modes = ['VCA', 'FET', 'Opto', 'VarMu'];

  return (
    <ModuleShell
      title="Compressor (Zig)"
      isBypassed={isBypassed}
      onBypass={onBypass}
      onRemove={onRemove}
      color="text-emerald-500"
      dragHandleProps={dragHandleProps}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2 justify-center">
            <Knob label="Thresh" value={threshold} min={-60} max={0} unit="dB" onChange={onThresholdChange} />
            <Knob label="Ratio" value={ratio} min={1} max={20} onChange={onRatioChange} />
            <Knob label="Att" value={attack} min={0.0001} max={1} unit="s" onChange={onAttackChange} />
            <Knob label="Rel" value={release} min={0.001} max={2} unit="s" onChange={onReleaseChange} />
            <Knob label="Makeup" value={makeup} min={0} max={24} unit="dB" onChange={onMakeupChange} />
            <Knob label="Mix" value={mix} min={0} max={1} onChange={onMixChange} />
        </div>

        <div className="flex flex-col items-center gap-1">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Topology</span>
            <div className="flex bg-slate-950/50 rounded p-0.5 border border-slate-800">
                {modes.map((label, idx) => (
                    <button
                        key={label}
                        onClick={() => onModeChange(idx)}
                        className={clsx(
                            "px-2 py-1 text-[9px] font-bold rounded transition-all",
                            mode === idx ? "bg-emerald-500 text-slate-950 shadow-glow" : "text-slate-500 hover:text-slate-300"
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

export const ZigCompressorUnit: React.FC<ConnectedProps> = ({ module, onRemove, onBypass, onUpdate, dragHandleProps }) => {
    return (
        <PureZigCompressorUnit
            threshold={module.parameters.threshold}
            ratio={module.parameters.ratio}
            attack={module.parameters.attack}
            release={module.parameters.release}
            makeup={module.parameters.makeup}
            mix={module.parameters.mix}
            mode={module.parameters.mode}
            
            isBypassed={module.bypass}
            onBypass={onBypass}
            onRemove={onRemove}
            dragHandleProps={dragHandleProps}

            onThresholdChange={(v) => onUpdate('threshold', v)}
            onRatioChange={(v) => onUpdate('ratio', v)}
            onAttackChange={(v) => onUpdate('attack', v)}
            onReleaseChange={(v) => onUpdate('release', v)}
            onMakeupChange={(v) => onUpdate('makeup', v)}
            onMixChange={(v) => onUpdate('mix', v)}
            onModeChange={(v) => onUpdate('mode', v)}
        />
    );
};
