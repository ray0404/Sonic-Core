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

export const ZigLimiterUnit: React.FC<ConnectedProps> = ({ module, onRemove, onBypass, onUpdate, dragHandleProps }) => {
    return (
        <ModuleShell
          title="Limiter (Zig)"
          isBypassed={module.bypass}
          onBypass={onBypass}
          onRemove={onRemove}
          color="text-red-500"
          dragHandleProps={dragHandleProps}
        >
          <div className="flex flex-wrap gap-2 justify-center">
              <Knob
                  label="Thresh"
                  value={module.parameters.threshold}
                  min={-60}
                  max={0}
                  unit="dB"
                  onChange={(v) => onUpdate('threshold', v)}
              />
              <Knob
                  label="Rel"
                  value={module.parameters.release}
                  min={0.001}
                  max={2}
                  unit="s"
                  onChange={(v) => onUpdate('release', v)}
              />
          </div>
        </ModuleShell>
    );
};
