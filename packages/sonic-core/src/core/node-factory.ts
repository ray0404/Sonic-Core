import { IAudioContext, IOfflineAudioContext, IAudioNode } from "standardized-audio-context";
import type { RackModule } from "../types.ts";
import { logger } from "../utils/logger.ts";

import { DynamicEQNode } from "../worklets/DynamicEQNode.ts";
import { TransientShaperNode } from "../worklets/TransientShaperNode.ts";
import { LimiterNode } from "../worklets/LimiterNode.ts";
import { MidSideEQNode } from "../worklets/MidSideEQNode.ts";
import { MeteringNode } from "../worklets/MeteringNode.ts";
import { ConvolutionNode } from "../worklets/ConvolutionNode.ts";
import { SaturationNode } from "../worklets/SaturationNode.ts";
import { DitheringNode } from "../worklets/DitheringNode.ts";
import { ParametricEQNode } from "../worklets/ParametricEQNode.ts";
import { DistortionNode } from "../worklets/DistortionNode.ts";
import { BitCrusherNode } from "../worklets/BitCrusherNode.ts";
import { ChorusNode } from "../worklets/ChorusNode.ts";
import { PhaserNode } from "../worklets/PhaserNode.ts";
import { TremoloNode } from "../worklets/TremoloNode.ts";
import { AutoWahNode } from "../worklets/AutoWahNode.ts";
import { FeedbackDelayNode } from "../worklets/FeedbackDelayNode.ts";
import { CompressorNode } from "../worklets/CompressorNode.ts";
import { DeEsserNode } from "../worklets/DeEsserNode.ts";
import { StereoImagerNode } from "../worklets/StereoImagerNode.ts";
import { MultibandCompressorNode } from "../worklets/MultibandCompressorNode.ts";
import { SmartLevelNode } from "../worklets/SmartLevelNode.ts";
import { TapeStabilizerNode } from "../worklets/TapeStabilizerNode.ts";
import { VoiceIsolateNode } from "../worklets/VoiceIsolateNode.ts";
import { EchoVanishNode } from "../worklets/EchoVanishNode.ts";
import { PlosiveGuardNode } from "../worklets/PlosiveGuardNode.ts";
import { PsychoDynamicEQNode } from "../worklets/PsychoDynamicEQNode.ts";
import { DeBleedNode } from "../worklets/DeBleedNode.ts";
import { SpectralDenoiseNode } from "../worklets/SpectralDenoiseNode.ts";
import { DeClipNode } from "../worklets/DeClipNode.ts";
import { PhaseRotationNode } from "../worklets/PhaseRotationNode.ts";
import { MonoBassNode } from "../worklets/MonoBassNode.ts";
import { ZigSaturationNode } from "../worklets/ZigSaturationNode.ts";
import { ZigCompressorNode } from "../worklets/ZigCompressorNode.ts";
import { ZigLimiterNode } from "../worklets/ZigLimiterNode.ts";
import { ZigDeEsserNode } from "../worklets/ZigDeEsserNode.ts";
import { ZigTransientShaperNode } from "../worklets/ZigTransientShaperNode.ts";
import { SpectralMatchNode } from "../worklets/SpectralMatchNode.ts";
import { LufsNormalizerNode } from "../worklets/LufsNormalizerNode.ts";
import { GuitarRigNode } from "../worklets/GuitarRigNode.ts";
import { DrumMachineNode } from "../worklets/DrumMachineNode.ts";
import { TabPlayerNode } from "../worklets/TabPlayerNode.ts";
import { MetronomeNode } from "../worklets/MetronomeNode.ts";
import { TunerNode } from "../worklets/TunerNode.ts";
import { PedalCompressorNode } from "../worklets/PedalCompressorNode.ts";
import { PedalOverdriveNode } from "../worklets/PedalOverdriveNode.ts";
import { PedalSupernovaNode } from "../worklets/PedalSupernovaNode.ts";
import { PedalChorusNode } from "../worklets/PedalChorusNode.ts";
import { PedalTremoloNode } from "../worklets/PedalTremoloNode.ts";
import { PedalDelayNode } from "../worklets/PedalDelayNode.ts";
import { PedalReverbNode } from "../worklets/PedalReverbNode.ts";

