import { Readable } from "stream";
import { FFprobeData } from "./ffprobe.interface.js";

export interface IVideoProcessing {
    /**
     * Extracts metadata from a video stream using FFprobe.
     *
     * Instead of reading from a file on disk, this method accepts a Readable stream
     * (for example, one provided by the WebTorrent engine) and pipes it into FFprobe.
     *
     * @param inputStream - The video stream to analyze.
     * @returns A promise that resolves with the parsed FFprobeData metadata.
     */
    getMetadata(inputStream: NodeJS.ReadableStream): Promise<FFprobeData>;

    /**
     * Builds an array of FFmpeg arguments based on the file's metadata.
     * This determines whether to copy or transcode streams.
     * @param inputStream - The video stream to convert.
     * @param start - Start time of the chunk in milliseconds.
     * @param end - End time of the chunk in milliseconds.
     * @returns A promise that resolves with an array of FFmpeg arguments.
     */
    buildConversionArgs(
        inputStream: NodeJS.ReadableStream,
        start: number,
        end: number,
    ): Promise<string[]>;

    /**
     * Converts a video stream using FFmpeg based on the conversion arguments
     * determined from the file's metadata.
     * @param inputStream - The raw input video stream.
     * @param startTimeMs - The end time in milliseconds.
     * @param endTimeMs - The end time in milliseconds.
     * @returns A promise that resolves with the processed (converted) video stream.
     */
    convertVideo(
        inputStream: NodeJS.ReadableStream,
        startTimeMs: number,
        endTimeMs: number,
    ): Promise<Readable>;
}
