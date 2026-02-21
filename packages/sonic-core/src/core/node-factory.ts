import { IAudioContext, IOfflineAudioContext, IAudioNode } from "standardized-audio-context";
import type { RackModule } from "../types.js";
import { logger } from "../utils/logger.js";

import { DynamicEQNode } from "../worklets/DynamicEQNode.js";
import { TransientShaperNode } from "../worklets/TransientShaperNode.js";
import { LimiterNode } from "../worklets/LimiterNode.js";
import { MidSideEQNode } from "../worklets/MidSideEQNode.js";
import { MeteringNode } from "../worklets/MeteringNode.js";
import { ConvolutionNode } from "../worklets/ConvolutionNode.js";
import { SaturationNode } from "../worklets/SaturationNode.js";
import { DitheringNode } from "../worklets/DitheringNode.js";
import { ParametricEQNode } from "../worklets/ParametricEQNode.js";
import { DistortionNode } from "../worklets/DistortionNode.js";
import { BitCrusherNode } from "../worklets/BitCrusherNode.js";
import { ChorusNode } from "../worklets/ChorusNode.js";
import { PhaserNode } from "../worklets/PhaserNode.js";
import { TremoloNode } from "../worklets/TremoloNode.js";
import { AutoWahNode } from "../worklets/AutoWahNode.js";
import { FeedbackDelayNode } from "../worklets/FeedbackDelayNode.js";
import { CompressorNode } from "../worklets/CompressorNode.js";
import { DeEsserNode } from "../worklets/DeEsserNode.js";
import { StereoImagerNode } from "../worklets/StereoImagerNode.js";
import { MultibandCompressorNode } from "../worklets/MultibandCompressorNode.js";
import { SmartLevelNode } from "../worklets/SmartLevelNode.js";
import { TapeStabilizerNode } from "../worklets/TapeStabilizerNode.js";
import { VoiceIsolateNode } from "../worklets/VoiceIsolateNode.js";
import { EchoVanishNode } from "../worklets/EchoVanishNode.js";
import { PlosiveGuardNode } from "../worklets/PlosiveGuardNode.js";
import { PsychoDynamicEQNode } from "../worklets/PsychoDynamicEQNode.js";
import { DeBleedNode } from "../worklets/DeBleedNode.js";
import { SpectralDenoiseNode } from "../worklets/SpectralDenoiseNode.js";
import { DeClipNode } from "../worklets/DeClipNode.js";
import { PhaseRotationNode } from "../worklets/PhaseRotationNode.js";
import { MonoBassNode } from "../worklets/MonoBassNode.js";
import { ZigSaturationNode } from "../worklets/ZigSaturationNode.js";
import { ZigCompressorNode } from "../worklets/ZigCompressorNode.js";
import { ZigLimiterNode } from "../worklets/ZigLimiterNode.js";
import { ZigDeEsserNode } from "../worklets/ZigDeEsserNode.js";
import { ZigTransientShaperNode } from "../worklets/ZigTransientShaperNode.js";
import { SpectralMatchNode } from "../worklets/SpectralMatchNode.js";
import { LufsNormalizerNode } from "../worklets/LufsNormalizerNode.js";
import { GuitarRigNode } from "../worklets/GuitarRigNode.js";
import { DrumMachineNode } from "../worklets/DrumMachineNode.js";
import { TabPlayerNode } from "../worklets/TabPlayerNode.js";
import { MetronomeNode } from "../worklets/MetronomeNode.js";
import { TunerNode } from "../worklets/TunerNode.js";
import { PedalCompressorNode } from "../worklets/PedalCompressorNode.js";
import { PedalOverdriveNode } from "../worklets/PedalOverdriveNode.js";
import { PedalSupernovaNode } from "../worklets/PedalSupernovaNode.js";
import { PedalChorusNode } from "../worklets/PedalChorusNode.js";
import { PedalTremoloNode } from "../worklets/PedalTremoloNode.js";
import { PedalDelayNode } from "../worklets/PedalDelayNode.js";
import { PedalReverbNode } from "../worklets/PedalReverbNode.js";

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
