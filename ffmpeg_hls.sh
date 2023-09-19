#!/bin/bash

# Check if the required tools are installed
if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is not installed. Please install it and try again."
    exit 1
fi

if ! command -v ffprobe &> /dev/null; then
    echo "Error: ffprobe is not installed. Please install it and try again."
    exit 1
fi

if ! command -v jq &> /dev/null; then
    echo "Error: jq is not installed. Please install it and try again."
    exit 1
fi

# Enable debugging mode to print each command
#set -x

# Set the input directory from a user-defined variable
input_dir="$1"

# Set the HLS segment duration (default to 30 seconds)
hls_time=30

# JSON file to store the information
json_file="$input_dir/output.json"

# Initialize an empty JSON array
echo "[]" > "$json_file"

# Function to execute the ffmpeg command
run_ffmpeg_command() {
    local -a ffmpeg_command=("$@")
    "${ffmpeg_command[@]}"
}

# Check if the input directory exists
if [ ! -d "$input_dir" ]; then
    echo "Input directory '$input_dir' does not exist."
    exit 1
fi

# Iterate over .aac files in the input directory
for aac_file in "$input_dir"/*.aac; do
    if [ -e "$aac_file" ]; then
        # Extract the filename (without extension) from the aac file
        filename=$(basename -- "$aac_file")
        filename_noext="${filename%.*}"

        # Get the file creation date (mtime)
        mtime=$(date -r "$aac_file" "+%Y-%m-%d %H:%M:%S")

        # Get the play duration using ffprobe
        duration=$(ffprobe -i "$aac_file" -show_entries format=duration -v quiet -of csv="p=0")
        
        # Add the information to the JSON file
        jq -n --arg name "$filename" --arg mtime "$mtime" --arg duration "$duration" \
            '{name: $name, mtime: $mtime, duration: $duration}' | \
            jq -s ". + [.] | .[0] + .[1][]" >> "$json_file"
        
        # Check if the corresponding folder exists in the "hls" subfolder
        hls_folder="$input_dir/hls/$filename_noext"
        if [ -d "$hls_folder" ]; then
            echo "Skipping '$filename'. HLS folder already exists."
        else
            # Create the HLS folder
            mkdir -p "$hls_folder"
            
            # Define the ffmpeg command as an array
            ffmpeg_command=("ffmpeg" "-loglevel" "error" "-i" "$aac_file" "-c:a" "copy" "-strict" "experimental" "-f" "hls" "-hls_time" "$hls_time" "-hls_list_size" "0" "$hls_folder/output.m3u8")
            
            # Execute the ffmpeg command
            echo "Converting '$filename' to HLS with segment duration of $hls_time seconds..."
            run_ffmpeg_command "${ffmpeg_command[@]}"
            result=$?
            if [ $result -eq 0 ]; then
                echo "Conversion successful for '$filename'."
            else
                echo "Error converting '$filename'. Aborting."
                exit 1
            fi
        fi
    fi
done

echo "All conversions completed."
