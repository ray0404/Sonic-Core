import React, { useState } from 'react';
import { ModuleShell } from '../ui/ModuleShell';
import { Knob } from '../ui/Knob';
import { RackModule } from '@/store/useAudioStore';
import { Disc, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';

interface ConnectedProps {
  module: RackModule;
  onRemove: () => void;
  onBypass: () => void;
  onUpdate: (param: string, value: any) => void;
  dragHandleProps?: any;
}

export const SpectralMatchUnit: React.FC<ConnectedProps> = ({ module, onRemove, onBypass, onUpdate, dragHandleProps }) => {
    const [isLearning, setIsLearning] = useState(false);
    const [hasReference, setHasReference] = useState(module.parameters.hasReference || false);

    const toggleLearn = () => {
        const next = !isLearning;
        setIsLearning(next);
        onUpdate('isLearning', next ? 1 : 0);
        
        if (!next) {
            setHasReference(true);
            onUpdate('hasReference', true);
        }
    };

    return (
        <ModuleShell
          title="Spectral Match"
          isBypassed={module.bypass}
          onBypass={onBypass}
          onRemove={onRemove}
          color="text-sky-400"
          dragHandleProps={dragHandleProps}
        >
          <div className="flex flex-col gap-4">
              <div className="flex justify-center gap-4 items-center">
                  <button
                    onClick={toggleLearn}
                    className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all border",
                        isLearning 
                            ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse" 
                            : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                    )}
                  >
                      <Disc size={14} className={isLearning ? "animate-spin" : ""} />
                      {isLearning ? "Learning..." : "Learn Reference"}
                  </button>

                  <div className="flex flex-col items-center">
                      <div className={clsx(
                          "w-3 h-3 rounded-full mb-1 shadow-sm transition-colors",
                          hasReference ? "bg-green-500 shadow-green-500/50" : "bg-slate-700"
                      )} />
                      <span className="text-[8px] font-bold text-slate-500 uppercase">Status</span>
                  </div>
              </div>

              <div className="flex justify-center">
                  <Knob 
                    label="Amount" 
                    value={module.parameters.amount} 
                    min={0} 
                    max={1} 
                    onChange={(v) => onUpdate('amount', v)} 
                  />
              </div>

              {hasReference && !isLearning && (
                  <div className="flex items-center justify-center gap-1 text-[9px] text-green-500/70 font-mono italic">
                      <CheckCircle2 size={10} />
                      <span>Reference Captured</span>
                  </div>
              )}
          </div>
        </ModuleShell>
    );
};
