import { FFprobeData } from "./ffprobe.interface.js";

export interface IVideoProcessing {
    /**
     * Extracts metadata from a video stream by first writing it to a temporary file
     * and then analyzing it using FFprobe.
     *
     * This approach ensures that metadata can be extracted even from streaming sources.
     *
     * @param inputStream - The video stream to analyze.
     * @returns A promise that resolves with the parsed FFprobeData metadata.
     */
    getMetadata(inputStream: NodeJS.ReadableStream): Promise<FFprobeData>;

    /**
     * Generates a list of FFmpeg arguments to convert a video file,
     * selecting the appropriate video and audio codecs based on the file's metadata.
     *
     * @param videoFilePath - The path to the temporary video file.
     * @param start - The start time of the desired segment in milliseconds.
     * @param end - The end time of the desired segment in milliseconds.
     * @returns A promise that resolves with an array of FFmpeg arguments.
     */
    buildConversionArgs(
        videoFilePath: string,
        start: number,
        end: number,
    ): Promise<string[]>;

    /**
     * Converts a video stream into a processed output stream using FFmpeg.
     *
     * The input stream is duplicated so that one copy is written to a temporary file
     * for metadata extraction, while the other is directly piped into FFmpeg for processing.
     *
     * @param inputStream - The raw input video stream.
     * @param startTimeMs - The start time of the segment in milliseconds.
     * @param endTimeMs - The end time of the segment in milliseconds.
     * @returns A promise that resolves with the processed (converted) video stream.
     */
    convertVideo(
        inputStream: NodeJS.ReadableStream,
        startTimeMs: number,
        endTimeMs: number,
    ): Promise<NodeJS.ReadableStream>;
}
