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

export const ZigTransientShaperUnit: React.FC<ConnectedProps> = ({ module, onRemove, onBypass, onUpdate, dragHandleProps }) => {
    return (
        <ModuleShell
          title="Transient Shaper (Zig)"
          isBypassed={module.bypass}
          onBypass={onBypass}
          onRemove={onRemove}
          color="text-emerald-400"
          dragHandleProps={dragHandleProps}
        >
          <div className="flex flex-wrap gap-2 justify-center">
              <Knob label="Attack" value={module.parameters.attackGain} min={-24} max={24} unit="dB" onChange={(v) => onUpdate('attackGain', v)} />
              <Knob label="Sustain" value={module.parameters.sustainGain} min={-24} max={24} unit="dB" onChange={(v) => onUpdate('sustainGain', v)} />
              <Knob label="Mix" value={module.parameters.mix} min={0} max={1} onChange={(v) => onUpdate('mix', v)} />
          </div>
        </ModuleShell>
    );
};
