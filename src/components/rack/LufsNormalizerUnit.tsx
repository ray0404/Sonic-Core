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

export const LufsNormalizerUnit: React.FC<ConnectedProps> = ({ module, onRemove, onBypass, onUpdate, dragHandleProps }) => {
    return (
        <ModuleShell
          title="LUFS Normalizer"
          isBypassed={module.bypass}
          onBypass={onBypass}
          onRemove={onRemove}
          color="text-emerald-400"
          dragHandleProps={dragHandleProps}
        >
          <div className="flex flex-wrap gap-2 justify-center">
              <Knob 
                label="Target" 
                value={module.parameters.targetLufs} 
                min={-24} 
                max={-6} 
                unit="LUFS"
                onChange={(v) => onUpdate('targetLufs', v)} 
              />
          </div>
          <div className="mt-2 text-[9px] text-slate-500 font-mono text-center">
              INSTANT GAIN SNAP
          </div>
        </ModuleShell>
    );
};
