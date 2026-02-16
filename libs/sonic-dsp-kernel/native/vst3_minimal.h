#pragma once

#include <cstdint>
#include <cstring>

#if defined(_WIN32)
#define SMTG_STDCALL __stdcall
#define SMTG_EXPORT __declspec(dllexport)
#else
#define SMTG_STDCALL
#define SMTG_EXPORT __attribute__((visibility("default")))
#endif

namespace Steinberg {
    using int8 = int8_t;
    using uint8 = uint8_t;
    using int16 = int16_t;
    using uint16 = uint16_t;
    using int32 = int32_t;
    using uint32 = uint32_t;
    using int64 = int64_t;
    using uint64 = uint64_t;
    using char8 = char;
    using char16 = char16_t;
    using TUID = unsigned char[16];

    // Helper to define GUIDs
    // 80738466 2206411d 80637648 766e0655 (Example)
    // We need standard VST3 GUIDs.

    class FUnknown {
    public:
        virtual int32 SMTG_STDCALL queryInterface(const TUID _iid, void** obj) = 0;
        virtual uint32 SMTG_STDCALL addRef() = 0;
        virtual uint32 SMTG_STDCALL release() = 0;
        static const TUID iid;
    };

    const int32 kResultOk = 0;
    const int32 kResultFalse = 1;
    const int32 kInvalidArgument = 2;
    const int32 kNotImplemented = 3;
    const int32 kInternalError = 4;
    const int32 kNoInterface = 5;
    const int32 kOutOfMemory = 6;

    typedef int32 tresult;

    namespace Vst {
        typedef int32 ParamID;
        typedef double ParamValue;
        typedef int32 TMediaType;
        typedef int32 TBusDirection;
        typedef int32 TBusType;
        typedef int32 TIoMediaType;

        enum MediaTypes {
            kAudio = 0,
            kEvent,
            kNumMediaTypes
        };

        enum BusDirections {
            kInput = 0,
            kOutput
        };

        enum BusTypes {
            kMain = 0,
            kAux
        };

        struct SpeakerArrangement {
            // Minimal placeholder
            uint64 arrangement;
        };

        struct ProcessSetup {
            int32 processMode;
            int32 symbolicSampleSize;
            int32 maxSamplesPerBlock;
            double sampleRate;
        };

        struct AudioBusBuffers {
            int32 numChannels;
            uint64 silenceFlags;
            union {
                float** channelBuffers32;
                double** channelBuffers64;
            };
        };

        struct ProcessData {
            int32 processMode;
            int32 symbolicSampleSize;
            int32 numSamples;
            int32 numInputs;
            int32 numOutputs;
            AudioBusBuffers* inputs;
            AudioBusBuffers* outputs;
            class IParameterChanges* inputParameterChanges; 
            class IParameterChanges* outputParameterChanges;
            void* inputEvents;
            void* outputEvents;
            void* processContext;
        };

        struct ParameterInfo {
            ParamID id;
            char8 title[128];
            char8 shortTitle[128];
            char8 units[128];
            int32 stepCount;
            ParamValue defaultValue;
            ParamValue min;
            ParamValue max;
            int32 unitId;
            int32 flags;
        };

        class IParamValueQueue : public FUnknown {
        public:
            virtual ParamID SMTG_STDCALL getParameterId() = 0;
            virtual int32 SMTG_STDCALL getPointCount() = 0;
            virtual tresult SMTG_STDCALL getPoint(int32 index, int32& sampleOffset, ParamValue& value) = 0;
            virtual tresult SMTG_STDCALL addPoint(int32 sampleOffset, ParamValue value, int32& index) = 0;
            static const TUID iid;
        };

        class IParameterChanges : public FUnknown {
        public:
            virtual int32 SMTG_STDCALL getParameterCount() = 0;
            virtual IParamValueQueue* SMTG_STDCALL getParameterData(int32 index) = 0;
            virtual IParamValueQueue* SMTG_STDCALL addParameterData(const ParamID& id, int32& index) = 0;
            static const TUID iid;
        };

