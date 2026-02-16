#include "au_minimal.h"
#include <vector>
#include <cstring>
#include <new>

// Zig C-ABI
extern "C" {
    void* plugin_create(float sample_rate);
    void plugin_destroy(void* instance);
    void plugin_process(void* instance, const float** inputs, float** outputs, size_t frames);
    void plugin_set_parameter(void* instance, int32_t index, float value);
    float plugin_get_parameter(void* instance, int32_t index);
}

class SonicAU {
public:
    SonicAU(AudioComponentPlugInInterface* component) 
        : mComponent(component), mInstance(nullptr), mSampleRate(44100.0) 
    {
        mInputConnection.sourceAudioUnit = nullptr;
        mRenderCallback.inputProc = nullptr;
        for (int i = 0; i < 16; i++) mParams[i] = 0.5f;
    }
    
    ~SonicAU() {
        if (mInstance) {
            plugin_destroy(mInstance);
            mInstance = nullptr;
        }
    }

    OSStatus Initialize() {
        if (!mInstance) {
            mInstance = plugin_create((float)mSampleRate);
            for (int i = 0; i < 16; i++) plugin_set_parameter(mInstance, i, mParams[i]);
        }
        return noErr;
    }

    OSStatus Uninitialize() {
        if (mInstance) {
            plugin_destroy(mInstance);
            mInstance = nullptr;
        }
        return noErr;
    }
    
    OSStatus SetProperty(AudioUnitPropertyID inID, AudioUnitScope inScope, AudioUnitElement inElement, const void* inData, UInt32 inDataSize) {
         if (inID == kAudioUnitProperty_SampleRate) {
             mSampleRate = *(const Float64*)inData;
             return noErr;
         }
         if (inID == kAudioUnitProperty_MakeConnection && inScope == kAudioUnitScope_Input) {
             mInputConnection = *(const AudioUnitConnection*)inData;
             return noErr;
         }
         if (inID == kAudioUnitProperty_SetRenderCallback && inScope == kAudioUnitScope_Input) {
             mRenderCallback = *(const AURenderCallbackStruct*)inData;
             return noErr;
         }
         return noErr;
    }

    OSStatus GetPropertyInfo(AudioUnitPropertyID inID, AudioUnitScope inScope, AudioUnitElement inElement, UInt32* outDataSize, Boolean* outWritable) {
        if (inID == kAudioUnitProperty_SupportedNumChannels) {
            if (outDataSize) *outDataSize = sizeof(AudioComponentDescription); 
            if (outWritable) *outWritable = false;
            return noErr;
        }
        return kAudioUnitErr_InvalidProperty;
    }

    OSStatus GetProperty(AudioUnitPropertyID inID, AudioUnitScope inScope, AudioUnitElement inElement, void* outData) {
        return kAudioUnitErr_InvalidProperty;
    }

    OSStatus GetParameter(AudioUnitParameterID inID, AudioUnitScope inScope, AudioUnitElement inElement, AudioUnitParameterValue* outValue) {
        if (inID < 16) {
            *outValue = mParams[inID];
            return noErr;
        }
        return kAudioUnitErr_InvalidParameter;
    }

    OSStatus SetParameter(AudioUnitParameterID inID, AudioUnitScope inScope, AudioUnitElement inElement, AudioUnitParameterValue inValue, UInt32 inBufferOffsetInFrames) {
        if (inID < 16) {
            mParams[inID] = inValue;
            if (mInstance) plugin_set_parameter(mInstance, inID, inValue);
            return noErr;
        }
        return kAudioUnitErr_InvalidParameter;
    }

    OSStatus Render(AudioUnitRenderActionFlags* ioActionFlags, const AudioTimeStamp* inTimeStamp, UInt32 inOutputBusNumber, UInt32 inNumberFrames, AudioBufferList* ioData) {
        if (!mInstance) return kAudioUnitErr_Uninitialized;

        // 1. Fetch Input
        OSStatus result = noErr;
        if (mInputConnection.sourceAudioUnit) {
            result = AudioUnitRender(mInputConnection.sourceAudioUnit, ioActionFlags, inTimeStamp, mInputConnection.sourceOutputNumber, inNumberFrames, ioData);
        } else if (mRenderCallback.inputProc) {
            result = mRenderCallback.inputProc(mRenderCallback.inputProcRefCon, ioActionFlags, inTimeStamp, 0, inNumberFrames, ioData);
        }
        
        if (result != noErr) return result;

        // 2. Map to Zig
        std::vector<const float*> inputs;
        std::vector<float*> outputs;
        
        for (UInt32 i = 0; i < ioData->mNumberBuffers; ++i) {
            inputs.push_back((const float*)ioData->mBuffers[i].mData);
            outputs.push_back((float*)ioData->mBuffers[i].mData);
        }

        plugin_process(mInstance, inputs.data(), outputs.data(), inNumberFrames);

        return noErr;
    }

