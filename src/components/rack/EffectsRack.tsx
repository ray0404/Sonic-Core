import React from 'react';
import { useAudioStore } from '@/store/useAudioStore';
import { useShallow } from 'zustand/react/shallow';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { DynamicEQUnit } from './DynamicEQUnit';
import { LimiterUnit } from './LimiterUnit';
import { MidSideEQUnit } from './MidSideEQUnit';
import { CabSimUnit } from './CabSimUnit';
import { MeteringUnit } from './MeteringUnit';
import { TransientShaperUnit } from './TransientShaperUnit';
import { SaturationUnit } from './SaturationUnit';
import { DitheringUnit } from './DitheringUnit';
import { ParametricEQUnit } from './ParametricEQUnit';
import { DistortionUnit } from './DistortionUnit';
import { BitCrusherUnit } from './BitCrusherUnit';
import { ChorusUnit } from './ChorusUnit';
import { PhaserUnit } from './PhaserUnit';
import { TremoloUnit } from './TremoloUnit';
import { AutoWahUnit } from './AutoWahUnit';
import { FeedbackDelayUnit } from './FeedbackDelayUnit';
import { CompressorUnit } from './CompressorUnit';
import { DeEsserUnit } from './DeEsserUnit';
import { StereoImagerUnit } from './StereoImagerUnit';
import { MultibandCompressorUnit } from './MultibandCompressorUnit';
import { SmartLevelUnit } from './SmartLevelUnit';
import { TapeStabilizerUnit } from './TapeStabilizerUnit';
import { VoiceIsolateUnit } from './VoiceIsolateUnit';
import { EchoVanishUnit } from './EchoVanishUnit';
import { PlosiveGuardUnit } from './PlosiveGuardUnit';
import { PsychoDynamicEQUnit } from './PsychoDynamicEQUnit';
import { DeBleedUnit } from './DeBleedUnit';
import { SpectralDenoiseUnit } from './SpectralDenoiseUnit';
import { DeClipUnit } from './DeClipUnit';
import { PhaseRotationUnit } from './PhaseRotationUnit';
import { MonoBassUnit } from './MonoBassUnit';
import { ZigSaturationUnit } from './ZigSaturationUnit';
import { ZigCompressorUnit } from './ZigCompressorUnit';
import { ZigLimiterUnit } from './ZigLimiterUnit';
import { ZigDeEsserUnit } from './ZigDeEsserUnit';
import { ZigTransientShaperUnit } from './ZigTransientShaperUnit';
import { SpectralMatchUnit } from './SpectralMatchUnit';
import { LufsNormalizerUnit } from './LufsNormalizerUnit';
import { GuitarRigUnit } from './GuitarRigUnit';
import { DrumMachineUnit } from './DrumMachineUnit';
import { TabPlayerUnit } from './TabPlayerUnit';
import { MetronomeUnit } from './MetronomeUnit';
import { TunerUnit } from './TunerUnit';


function SortableItem({ id, children }: { id: string, children: (dragHandleProps: any) => React.ReactNode }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 100 : 1,
        position: 'relative' as 'relative',
    };

    return (
        <div ref={setNodeRef} style={style} className="w-full">
            {children({ ...attributes, ...listeners })}
        </div>
    );
}

