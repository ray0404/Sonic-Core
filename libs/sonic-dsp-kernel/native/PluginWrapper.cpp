#include "vst3_minimal.h"
#include <vector>
#include <cstring>
#include <atomic>

// Zig C-ABI
extern "C" {
    void* plugin_create(float sample_rate);
    void plugin_destroy(void* instance);
    void plugin_process(void* instance, const float** inputs, float** outputs, size_t frames);
    void plugin_set_parameter(void* instance, int32_t index, float value);
    float plugin_get_parameter(void* instance, int32_t index);
}

namespace Steinberg {
    // Basic GUID implementations
    const TUID FUnknown::iid = {0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0xC0,0x00,0x00,0x00,0x00,0x00,0x00,0x46};
    const TUID IPluginFactory::iid = {0x7A,0x43,0x81,0x98,0x72,0xEE,0x4A,0x51,0xA3,0x96,0x09,0xE9,0x54,0x66,0x28,0xC6};
    const TUID Vst::IComponent::iid = {0xE8,0x31,0xFF,0x31,0xF2,0xD5,0x43,0x01,0x92,0x8E,0xBB,0xEE,0x25,0x69,0x78,0x02};
    const TUID Vst::IAudioProcessor::iid = {0x42,0x04,0x3F,0x99,0xB1,0xF9,0x42,0xE9,0x8C,0xB8,0x69,0x7E,0x20,0x8E,0x44,0xDA};
    const TUID Vst::IEditController::iid = {0xD1,0xFE,0x12,0x02,0x30,0xB0,0x44,0xDA,0x87,0x45,0x1F,0xDB,0xA1,0x42,0x20,0x3C};

    // Helper for UID comparison
    bool FUnknownPrivate_iidEqual(const TUID a, const TUID b) {
        return memcmp(a, b, 16) == 0;
    }
}

using namespace Steinberg;
using namespace Steinberg::Vst;

// Random GUID for our plugin: {A1B2C3D4-E5F6-7890-1234-56789ABCDEF0}
static const TUID MyPluginCID = {0xA1,0xB2,0xC3,0xD4,0xE5,0xF6,0x78,0x90,0x12,0x34,0x56,0x78,0x9A,0xBC,0xDE,0xF0};

class PluginWrapper : public IComponent, public IAudioProcessor, public IEditController {
public:
    PluginWrapper() : refCount(1), zigInstance(nullptr), sampleRate(44100.0f) {
        for (int i = 0; i < 16; i++) paramCache[i] = 0.5f;
    }
    virtual ~PluginWrapper() {
        if (zigInstance) {
            plugin_destroy(zigInstance);
            zigInstance = nullptr;
        }
    }

    // --- FUnknown ---
    int32 SMTG_STDCALL queryInterface(const TUID _iid, void** obj) override {
        if (FUnknownPrivate_iidEqual(_iid, FUnknown::iid) ||
            FUnknownPrivate_iidEqual(_iid, IComponent::iid) ||
            FUnknownPrivate_iidEqual(_iid, IAudioProcessor::iid) ||
            FUnknownPrivate_iidEqual(_iid, IEditController::iid)) {
            *obj = this;
            addRef();
            return kResultOk;
        }
        *obj = nullptr;
        return kNoInterface;
    }

    uint32 SMTG_STDCALL addRef() override {
        return ++refCount;
    }

    uint32 SMTG_STDCALL release() override {
        if (--refCount == 0) {
            delete this;
            return 0;
        }
        return refCount;
    }

    // --- IComponent ---
    tresult SMTG_STDCALL getControllerClassId(TUID classId) override { 
        memcpy(classId, MyPluginCID, 16); 
        return kResultOk; 
    }
    tresult SMTG_STDCALL setIoMode(TIoMediaType level) override { return kResultOk; }
    tresult SMTG_STDCALL getBusCount(TMediaType type, TBusDirection dir) override {
        if (type == kAudio) return 1;
        return 0;
    }
    tresult SMTG_STDCALL getBusInfo(TMediaType type, TBusDirection dir, int32 index, void* busInfo) override {
        return kResultOk; 
    }
    tresult SMTG_STDCALL getRoutingInfo(void* inInfo, void* outInfo) override { return kNotImplemented; }
    tresult SMTG_STDCALL activateBus(TMediaType type, TBusDirection dir, int32 index, bool state) override { return kResultOk; }
    tresult SMTG_STDCALL setActive(bool state) override { 
        if (state) {
            if (!zigInstance) {
                zigInstance = plugin_create(sampleRate);
                // Sync initial params
                for (int i = 0; i < 16; i++) plugin_set_parameter(zigInstance, i, paramCache[i]);
            }
        }
        return kResultOk; 
    }
    tresult SMTG_STDCALL setState(void* state) override { return kResultOk; }
    tresult SMTG_STDCALL getState(void* state) override { return kResultOk; }

    // --- IAudioProcessor ---
    tresult SMTG_STDCALL setBusArrangements(uint64* inputs, int32 numIns, uint64* outputs, int32 numOuts) override { return kResultOk; }
    tresult SMTG_STDCALL getBusArrangement(int32 busIndex, TBusDirection dir, uint64& arrangement) override { return kResultOk; }
    tresult SMTG_STDCALL canProcessSampleSize(int32 symbolicSampleSize) override {
        return (symbolicSampleSize == 0) ? kResultOk : kResultFalse; // kSample32 = 0
    }
    tresult SMTG_STDCALL getLatencySamples(int32& latency) override { latency = 0; return kResultOk; }
    
