import { SonicForgeSDK as SonicSDK } from '../sdk.js';
import { RackModule } from '../types.js';

export interface AudioProfile {
    lufs: number;
    peak: number;
    crest: number;
    lowRatio: number;
    midRatio: number;
    highRatio: number;
    dynamicRange: number;
    stereoWidth: number;
    dcOffset: number;
}

export class ProfileAnalyzer {
    constructor(private sdk: SonicSDK) {}

    analyze(buffer: Float32Array, channels: number, sampleRate: number): AudioProfile {
        const stats = this.sdk.analyzeAudio(buffer, channels, sampleRate);
        
        return {
            lufs: stats[0],
            peak: stats[2],
            crest: stats[4],
            stereoWidth: stats[6],
            lowRatio: stats[9],
            midRatio: stats[10],
            highRatio: stats[11],
            dynamicRange: stats[1], // LRA
            dcOffset: stats[8]
        };
    }

    suggestRack(profile: AudioProfile): Omit<RackModule, 'id'>[] {
        const suggestions: Omit<RackModule, 'id'>[] = [];

        // 1. Initial cleanup: Phase Rotation & DC Removal
        // DC offset > 0.001 is problematic
        if (profile.dcOffset > 0.001) {
            suggestions.push({
                type: 'PHASE_ROTATION',
                name: 'DC & Phase Cleanup',
                bypass: false,
                parameters: {}
            });
        } else {
            suggestions.push({
                type: 'PHASE_ROTATION',
                name: 'Phase Align',
                bypass: false,
                parameters: {}
            });
        }

        // 2. Safety: De-Clip if peak is close to 0dBFS
        if (profile.peak > -0.1) {
            suggestions.push({
                type: 'DE_CLIP',
                name: 'Auto De-Clip',
                bypass: false,
                parameters: { threshold: 0.98 }
            });
        }

        // 3. Tonal Balance & Spectral Correction
        // If low-end is too high (> 40% of energy)
        if (profile.lowRatio > 0.45) {
            suggestions.push({
                type: 'PARAMETRIC_EQ',
                name: 'Low Cut & Clean',
                bypass: false,
                parameters: { lowFreq: 100, lowGain: -3, midFreq: 1000, midGain: 0, midQ: 1, highFreq: 4000, highGain: 0 }
            });
        }

        // If sibilance is likely (High ratio > 35% and peaky)
        if (profile.highRatio > 0.35) {
            suggestions.push({
                type: 'DE_ESSER',
                name: 'Auto De-Esser',
                bypass: false,
                parameters: { threshold: -24, frequency: 6500, ratio: 4, attack: 0.005, release: 0.05 }
            });
        }

        // Bass Management
        // If it's very wide but has significant bass, mono the bass
        if (profile.stereoWidth > 0.4 && profile.lowRatio > 0.3) {
            suggestions.push({
                type: 'MONO_BASS',
                name: 'Mono Sub',
                bypass: false,
                parameters: { frequency: 120 }
            });
        }

        // 4. Intelligence: Psycho-Dynamic EQ
        // Good for general "polishing" and tonal consistency
        suggestions.push({
            type: 'PSYCHO_DYNAMIC_EQ',
            name: 'Sonic Intelligence',
            bypass: false,
            parameters: { intensity: 0.6, refDb: -18 }
        });

        // 5. Dynamic Control
        // If it's too dynamic (LRA > 14)
        if (profile.dynamicRange > 14) {
            suggestions.push({
                type: 'COMPRESSOR',
                name: 'Level Smoothing',
                bypass: false,
                parameters: { threshold: -22, ratio: 2.5, attack: 0.02, release: 0.15, makeupGain: 2 }
            });
        }

        // 6. Loudness Normalization
        // Aim for -14 LUFS if it's too quiet
        if (profile.lufs < -18) {
            suggestions.push({
                type: 'SMART_LEVEL',
                name: 'Auto Gain Master',
                bypass: false,
                parameters: { targetLufs: -14, maxGainDb: 12, gateThresholdDb: -60 }
            });
        }

        // 7. Final Polish: Tape Stabilizer if crest factor is very high (transient heavy)
        if (profile.crest > 15) {
            suggestions.push({
                type: 'TAPE_STABILIZER',
                name: 'Tape Warmth',
                bypass: false,
                parameters: { nominalFreq: 3150, scanMin: 3100, scanMax: 3200, amount: 0.3 }
            });
        }

        // 8. Safety Limiter
        suggestions.push({
            type: 'LIMITER',
            name: 'Master Safety',
            bypass: false,
            parameters: { threshold: -1.0, release: 0.05 }
        });

        return suggestions;
    }
}
