import React from 'react';
import { ModuleShell } from '../ui/ModuleShell';
import { RackModule } from '@/store/useAudioStore';

interface ConnectedProps {
  module: RackModule;
  onRemove: () => void;
  onBypass: () => void;
  onUpdate: (param: string, value: any) => void;
  dragHandleProps?: any;
}

export const SpectralDenoiseUnit: React.FC<ConnectedProps> = ({ module, onRemove, onBypass, dragHandleProps }) => {
    return (
        <ModuleShell
          title="Spectral Denoise"
          isBypassed={module.bypass}
          onBypass={onBypass}
          onRemove={onRemove}
          color="text-slate-400"
          dragHandleProps={dragHandleProps}
        >
          <div className="flex flex-col items-center justify-center py-2 text-center">
              <span className="text-[10px] text-slate-400 font-medium">Adaptive noise reduction</span>
              <span className="text-[9px] text-slate-500 mt-1 uppercase tracking-tighter italic">Auto-learning active</span>
          </div>
        </ModuleShell>
    );
};
