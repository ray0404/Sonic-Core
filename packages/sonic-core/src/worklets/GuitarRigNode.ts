import { IAudioContext, IOfflineAudioContext, IAudioNode, IGainNode } from "standardized-audio-context";
import { GuitarProcessor } from "../creative/guitar/GuitarProcessor";

export class GuitarRigNode {
    public context: IAudioContext | IOfflineAudioContext;
    public input: IGainNode<IAudioContext | IOfflineAudioContext>;
    public output: IGainNode<IAudioContext | IOfflineAudioContext>;
    private processor: GuitarProcessor;

    constructor(context: IAudioContext | IOfflineAudioContext) {
        this.context = context;
        this.input = context.createGain();
        this.output = context.createGain();

        // Instantiate the Processor with the context
        // Note: GuitarProcessor expects BaseAudioContext. IAudioContext is compatible-ish.
        // We might need to cast or ensure GuitarProcessor uses standardized interfaces if possible.
        // But GuitarProcessor uses native nodes inside. standardized-audio-context nodes wrap native nodes.
        // If 'context' is a standardized wrapper, we might need to access the underlying native context 
        // IF GuitarProcessor creates native nodes directly using 'new AudioContext' or similar, 
        // but it accepts 'ctx' in constructor. 
        // If it uses ctx.createGain(), it should work with standardized context too!
        
        this.processor = new GuitarProcessor(context as unknown as BaseAudioContext);
        
        // Connect: Input -> Processor -> Output
        // We need to access the input/output of the processor.
        // Processor has .input (GainNode) and .output (CompressorNode).
        
        // However, standardized nodes vs native nodes connection might be tricky if mixed.
        // standardized context returns standardized nodes.
        // GuitarProcessor uses the passed context to create nodes. 
        // So if we pass standardized context, it creates standardized nodes. Perfect.
        
        (this.input as any).connect(this.processor.input);
        (this.processor.output as any).connect(this.output);
    }

    setParam(param: string, value: any) {
        // Map simple param setting to the complex updateParams method
        // We need to accumulate params or just pass what we have.
        // Since update() takes EffectParams, we should probably store state here.
        // But for now, let's just pass a partial object and let the processor handle it if it can,
        // OR we rely on the processor state. 
        // GuitarProcessor.update takes ALL params. 
        // We should store local state here.
        
        // Note: This simple implementation assumes the user sends a full update or we cache it.
        // But 'setParam' usually sends one by one.
        // Let's implement a state cache.
        
        if (!this._params) this._params = {} as any;
        this._params[param] = value;
        
        // Debounce updates? Or just call update.
        // The processor update might be heavy.
        this.processor.update(this._params, this.context.currentTime);
    }
    
    private _params: any = {};

    connect(destination: IAudioNode<IAudioContext | IOfflineAudioContext>) {
        this.output.connect(destination as any);
    }

    disconnect() {
        this.output.disconnect();
    }
}