export class NodeFactory {
    static create(module: RackModule, context: IAudioContext | IOfflineAudioContext, assets: Record<string, AudioBuffer>): IAudioNode<IAudioContext | IOfflineAudioContext> | ConvolutionNode | GuitarRigNode | DrumMachineNode | TabPlayerNode | MetronomeNode | TunerNode | PedalCompressorNode | PedalOverdriveNode | PedalSupernovaNode | PedalChorusNode | PedalTremoloNode | PedalDelayNode | PedalReverbNode | null {
        try {
            let node: any = null;
            switch (module.type) {
                case 'DYNAMIC_EQ': node = new DynamicEQNode(context); break;
                case 'TRANSIENT_SHAPER': node = new TransientShaperNode(context); break;
                case 'LIMITER': node = new LimiterNode(context); break;
                case 'MIDSIDE_EQ': node = new MidSideEQNode(context); break;
                case 'CAB_SIM': node = new ConvolutionNode(context); break;
                case 'LOUDNESS_METER': node = new MeteringNode(context); break;
                case 'SATURATION': node = new SaturationNode(context); break;
                case 'DITHERING': node = new DitheringNode(context); break;
                case 'PARAMETRIC_EQ': node = new ParametricEQNode(context); break;
                case 'DISTORTION': node = new DistortionNode(context); break;
                case 'BITCRUSHER': node = new BitCrusherNode(context); break;
                case 'CHORUS': node = new ChorusNode(context); break;
                case 'PHASER': node = new PhaserNode(context); break;
                case 'TREMOLO': node = new TremoloNode(context); break;
                case 'AUTOWAH': node = new AutoWahNode(context); break;
                case 'FEEDBACK_DELAY': node = new FeedbackDelayNode(context); break;
                case 'COMPRESSOR': node = new CompressorNode(context); break;
                case 'DE_ESSER': node = new DeEsserNode(context); break;
                case 'STEREO_IMAGER': node = new StereoImagerNode(context); break;
                case 'MULTIBAND_COMPRESSOR': node = new MultibandCompressorNode(context); break;
                case 'SMART_LEVEL': node = new SmartLevelNode(context); break;
                case 'TAPE_STABILIZER': node = new TapeStabilizerNode(context); break;
                case 'VOICE_ISOLATE': node = new VoiceIsolateNode(context); break;
                case 'ECHO_VANISH': node = new EchoVanishNode(context); break;
                case 'PLOSIVE_GUARD': node = new PlosiveGuardNode(context); break;
                case 'PSYCHO_DYNAMIC_EQ': node = new PsychoDynamicEQNode(context); break;
                case 'DE_BLEED': node = new DeBleedNode(context); break;
                case 'SPECTRAL_DENOISE': node = new SpectralDenoiseNode(context); break;
                case 'DE_CLIP': node = new DeClipNode(context); break;
                case 'PHASE_ROTATION': node = new PhaseRotationNode(context); break;
                case 'MONO_BASS': node = new MonoBassNode(context); break;
                case 'ZIG_SATURATION': node = new ZigSaturationNode(context); break;
                case 'ZIG_COMPRESSOR': node = new ZigCompressorNode(context); break;
                case 'ZIG_LIMITER': node = new ZigLimiterNode(context); break;
                case 'ZIG_DE_ESSER': node = new ZigDeEsserNode(context); break;
                case 'ZIG_TRANSIENT_SHAPER': node = new ZigTransientShaperNode(context); break;
                case 'SPECTRAL_MATCH': node = new SpectralMatchNode(context); break;
                case 'LUFS_NORMALIZER': node = new LufsNormalizerNode(context); break;
                case 'GUITAR_RIG': node = new GuitarRigNode(context); break;
                case 'DRUM_MACHINE': node = new DrumMachineNode(context); break;
                case 'TAB_PLAYER': node = new TabPlayerNode(context); break;
                case 'METRONOME': node = new MetronomeNode(context); break;
                case 'TUNER': node = new TunerNode(context); break;
                case 'PEDAL_COMPRESSOR': node = new PedalCompressorNode(context); break;
                case 'PEDAL_OVERDRIVE': node = new PedalOverdriveNode(context); break;
                case 'PEDAL_SUPERNOVA': node = new PedalSupernovaNode(context); break;
                case 'PEDAL_CHORUS': node = new PedalChorusNode(context); break;
                case 'PEDAL_TREMOLO': node = new PedalTremoloNode(context); break;
                case 'PEDAL_DELAY': node = new PedalDelayNode(context); break;
                case 'PEDAL_REVERB': node = new PedalReverbNode(context); break;
                default: return null;
            }

            if (node) {
                this.updateParams(node, module, assets);
            }
            return node;
        } catch (e) {
            logger.error(`Failed to create node for ${module.type}`, e);
            return context.createGain();
        }
    }

    static updateParams(node: IAudioNode<IAudioContext | IOfflineAudioContext> | ConvolutionNode | GuitarRigNode | DrumMachineNode | TabPlayerNode | MetronomeNode | TunerNode | PedalCompressorNode | PedalOverdriveNode | PedalSupernovaNode | PedalChorusNode | PedalTremoloNode | PedalDelayNode | PedalReverbNode, module: RackModule, assets: Record<string, AudioBuffer>) {
        if (node instanceof ConvolutionNode) {
            if (module.parameters.mix !== undefined) node.setMix(module.parameters.mix);
            if (module.parameters.irAssetId) {
                const buffer = assets[module.parameters.irAssetId];
                if (buffer) node.setBuffer(buffer);
            }
        } else {
            const n = node as any;
            if (typeof n.setParam === 'function') {
                Object.entries(module.parameters).forEach(([key, value]) => {
                    n.setParam(key, value);
                });
            }
        }
    }
}