        class IEditController : public FUnknown {
        public:
            virtual tresult SMTG_STDCALL setComponentState(void* state) = 0;
            virtual tresult SMTG_STDCALL setState(void* state) = 0;
            virtual tresult SMTG_STDCALL getState(void* state) = 0;
            virtual int32 SMTG_STDCALL getParameterCount() = 0;
            virtual tresult SMTG_STDCALL getParameterInfo(int32 paramIndex, ParameterInfo& info) = 0;
            virtual ParamValue SMTG_STDCALL getParamStringByValue(ParamID id, ParamValue valueNormalized, char16* string) = 0;
            virtual tresult SMTG_STDCALL getParamValueByString(ParamID id, char16* string, ParamValue& valueNormalized) = 0;
            virtual ParamValue SMTG_STDCALL normalizedParamToPlain(ParamID id, ParamValue valueNormalized) = 0;
            virtual ParamValue SMTG_STDCALL plainParamToNormalized(ParamID id, ParamValue plainValue) = 0;
            virtual ParamValue SMTG_STDCALL getParamNormalized(ParamID id) = 0;
            virtual tresult SMTG_STDCALL setParamNormalized(ParamID id, ParamValue value) = 0;
            virtual tresult SMTG_STDCALL setComponentHandler(void* handler) = 0;
            virtual void* SMTG_STDCALL createView(const char* name) = 0;
            static const TUID iid;
        };

        // IComponent
        class IComponent : public FUnknown {
        public:
            virtual tresult SMTG_STDCALL getControllerClassId(TUID classId) = 0;
            virtual tresult SMTG_STDCALL setIoMode(TIoMediaType level) = 0;
            virtual tresult SMTG_STDCALL getBusCount(TMediaType type, TBusDirection dir) = 0;
            virtual tresult SMTG_STDCALL getBusInfo(TMediaType type, TBusDirection dir, int32 index, void* busInfo) = 0; // BusInfo struct omitted
            virtual tresult SMTG_STDCALL getRoutingInfo(void* inInfo, void* outInfo) = 0;
            virtual tresult SMTG_STDCALL activateBus(TMediaType type, TBusDirection dir, int32 index, bool state) = 0;
            virtual tresult SMTG_STDCALL setActive(bool state) = 0;
            virtual tresult SMTG_STDCALL setState(void* state) = 0;
            virtual tresult SMTG_STDCALL getState(void* state) = 0;
            static const TUID iid;
        };

        // IAudioProcessor
        class IAudioProcessor : public FUnknown {
        public:
            virtual tresult SMTG_STDCALL setBusArrangements(uint64* inputs, int32 numIns, uint64* outputs, int32 numOuts) = 0;
            virtual tresult SMTG_STDCALL getBusArrangement(int32 busIndex, TBusDirection dir, uint64& arrangement) = 0;
            virtual tresult SMTG_STDCALL canProcessSampleSize(int32 symbolicSampleSize) = 0;
            virtual tresult SMTG_STDCALL getLatencySamples(int32& latency) = 0;
            virtual tresult SMTG_STDCALL setupProcessing(ProcessSetup& setup) = 0;
            virtual tresult SMTG_STDCALL setProcessing(bool state) = 0;
            virtual tresult SMTG_STDCALL process(ProcessData& data) = 0;
            virtual tresult SMTG_STDCALL getTailSamples(int32& tail) = 0;
            static const TUID iid;
        };
    }

    class IPluginFactory : public FUnknown {
    public:
        virtual tresult SMTG_STDCALL getFactoryInfo(void* info) = 0;
        virtual int32 SMTG_STDCALL countClasses() = 0;
        virtual tresult SMTG_STDCALL getClassInfo(int32 index, void* info) = 0;
        virtual tresult SMTG_STDCALL createInstance(const TUID cid, const TUID _iid, void** obj) = 0;
        static const TUID iid;
    };
}

extern "C" {
    SMTG_EXPORT Steinberg::IPluginFactory* SMTG_STDCALL GetPluginFactory();
}
