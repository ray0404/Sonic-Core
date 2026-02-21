import React from 'react';
import { ModuleShell } from '../ui/ModuleShell';
import { Knob } from '../ui/Knob';
import { RackModule } from '@/store/useAudioStore';

interface GuitarRigUnitProps {
  module: RackModule;
  onRemove: () => void;
  onBypass: () => void;
  onUpdate: (param: string, value: any) => void;
  dragHandleProps?: any;
}

export const GuitarRigUnit: React.FC<GuitarRigUnitProps> = ({
  module,
  onRemove,
  onBypass,
  onUpdate,
  dragHandleProps
}) => {
  const { parameters, bypass } = module;

  return (
    <ModuleShell
      title="Guitar Rig"
      color="text-yellow-500"
      onRemove={onRemove}
      onBypass={onBypass}
      isBypassed={bypass}
      dragHandleProps={dragHandleProps}
    >
      <div className="flex flex-col gap-4">
          <div className="flex items-center justify-around gap-4">
            <Knob label="Gain" value={parameters.gain} min={0} max={3} step={0.1} onChange={(v) => onUpdate('gain', v)} />
            <Knob label="Dist" value={parameters.distortion} min={0} max={100} step={1} onChange={(v) => onUpdate('distortion', v)} />
            <Knob label="Low" value={parameters.eqLow} min={-20} max={20} step={1} onChange={(v) => onUpdate('eqLow', v)} />
            <Knob label="Mid" value={parameters.eqMid} min={-20} max={20} step={1} onChange={(v) => onUpdate('eqMid', v)} />
            <Knob label="High" value={parameters.eqHigh} min={-20} max={20} step={1} onChange={(v) => onUpdate('eqHigh', v)} />
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center p-2 bg-slate-950/50 rounded-lg">
              {['Compressor', 'Overdrive', 'Chorus', 'Delay', 'Reverb'].map(eff => {
                  const key = `enable${eff}`;
                  const active = parameters[key];
                  return (
                      <button
                        key={eff}
                        onClick={() => onUpdate(key, !active)}
                        className={`px-3 py-1 text-[10px] uppercase font-bold rounded transition-all ${active ? 'bg-yellow-600 text-white' : 'bg-slate-800 text-slate-500'}`}
                      >
                          {eff}
                      </button>
                  )
              })}
          </div>
      </div>
    </ModuleShell>
  );
};