    // Static dispatchers
    static OSStatus SonicAU_GetPropertyInfo(void *self, AudioUnitPropertyID inID, AudioUnitScope inScope, AudioUnitElement inElement, UInt32 *outDataSize, Boolean *outWritable) {
        return ((SonicAU*)self)->GetPropertyInfo(inID, inScope, inElement, outDataSize, outWritable);
    }
    static OSStatus SonicAU_GetProperty(void *self, AudioUnitPropertyID inID, AudioUnitScope inScope, AudioUnitElement inElement, void *outData, UInt32 *ioDataSize) {
        return ((SonicAU*)self)->GetProperty(inID, inScope, inElement, outData);
    }
    static OSStatus SonicAU_SetProperty(void *self, AudioUnitPropertyID inID, AudioUnitScope inScope, AudioUnitElement inElement, const void *inData, UInt32 inDataSize) {
        return ((SonicAU*)self)->SetProperty(inID, inScope, inElement, inData, inDataSize);
    }
    static OSStatus SonicAU_GetParameter(void *self, AudioUnitParameterID inID, AudioUnitScope inScope, AudioUnitElement inElement, AudioUnitParameterValue *outValue) {
        return ((SonicAU*)self)->GetParameter(inID, inScope, inElement, outValue);
    }
    static OSStatus SonicAU_SetParameter(void *self, AudioUnitParameterID inID, AudioUnitScope inScope, AudioUnitElement inElement, AudioUnitParameterValue inValue, UInt32 inBufferOffsetInFrames) {
        return ((SonicAU*)self)->SetParameter(inID, inScope, inElement, inValue, inBufferOffsetInFrames);
    }
    static OSStatus SonicAU_Initialize(void *self) { return ((SonicAU*)self)->Initialize(); }
    static OSStatus SonicAU_Uninitialize(void *self) { return ((SonicAU*)self)->Uninitialize(); }
    static OSStatus SonicAU_Render(void *self, AudioUnitRenderActionFlags *ioActionFlags, const AudioTimeStamp *inTimeStamp, UInt32 inOutputBusNumber, UInt32 inNumberFrames, AudioBufferList *ioData) {
        return ((SonicAU*)self)->Render(ioActionFlags, inTimeStamp, inOutputBusNumber, inNumberFrames, ioData);
    }

private:
    AudioComponentPlugInInterface* mComponent;
    void* mInstance;
    double mSampleRate;
    AudioUnitConnection mInputConnection;
    AURenderCallbackStruct mRenderCallback;
    float mParams[16];
};

// Component Entry
OSStatus SonicAU_Open(void *self, void *mInstance) {
    SonicAU* au = new (std::nothrow) SonicAU((AudioComponentPlugInInterface*)self);
    if (!au) return -1;
    // Note: In a real implementation, we would store 'au' in the instance storage.
    // For this minimal bridge, we'll assume the host passes it back correctly in self.
    return noErr;
}

OSStatus SonicAU_Close(void *self) {
    return noErr;
}

void* SonicAU_Lookup(SInt16 selector) {
    switch (selector) {
        case kAudioUnitInitializeSelect: return (void*)SonicAU::SonicAU_Initialize;
        case kAudioUnitUninitializeSelect: return (void*)SonicAU::SonicAU_Uninitialize;
        case kAudioUnitGetPropertyInfoSelect: return (void*)SonicAU::SonicAU_GetPropertyInfo;
        case kAudioUnitGetPropertySelect: return (void*)SonicAU::SonicAU_GetProperty;
        case kAudioUnitSetPropertySelect: return (void*)SonicAU::SonicAU_SetProperty;
        case kAudioUnitGetParameterSelect: return (void*)SonicAU::SonicAU_GetParameter;
        case kAudioUnitSetParameterSelect: return (void*)SonicAU::SonicAU_SetParameter;
        case kAudioUnitRenderSelect: return (void*)SonicAU::SonicAU_Render;
        default: return NULL;
    }
}

extern "C" {
    AU_EXPORT void* SonicPluginFactory(const AudioComponentDescription* inDesc) {
        static AudioComponentPlugInInterface interface;
        interface.Open = SonicAU_Open;
        interface.Close = SonicAU_Close;
        interface.Lookup = SonicAU_Lookup;
        interface.GetScrap = NULL;
        return &interface;
    }
}