export const EffectsRack: React.FC = () => {
  const { activeTrackId, tracks, master, removeModule, updateModuleParam, toggleModuleBypass, reorderRack } = useAudioStore(
    useShallow((state) => ({
      activeTrackId: state.activeTrackId,
      tracks: state.tracks,
      master: state.master,
      removeModule: state.removeModule,
      updateModuleParam: state.updateModuleParam,
      toggleModuleBypass: state.toggleModuleBypass,
      reorderRack: state.reorderRack
    }))
  );

  const activeTrack = activeTrackId === 'MASTER' ? master : tracks[activeTrackId];
  const rack = activeTrack?.rack || [];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
        const oldIndex = rack.findIndex((item) => item.id === active.id);
        const newIndex = rack.findIndex((item) => item.id === over?.id);
        reorderRack(activeTrackId, oldIndex, newIndex);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
        <div className="w-full flex flex-col gap-4 pb-32">
             {rack.length === 0 ? (
                 <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl py-20 text-slate-600 bg-slate-900/20">
                     <p className="font-bold">Rack is empty</p>
                     <p className="text-xs mt-2">Use the "Add Module" button to add effects.</p>
                 </div>
             ) : (
                 <SortableContext
                    items={rack.map(m => m.id)}
                    strategy={verticalListSortingStrategy}
                 >
                    {rack.map((module) => (
                        <SortableItem key={module.id} id={module.id}>
                            {(dragHandleProps) => {
                                const commonProps = {
                                    module,
                                    onRemove: () => removeModule(activeTrackId, module.id),
                                    onBypass: () => toggleModuleBypass(activeTrackId, module.id),
                                    dragHandleProps
                                };
                                const onUpdate = (p: string, v: any) => updateModuleParam(activeTrackId, module.id, p, v);

                                switch (module.type) {
                                    case 'DYNAMIC_EQ': return <DynamicEQUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'LIMITER': return <LimiterUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'MIDSIDE_EQ': return <MidSideEQUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'CAB_SIM': return <CabSimUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'TRANSIENT_SHAPER': return <TransientShaperUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'SATURATION': return <SaturationUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'DITHERING': return <DitheringUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'LOUDNESS_METER': return <MeteringUnit {...commonProps} />;
                                    case 'PARAMETRIC_EQ': return <ParametricEQUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'DISTORTION': return <DistortionUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'BITCRUSHER': return <BitCrusherUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'CHORUS': return <ChorusUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'PHASER': return <PhaserUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'TREMOLO': return <TremoloUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'AUTOWAH': return <AutoWahUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'FEEDBACK_DELAY': return <FeedbackDelayUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'COMPRESSOR': return <CompressorUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'DE_ESSER': return <DeEsserUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'STEREO_IMAGER': return <StereoImagerUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'MULTIBAND_COMPRESSOR': return <MultibandCompressorUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'SMART_LEVEL': return <SmartLevelUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'TAPE_STABILIZER': return <TapeStabilizerUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'VOICE_ISOLATE': return <VoiceIsolateUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'ECHO_VANISH': return <EchoVanishUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'PLOSIVE_GUARD': return <PlosiveGuardUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'PSYCHO_DYNAMIC_EQ': return <PsychoDynamicEQUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'DE_BLEED': return <DeBleedUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'SPECTRAL_DENOISE': return <SpectralDenoiseUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'DE_CLIP': return <DeClipUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'PHASE_ROTATION': return <PhaseRotationUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'MONO_BASS': return <MonoBassUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'ZIG_SATURATION': return <ZigSaturationUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'ZIG_COMPRESSOR': return <ZigCompressorUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'ZIG_LIMITER': return <ZigLimiterUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'ZIG_DE_ESSER': return <ZigDeEsserUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'ZIG_TRANSIENT_SHAPER': return <ZigTransientShaperUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'SPECTRAL_MATCH': return <SpectralMatchUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'LUFS_NORMALIZER': return <LufsNormalizerUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'GUITAR_RIG': return <GuitarRigUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'DRUM_MACHINE': return <DrumMachineUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'TAB_PLAYER': return <TabPlayerUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'METRONOME': return <MetronomeUnit {...commonProps} onUpdate={onUpdate} />;
                                    case 'TUNER': return <TunerUnit {...commonProps} onUpdate={onUpdate} />;
                                    default:
                                        return <div className="p-4 bg-red-900/50 text-red-200 rounded">Unknown Module: {module.type}</div>;
                                }
                            }}
                        </SortableItem>
                    ))}
                 </SortableContext>
             )}
        </div>
    </DndContext>
  );
};
