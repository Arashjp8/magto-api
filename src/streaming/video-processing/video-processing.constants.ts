export const VIDEOPROC_CONSTS = {
    FFPROBE: {
        DEFAULT_ARGS: [
            "-v",
            "quiet",
            "-print_format",
            "json",
            "-show_streams",
            "-show_format",
        ],

        LOGS: {
            METADATA_EXTRACTION_SUCCESS:
                "Successfully extracted video metadata.",
            METADATA_PARSING_ERROR: "Error parsing ffprobe output:",
            FFPROBE_EXIT_ERROR: (code: number) =>
                `ffprobe failed with code: ${code}`,
            FFPROBE_STDERR: "ffprobe stderr:",
        } as const,
    },

    FFMPEG: {
        GET_DEFAULT_ARGS: (start: number, end: number) => [
            "-i",
            "pipe:0",
            "-ss",
            (start / 1000).toString(), // start time in seconds
            "-t",
            ((end - start) / 1000).toString(), // duration in seconds
            "-movflags",
            "frag_keyframe+empty_moov+default_base_moof", // optimize for streaming
            "-preset",
            "ultrafast", // fast encoding
        ],

        LOGS: {
            METADATA_EXTRACTION_STARTED: "Starting metadata extraction...",
            METADATA_EXTRACTION_SUCCESS: "Successfully extracted metadata.",
            METADATA_EXTRACTION_FAILED: "Failed to extract metadata.",

            STREAM_SELECTION_STARTED: "Selecting video and audio streams...",
            STREAM_SELECTION_FAILED: "No valid video or audio stream found.",
            STREAM_SELECTION_SUCCESS:
                "Successfully selected video and audio streams.",

            VIDEO_CODEC_CONVERSION: (codec: string) =>
                `Converting video codec from ${codec} to libx264.`,
            VIDEO_CODEC_COPY: (codec: string) =>
                `Copying video codec: ${codec}. No conversion needed.`,

            AUDIO_CODEC_CONVERSION: (codec: string) =>
                `Converting audio codec from ${codec} to AAC.`,
            AUDIO_CODEC_COPY: (codec: string) =>
                `Copying audio codec: ${codec}. No conversion needed.`,

            ARGS_GENERATION_SUCCESS: (args: string[]) =>
                `Generated FFmpeg arguments: ${args.join(" ")}`,
        } as const,
    },
};
