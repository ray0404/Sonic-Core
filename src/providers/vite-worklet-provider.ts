import { WorkletProvider } from "@sonic-core/core/types";

// @ts-ignore
import dynamicEqUrl from '@sonic-core/worklets/dynamic-eq-processor.js?worker&url';
// @ts-ignore
import transientUrl from '@sonic-core/worklets/transient-processor.js?worker&url';
// @ts-ignore
import limiterUrl from '@sonic-core/worklets/limiter-processor.js?worker&url';
// @ts-ignore
import midsideUrl from '@sonic-core/worklets/midside-eq-processor.js?worker&url';
// @ts-ignore
import lufsUrl from '@sonic-core/worklets/lufs-processor.js?worker&url';
// @ts-ignore
import saturationUrl from '@sonic-core/worklets/saturation-processor.js?worker&url';
// @ts-ignore
import ditheringUrl from '@sonic-core/worklets/dithering-processor.js?worker&url';
// @ts-ignore
import parametricEqUrl from '@sonic-core/worklets/parametric-eq-processor.js?worker&url';
// @ts-ignore
import distortionUrl from '@sonic-core/worklets/distortion-processor.js?worker&url';
// @ts-ignore
import bitcrusherUrl from '@sonic-core/worklets/bitcrusher-processor.js?worker&url';
// @ts-ignore
import chorusUrl from '@sonic-core/worklets/chorus-processor.js?worker&url';
// @ts-ignore
import phaserUrl from '@sonic-core/worklets/phaser-processor.js?worker&url';
// @ts-ignore
import tremoloUrl from '@sonic-core/worklets/tremolo-processor.js?worker&url';
// @ts-ignore
import autowahUrl from '@sonic-core/worklets/autowah-processor.js?worker&url';
// @ts-ignore
import feedbackDelayUrl from '@sonic-core/worklets/feedback-delay-processor.js?worker&url';
// @ts-ignore
import compressorUrl from '@sonic-core/worklets/compressor-processor.js?worker&url';
// @ts-ignore
import deesserUrl from '@sonic-core/worklets/deesser-processor.js?worker&url';
// @ts-ignore
import stereoImagerUrl from '@sonic-core/worklets/stereo-imager-processor.js?worker&url';
// @ts-ignore
import multibandCompressorUrl from '@sonic-core/worklets/multiband-compressor-processor.js?worker&url';
// @ts-ignore
import smartLevelUrl from '@sonic-core/worklets/smart-level-processor.js?worker&url';
// @ts-ignore
import tapeStabilizerUrl from '@sonic-core/worklets/tape-stabilizer-processor.js?worker&url';
// @ts-ignore
import voiceIsolateUrl from '@sonic-core/worklets/voice-isolate-processor.js?worker&url';
// @ts-ignore
import echoVanishUrl from '@sonic-core/worklets/echo-vanish-processor.js?worker&url';
// @ts-ignore
import plosiveGuardUrl from '@sonic-core/worklets/plosive-guard-processor.js?worker&url';
// @ts-ignore
import psychoDynamicEqUrl from '@sonic-core/worklets/psycho-dynamic-eq-processor.js?worker&url';
// @ts-ignore
import deBleedUrl from '@sonic-core/worklets/de-bleed-processor.js?worker&url';
// @ts-ignore
import spectralDenoiseUrl from '@sonic-core/worklets/spectral-denoise-processor.js?worker&url';
// @ts-ignore
import deClipUrl from '@sonic-core/worklets/de-clip-processor.js?worker&url';
// @ts-ignore
import phaseRotationUrl from '@sonic-core/worklets/phase-rotation-processor.js?worker&url';
// @ts-ignore
import monoBassUrl from '@sonic-core/worklets/mono-bass-processor.js?worker&url';
// @ts-ignore
import zigSaturationUrl from '@sonic-core/worklets/zig-saturation-processor.js?worker&url';
// @ts-ignore
import zigCompressorUrl from '@sonic-core/worklets/zig-compressor-processor.js?worker&url';
// @ts-ignore
import zigLimiterUrl from '@sonic-core/worklets/zig-limiter-processor.js?worker&url';
// @ts-ignore
import zigDeEsserUrl from '@sonic-core/worklets/zig-de-esser-processor.js?worker&url';
// @ts-ignore
import zigTransientUrl from '@sonic-core/worklets/zig-transient-shaper-processor.js?worker&url';
// @ts-ignore
import spectralMatchUrl from '@sonic-core/worklets/spectral-match-processor.js?worker&url';
// @ts-ignore
import lufsNormalizerUrl from '@sonic-core/worklets/lufs-normalizer-processor.js?worker&url';

export class ViteWorkletProvider implements WorkletProvider {
    getModuleUrls(): string[] {
        return [
            dynamicEqUrl,
            transientUrl,
            limiterUrl,
            midsideUrl,
            lufsUrl,
            saturationUrl,
            ditheringUrl,
            parametricEqUrl,
            distortionUrl,
            bitcrusherUrl,
            chorusUrl,
            phaserUrl,
            tremoloUrl,
            autowahUrl,
            feedbackDelayUrl,
            compressorUrl,
            deesserUrl,
            stereoImagerUrl,
            multibandCompressorUrl,
            smartLevelUrl,
            tapeStabilizerUrl,
            voiceIsolateUrl,
            echoVanishUrl,
            plosiveGuardUrl,
            psychoDynamicEqUrl,
            deBleedUrl,
            spectralDenoiseUrl,
            deClipUrl,
            phaseRotationUrl,
            monoBassUrl,
            zigSaturationUrl,
            zigCompressorUrl,
            zigLimiterUrl,
            zigDeEsserUrl,
            zigTransientUrl,
            spectralMatchUrl,
            lufsNormalizerUrl
        ];
    }
}