    tresult SMTG_STDCALL setupProcessing(ProcessSetup& setup) override {
        sampleRate = setup.sampleRate;
        if (zigInstance) {
            plugin_destroy(zigInstance);
            zigInstance = nullptr;
        }
        zigInstance = plugin_create(sampleRate);
        for (int i = 0; i < 16; i++) plugin_set_parameter(zigInstance, i, paramCache[i]);
        return kResultOk;
    }
    
    tresult SMTG_STDCALL setProcessing(bool state) override { return kResultOk; }
    
    tresult SMTG_STDCALL process(ProcessData& data) override {
        if (!zigInstance) return kResultOk;

        // Handle Parameter Changes
        if (data.inputParameterChanges) {
            int32 numParams = data.inputParameterChanges->getParameterCount();
            for (int32 i = 0; i < numParams; i++) {
                IParamValueQueue* queue = data.inputParameterChanges->getParameterData(i);
                if (queue) {
                    ParamID id = queue->getParameterId();
                    int32 points = queue->getPointCount();
                    ParamValue val;
                    int32 offset;
                    if (queue->getPoint(points - 1, offset, val) == kResultOk) {
                        if (id < 16) {
                            paramCache[id] = (float)val;
                            plugin_set_parameter(zigInstance, id, (float)val);
                        }
                    }
                }
            }
        }

        if (data.numInputs == 0 || data.numOutputs == 0) return kResultOk;
        if (data.symbolicSampleSize != 0) return kResultFalse; 

        float** inputs = data.inputs[0].channelBuffers32;
        float** outputs = data.outputs[0].channelBuffers32;
        int32 numFrames = data.numSamples;

        plugin_process(zigInstance, (const float**)inputs, outputs, numFrames);

        return kResultOk;
    }
    
    tresult SMTG_STDCALL getTailSamples(int32& tail) override { tail = 0; return kResultOk; }

    // --- IEditController ---
    tresult SMTG_STDCALL setComponentState(void* state) override { return kResultOk; }
    int32 SMTG_STDCALL getParameterCount() override { return 16; } // Support up to 16 generic params
    tresult SMTG_STDCALL getParameterInfo(int32 paramIndex, ParameterInfo& info) override {
        if (paramIndex >= 16) return kResultFalse;
        info.id = paramIndex;
        sprintf(info.title, "Param %d", paramIndex + 1);
        strcpy(info.shortTitle, info.title);
        strcpy(info.units, "");
        info.stepCount = 0; // Continuous
        info.defaultValue = 0.5;
        info.min = 0.0;
        info.max = 1.0;
        info.unitId = 0;
        info.flags = 1; // canAutomate
        return kResultOk;
    }
    ParamValue SMTG_STDCALL getParamStringByValue(ParamID id, ParamValue valueNormalized, char16* string) override { return 0; }
    tresult SMTG_STDCALL getParamValueByString(ParamID id, char16* string, ParamValue& valueNormalized) override { return kNotImplemented; }
    ParamValue SMTG_STDCALL normalizedParamToPlain(ParamID id, ParamValue valueNormalized) override { return valueNormalized; }
    ParamValue SMTG_STDCALL plainParamToNormalized(ParamID id, ParamValue plainValue) override { return plainValue; }
    ParamValue SMTG_STDCALL getParamNormalized(ParamID id) override { 
        if (id < 16) return paramCache[id];
        return 0; 
    }
    tresult SMTG_STDCALL setParamNormalized(ParamID id, ParamValue value) override { 
        if (id < 16) paramCache[id] = (float)value;
        return kResultOk; 
    }
    tresult SMTG_STDCALL setComponentHandler(void* handler) override { return kResultOk; }
    void* SMTG_STDCALL createView(const char* name) override { return nullptr; }

private:
    std::atomic<uint32> refCount;
    void* zigInstance;
    float sampleRate;
    float paramCache[16];
};

class PluginFactory : public IPluginFactory {
public:
    PluginFactory() : refCount(1) {}
    
    // FUnknown
    int32 SMTG_STDCALL queryInterface(const TUID _iid, void** obj) override {
        if (FUnknownPrivate_iidEqual(_iid, FUnknown::iid) ||
            FUnknownPrivate_iidEqual(_iid, IPluginFactory::iid)) {
            *obj = this;
            addRef();
            return kResultOk;
        }
        *obj = nullptr;
        return kNoInterface;
    }
    uint32 SMTG_STDCALL addRef() override { return ++refCount; }
    uint32 SMTG_STDCALL release() override { return 1; } // Global singleton-ish

    // IPluginFactory
    tresult SMTG_STDCALL getFactoryInfo(void* info) override { 
        // PFactoryInfo* i = (PFactoryInfo*)info;
        // strcpy(i->vendor, "SonicFoundry");
        return kResultOk; 
    }
    int32 SMTG_STDCALL countClasses() override { return 1; }
    tresult SMTG_STDCALL getClassInfo(int32 index, void* info) override {
        if (index == 0) {
            // PClassInfo* i = (PClassInfo*)info;
            // memcpy(i->cid, MyPluginCID, 16);
            // strcpy(i->name, "SonicPlugin");
            // strcpy(i->category, "Fx");
            return kResultOk;
        }
        return kInvalidArgument;
    }
    tresult SMTG_STDCALL createInstance(const TUID cid, const TUID _iid, void** obj) override {
        if (FUnknownPrivate_iidEqual(cid, MyPluginCID)) {
            PluginWrapper* p = new PluginWrapper();
            return p->queryInterface(_iid, obj);
        }
        return kInvalidArgument;
    }

private:
    std::atomic<uint32> refCount;
};

static PluginFactory gFactory;

SMTG_EXPORT IPluginFactory* SMTG_STDCALL GetPluginFactory() {
    return &gFactory;
}
