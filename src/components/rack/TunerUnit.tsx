import React from 'react';
import { ModuleShell } from '../ui/ModuleShell';
import { RackModule } from '@/store/useAudioStore';

interface TunerUnitProps {
  module: RackModule;
  onRemove: () => void;
  onBypass: () => void;
  onUpdate: (param: string, value: any) => void;
  dragHandleProps?: any;
}

export const TunerUnit: React.FC<TunerUnitProps> = ({
  module,
  onRemove,
  onBypass,
  onUpdate,
  dragHandleProps
}) => {
  const { parameters, bypass } = module;

  return (
    <ModuleShell
      title="Tuner"
      color="text-emerald-400"
      onRemove={onRemove}
      onBypass={onBypass}
      isBypassed={bypass}
      dragHandleProps={dragHandleProps}
    >
      <div className="flex items-center justify-center gap-4">
        <div className="w-full h-12 bg-slate-950 rounded border border-slate-800 flex items-center justify-center">
            {parameters.enabled ? (
                <span className="text-xl font-bold text-emerald-400">A4</span> // Placeholder
            ) : (
                <span className="text-xs text-slate-600">OFF</span>
            )}
        </div>
        <button
            onClick={() => onUpdate('enabled', !parameters.enabled)}
            className={`px-4 py-2 rounded font-bold transition-all ${parameters.enabled ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'}`}
        >
            {parameters.enabled ? 'ON' : 'OFF'}
        </button>
      </div>
    </ModuleShell>
  );
};
