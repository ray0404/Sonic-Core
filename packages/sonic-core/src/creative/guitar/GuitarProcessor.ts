import { EffectParams } from './types';
import { PedalEngine } from './PedalEngine';
import { AmpEngine } from './AmpEngine';
import { EqualizerEngine } from './EqualizerEngine';

export class GuitarProcessor {
  input: GainNode;
  output: DynamicsCompressorNode;
  
  private pedals: PedalEngine;
  private amp: AmpEngine;
  private eq: EqualizerEngine;
  private masterGain: GainNode;

  constructor(ctx: BaseAudioContext, destination?: AudioNode) {
    this.input = ctx.createGain();
    
    // Master Limiter (Safety)
    this.output = ctx.createDynamicsCompressor();
    this.output.threshold.value = -0.5;
    this.output.knee.value = 0;
    this.output.ratio.value = 20; 
    this.output.attack.value = 0.001;
    this.output.release.value = 0.1;

    this.masterGain = ctx.createGain();

    // Instantiate Sub-Engines
    this.pedals = new PedalEngine(ctx);
    this.amp = new AmpEngine(ctx);
    this.eq = new EqualizerEngine(ctx);

    // Chain: Input -> Pedal Pre -> Amp -> EQ -> Pedal Post -> Master -> Limiter -> Output
    this.input.connect(this.pedals.inputPre);
    this.pedals.outputPre.connect(this.amp.input);
    this.amp.output.connect(this.eq.input);
    this.eq.output.connect(this.pedals.inputPost);
    this.pedals.outputPost.connect(this.masterGain);
    this.masterGain.connect(this.output);

    if (destination) {
        this.output.connect(destination);
    }
  }

  update(params: EffectParams, time: number) {
       // Input gain handling could be added here if part of params, 
       // but typically gain is handled at source or amp drive.
       // The original code had inputGain.gain.setTargetAtTime(params.gain, ...) 
       // but params.gain is usually Pre-Amp Gain (Drive). 
       // Let's assume params.gain refers to Amp Drive/Input Gain.
       
       // Actually, looking at types, gain is "Pre-Amp / Drive".
       // In AmpEngine, gain usually drives the distortion.
       // But here we might want an input trim.
       // For now, we'll delegate most updates to sub-engines.
       
       this.pedals.update(params, time, this.input.context as BaseAudioContext); // Cast for safety if needed
       this.amp.update(params, time);
       this.eq.update(params, time);
  }

  async loadCabIR(blob: Blob) {
      await this.amp.cabinet.loadImpulse(blob);
  }
  
  dispose() {
      this.input.disconnect();
      this.output.disconnect();
      this.pedals.outputPre.disconnect();
      this.pedals.outputPost.disconnect();
      this.amp.output.disconnect();
      this.eq.output.disconnect();
      this.masterGain.disconnect();
  }
}
