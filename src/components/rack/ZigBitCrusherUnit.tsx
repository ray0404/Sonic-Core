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

export const ZigBitCrusherUnit: React.FC<ConnectedProps> = ({ module, onRemove, onBypass, onUpdate, dragHandleProps }) => {
    return (
        <ModuleShell
          title="BitCrusher (Zig)"
          isBypassed={module.bypass}
          onBypass={onBypass}
          onRemove={onRemove}
          color="text-yellow-500"
          dragHandleProps={dragHandleProps}
        >
          <div className="flex flex-wrap gap-2 justify-center">
              <Knob label="Bits" value={module.parameters.bits} min={1} max={16} onChange={(v) => onUpdate('bits', v)} />
              <Knob label="Resample" value={module.parameters.normFreq} min={0.01} max={1} onChange={(v) => onUpdate('normFreq', v)} />
              <Knob label="Mix" value={module.parameters.mix} min={0} max={1} onChange={(v) => onUpdate('mix', v)} />
          </div>
        </ModuleShell>
    );
};
