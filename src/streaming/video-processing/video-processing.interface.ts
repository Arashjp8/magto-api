import { FFprobeData } from "./ffprobe.interface.js";
import { ChildProcess } from "child_process";

export interface IVideoProcessing {
    /**
     * Extracts metadata from a video stream using FFprobe.
     * The metadata is saved to a specified file before being read and parsed.
     *
     * @param inputStream - The video stream to analyze.
     * @param outputFilePath - The file path for storing metadata.
     * @returns A promise that resolves with the parsed FFprobeData.
     */
    getMetadata(
        inputStream: NodeJS.ReadableStream,
        outputFilePath: string,
    ): Promise<FFprobeData>;

    /**
     * Generates a list of FFmpeg arguments for video conversion.
     * It selects the appropriate video and audio codecs based on metadata and
     * applies a time range for the output segment.
     *
     * @param metadata - The metadata extracted from FFprobe.
     * @param start - The start time of the segment in milliseconds.
     * @param end - The end time of the segment in milliseconds.
     * @returns A promise that resolves with an array of FFmpeg arguments.
     */
    buildConversionArgs(
        metadata: FFprobeData,
        start: number,
        end: number,
    ): Promise<string[]>;

    /**
     * Converts a video stream into a processed output stream using FFmpeg.
     *
     * The method executes FFmpeg as a child process, passing the generated arguments
     * and piping the input stream for processing. The resulting output stream is
     * returned along with the process reference.
     *
     * @param inputStream - The input video stream.
     * @param metadata - The extracted metadata used for processing.
     * @param startTimeMs - The start time of the segment in milliseconds.
     * @param endTimeMs - The end time of the segment in milliseconds.
     * @returns A promise resolving with an object containing the processed video stream and the FFmpeg process.
     */
    convertVideo(
        inputStream: NodeJS.ReadableStream,
        metadata: FFprobeData,
        startTimeMs: number,
        endTimeMs: number,
    ): Promise<{ stream: NodeJS.ReadableStream; process: ChildProcess }>;
}
