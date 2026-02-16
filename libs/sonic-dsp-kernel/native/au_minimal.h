#pragma once

#include <cstdint>

#if defined(__APPLE__)
#define AU_EXPORT __attribute__((visibility("default")))
#else
#define AU_EXPORT
#endif

typedef int32_t OSStatus;
typedef int32_t ComponentResult;
typedef uint32_t UInt32;
typedef int32_t SInt32;
typedef int16_t SInt16;
typedef double Float64;
typedef float Float32;
typedef uint64_t UInt64;
typedef uint8_t Byte;

// Basic Types
typedef UInt32 AudioUnitScope;
typedef UInt32 AudioUnitElement;
typedef UInt32 AudioUnitParameterID;
typedef Float32 AudioUnitParameterValue;

enum {
    noErr = 0,
    kAudioUnitErr_InvalidProperty = -10879,
    kAudioUnitErr_InvalidParameter = -10878,
    kAudioUnitErr_InvalidElement = -10877,
    kAudioUnitErr_NoConnection = -10876,
    kAudioUnitErr_FailedInitialization = -10875,
    kAudioUnitErr_TooManyFramesToProcess = -10874,
    kAudioUnitErr_InvalidFile = -10871,
    kAudioUnitErr_FormatNotSupported = -10868,
    kAudioUnitErr_Uninitialized = -10867,
    kAudioUnitErr_InvalidScope = -10866,
    kAudioUnitErr_PropertyNotWritable = -10865,
    kAudioUnitErr_CannotDoInCurrentContext = -10863,
    kAudioUnitErr_InvalidPropertyValue = -10851,
    kAudioUnitErr_PropertyNotInUse = -10850,
    kAudioUnitErr_Initialized = -10849,
    kAudioUnitErr_InvalidOfflineRender = -10848,
    kAudioUnitErr_Unauthorized = -10847,
};

// Scopes
enum {
    kAudioUnitScope_Global = 0,
    kAudioUnitScope_Input  = 1,
    kAudioUnitScope_Output = 2,
    kAudioUnitScope_Group  = 3,
    kAudioUnitScope_Part   = 4
};

// Properties
enum {
    kAudioUnitProperty_ClassInfo = 0,
    kAudioUnitProperty_MakeConnection = 1,
    kAudioUnitProperty_SampleRate = 2,
    kAudioUnitProperty_ParameterList = 3,
    kAudioUnitProperty_ParameterInfo = 4,
    kAudioUnitProperty_StreamFormat = 8,
    kAudioUnitProperty_MaximumFramesPerSlice = 14,
    kAudioUnitProperty_SetRenderCallback = 23,
    kAudioUnitProperty_FactoryPresets = 24,
    kAudioUnitProperty_RenderQuality = 26,
    kAudioUnitProperty_InPlaceProcessing = 29,
    kAudioUnitProperty_ElementName = 30,
    kAudioUnitProperty_SupportedNumChannels = 44,
    kAudioUnitProperty_WantsRenderThreadID = 45,
    kAudioUnitProperty_LastRenderError = 22
};

struct AURenderCallbackStruct {
    OSStatus (*inputProc)(void* inRefCon, AudioUnitRenderActionFlags* ioActionFlags, const AudioTimeStamp* inTimeStamp, UInt32 inBusNumber, UInt32 inNumberFrames, AudioBufferList* ioData);
    void* inputProcRefCon;
};

struct AudioUnitConnection {
    void* sourceAudioUnit;
    UInt32 sourceOutputNumber;
    UInt32 destInputNumber;
};

extern "C" {
    OSStatus AudioUnitRender(void* inUnit, AudioUnitRenderActionFlags* ioActionFlags, const AudioTimeStamp* inTimeStamp, UInt32 inOutputBusNumber, UInt32 inNumberFrames, AudioBufferList* ioData);
}

// Stream Description
struct AudioStreamBasicDescription {
    Float64 mSampleRate;
    UInt32  mFormatID;
    UInt32  mFormatFlags;
    UInt32  mBytesPerPacket;
    UInt32  mFramesPerPacket;
    UInt32  mBytesPerFrame;
    UInt32  mChannelsPerFrame;
    UInt32  mBitsPerChannel;
    UInt32  mReserved;
};

enum {
    kAudioFormatLinearPCM = 0x6C70636D, // 'lpcm'
    kAudioFormatFlagIsFloat = (1 << 0),
    kAudioFormatFlagIsBigEndian = (1 << 1),
    kAudioFormatFlagIsPacked = (1 << 3),
    kAudioFormatFlagIsNonInterleaved = (1 << 5)
};

// Buffers
struct AudioBuffer {
    UInt32 mNumberChannels;
    UInt32 mDataByteSize;
    void*  mData;
};

struct AudioBufferList {
    UInt32      mNumberBuffers;
    AudioBuffer mBuffers[1]; // variable length
};

struct AudioTimeStamp {
    Float64 mSampleTime;
    UInt64  mHostTime;
    Float64 mRateScalar;
    UInt64  mWordClockTime;
    void*   mSMPTETime;
    UInt32  mFlags;
    UInt32  mReserved;
};

enum {
    kAudioTimeStampSampleTimeValid = (1 << 0)
};

typedef UInt32 AudioUnitRenderActionFlags;

enum {
    kAudioUnitRenderAction_OutputIsSilence = (1 << 4)
};

// Selectors
enum {
    kAudioUnitInitializeSelect = 0x0001,
    kAudioUnitUninitializeSelect = 0x0002,
    kAudioUnitGetPropertyInfoSelect = 0x0003,
    kAudioUnitGetPropertySelect = 0x0004,
    kAudioUnitSetPropertySelect = 0x0005,
    kAudioUnitAddPropertyListenerSelect = 0x000A,
    kAudioUnitRemovePropertyListenerSelect = 0x000B,
    kAudioUnitRemovePropertyListenerWithUserDataSelect = 0x0012,
    kAudioUnitAddRenderNotifySelect = 0x000F,
    kAudioUnitRemoveRenderNotifySelect = 0x0010,
    kAudioUnitGetParameterSelect = 0x0006,
    kAudioUnitSetParameterSelect = 0x0007,
    kAudioUnitScheduleParametersSelect = 0x0011,
    kAudioUnitRenderSelect = 0x000E,
    kAudioUnitResetSelect = 0x0009
};

// Component Types
struct AudioComponentDescription {
    UInt32 componentType;
    UInt32 componentSubType;
    UInt32 componentManufacturer;
    UInt32 componentFlags;
    UInt32 componentFlagsMask;
};

// The plug-in interface
struct AudioComponentPlugInInterface {
    OSStatus (*Open)(void *self, void *mInstance);
    OSStatus (*Close)(void *self);
    void *   (*Lookup)(SInt16 selector);
    void *   (*GetScrap)(void *self);
};
