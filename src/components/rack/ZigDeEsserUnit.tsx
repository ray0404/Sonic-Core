import React from 'react';
import { ModuleShell } from '../ui/ModuleShell';
import { Knob } from '../ui/Knob';
import { RackModule } from '@/store/useAudioStore';

interface ConnectedProps {
  module: RackModule;
  onRemove: () => void;
  onBypass: () => void;
  onUpdate: (param: string, value: any) => void;
  dragHandleProps?: any;
}

export const ZigDeEsserUnit: React.FC<ConnectedProps> = ({ module, onRemove, onBypass, onUpdate, dragHandleProps }) => {
    return (
        <ModuleShell
          title="De-Esser (Zig)"
          isBypassed={module.bypass}
          onBypass={onBypass}
          onRemove={onRemove}
          color="text-emerald-400"
          dragHandleProps={dragHandleProps}
        >
          <div className="flex flex-wrap gap-2 justify-center">
              <Knob label="Freq" value={module.parameters.frequency} min={2000} max={10000} unit="Hz" onChange={(v) => onUpdate('frequency', v)} />
              <Knob label="Thresh" value={module.parameters.threshold} min={-60} max={0} unit="dB" onChange={(v) => onUpdate('threshold', v)} />
              <Knob label="Ratio" value={module.parameters.ratio} min={1} max={20} onChange={(v) => onUpdate('ratio', v)} />
              <Knob label="Att" value={module.parameters.attack} min={0.001} max={0.1} unit="s" onChange={(v) => onUpdate('attack', v)} />
              <Knob label="Rel" value={module.parameters.release} min={0.01} max={0.5} unit="s" onChange={(v) => onUpdate('release', v)} />
          </div>
        </ModuleShell>
    );
};
