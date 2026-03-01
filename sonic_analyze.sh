#!/data/data/com.termux/files/usr/bin/bash

TARGET_DIR="${1:-.}"
OUTPUT_FILE="audio_analysis_$(date +%Y%m%d_%H%M).csv"

# CSV Header
HEADER="Filename,Duration_Sec,Sample_Rate,Channels,Bit_Depth,Integrated_LUFS,LRA,True_Peak_dB,RMS_Level_dB,Crest_Factor,DC_Offset"
echo "$HEADER" > "$OUTPUT_FILE"

echo "Starting Deep Sonic Analysis..."
echo "Outputting to: $OUTPUT_FILE"

for file in "$TARGET_DIR"/*.{wav,mp3,flac,m4a,ogg}; do
    [ -e "$file" ] || continue
    echo "Analyzing: $(basename "$file")..."

    # 1. Metadata via ffprobe (Fast)
    duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$file")
    sample_rate=$(ffprobe -v error -show_entries stream=sample_rate -of default=noprint_wrappers=1:nokey=1 "$file" | head -n 1)
    channels=$(ffprobe -v error -show_entries stream=channels -of default=noprint_wrappers=1:nokey=1 "$file" | head -n 1)
    bit_depth=$(ffprobe -v error -show_entries stream=bits_per_sample -of default=noprint_wrappers=1:nokey=1 "$file" | head -n 1)
    
    # Handle cases where bit_depth is N/A (like MP3s)
    [[ "$bit_depth" == "N/A" || -z "$bit_depth" ]] && bit_depth="Compressed"

    # 2. Signal Analysis via ffmpeg (Deep Scan)
    # We combine ebur128 (Loudness) and astats (DC, Crest, RMS) in one pass
    stats=$(ffmpeg -hide_banner -i "$file" -af "ebur128=peak=true,astats=metadata=1" -f null - 2>&1)

    # ebur128 uses the Summary block at the end (no [Parsed] prefix)
    i_lufs=$(echo "$stats" | grep -v "\[Parsed" | grep "I:" | head -n 1 | awk '{print $2}')
    lra=$(echo "$stats" | grep -v "\[Parsed" | grep "LRA:" | head -n 1 | awk '{print $2}')
    tp=$(echo "$stats" | grep -v "\[Parsed" | grep "Peak:" | head -n 1 | awk '{print $2}')
    
    # astats values exist only in [Parsed] lines
    # We take the last occurrence (Overall) and the last column
    rms=$(echo "$stats" | grep "RMS level dB:" | tail -n 1 | awk '{print $NF}')
    crest=$(echo "$stats" | grep "Crest factor:" | tail -n 1 | awk '{print $NF}')
    dc_offset=$(echo "$stats" | grep "DC offset:" | tail -n 1 | awk '{print $NF}')

    # Append to CSV
    echo "$(basename "$file"),$duration,$sample_rate,$channels,$bit_depth,$i_lufs,$lra,$tp,$rms,$crest,$dc_offset" >> "$OUTPUT_FILE"
done

echo "--------------------------------------"
echo "Analysis Complete."


