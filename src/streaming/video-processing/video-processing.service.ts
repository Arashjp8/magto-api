import { Injectable, Logger } from "@nestjs/common";
import { ChildProcess, spawn } from "child_process";
import { pipeline } from "stream";
import { promisify } from "util";
import { FFprobeData } from "./ffprobe.interface.js";
import { VIDEOPROC_CONSTS } from "./video-processing.constants.js";
import { IVideoProcessing } from "./video-processing.interface.js";

@Injectable()
export class VideoProcessingService implements IVideoProcessing {
    private readonly logger = new Logger(VideoProcessingService.name);
    private readonly pipelineAsync = promisify(pipeline);

    async getMetadata(
        inputStream: NodeJS.ReadableStream,
    ): Promise<FFprobeData> {
        return new Promise((resolve, reject) => {
            this.logger.debug("Getting metadata from inputStream");

            const ffprobeArgs = VIDEOPROC_CONSTS.FFPROBE.DEFAULT_ARGS;
            const ffprobeCmd = spawn("ffprobe", [
                ...ffprobeArgs,
                "-i",
                "pipe:0",
            ]);

            let metadata = "";
            let ffprobeExited = false;

            try {
                this.pipelineAsync(inputStream, ffprobeCmd.stdin).catch(
                    (err) => {
                        if (!ffprobeExited) {
                            this.logger.error(
                                "Error piping input to ffprobe:",
                                err,
                            );
                            reject(err);
                        }
                    },
                );

                ffprobeCmd.stdout.on("data", (chunk) => {
                    metadata += chunk.toString();
                });

                ffprobeCmd.stderr.on("data", (data) => {
                    this.logger.error(`FFprobe stderr: ${data.toString()}`);
                });

                ffprobeCmd.on("error", (err) => {
                    this.logger.error("FFprobe process error:", err);
                    reject(err);
                });

                ffprobeCmd.on("close", (code) => {
                    ffprobeExited = true;

                    if (code !== 0) {
                        this.logger.error(`FFprobe exited with code ${code}`);
                        reject(new Error(`FFprobe exited with code ${code}`));
                        return;
                    }

                    this.logger.log("FFprobe stream ended.");

                    // properly close inputStream to avoid EPIPE
                    if (typeof inputStream.unpipe === "function") {
                        inputStream.unpipe();
                    }
                    if (typeof inputStream.pause === "function") {
                        inputStream.pause();
                    }

                    try {
                        const parsedMetadata = JSON.parse(metadata);
                        resolve(parsedMetadata);
                    } catch (err) {
                        this.logger.error("Error parsing metadata:", err);
                        reject(err);
                    }
                });
            } catch (err) {
                this.logger.error("Unexpected error in getMetadata:", err);
                reject(err);
            }
        });
    }

    async buildConversionArgs(
        metadata: FFprobeData,
        start: number,
        end: number,
    ): Promise<string[]> {
        this.logger.log("generating ffmpeg args started.");

        try {
            this.logger.log(
                VIDEOPROC_CONSTS.FFMPEG.LOGS.STREAM_SELECTION_STARTED,
            );

            const videoStream = metadata.streams.find(
                (stream) => stream.codec_type === "video",
            );
            const audioStream = metadata.streams.find(
                (stream) => stream.codec_type === "audio",
            );

            if (!videoStream || !audioStream) {
                this.logger.error(
                    VIDEOPROC_CONSTS.FFMPEG.LOGS.STREAM_SELECTION_FAILED,
                );
                throw new Error("No video or audio stream found.");
            }

            this.logger.log(
                VIDEOPROC_CONSTS.FFMPEG.LOGS.STREAM_SELECTION_SUCCESS,
            );
            this.logger.debug("videoStream.codec_name", videoStream.codec_name);
            this.logger.debug("audioStream.codec_name", audioStream.codec_name);

            const args = VIDEOPROC_CONSTS.FFMPEG.GET_DEFAULT_ARGS(start, end);

            switch (videoStream.codec_name) {
                case "h264":
                    args.push("-c:v", "copy");
                    break;
                default:
                    args.push("-c:v", "libx264");
                    break;
            }

            switch (audioStream.codec_name) {
                case "aac":
                    args.push("-c:a", "copy");
                    break;
                default:
                    args.push("-c:a", "aac");
                    break;
            }

            args.push("-f", "mp4", "pipe:1");

            this.logger.log(
                VIDEOPROC_CONSTS.FFMPEG.LOGS.ARGS_GENERATION_SUCCESS(args),
            );

            return args;
        } catch (error) {
            this.logger.error(
                VIDEOPROC_CONSTS.FFMPEG.LOGS.METADATA_EXTRACTION_FAILED,
                error,
            );
            throw error;
        }
    }

    async convertVideo(
        inputStream: NodeJS.ReadableStream,
        metadata: FFprobeData,
        startTimeMs: number,
        endTimeMs: number,
    ): Promise<{ stream: NodeJS.ReadableStream; process: ChildProcess }> {
        const ffmpegArgs = await this.buildConversionArgs(
            metadata,
            startTimeMs,
            endTimeMs,
        );

        return new Promise((resolve, reject) => {
            const ffmpegCmd = spawn("ffmpeg", ffmpegArgs);

            ffmpegCmd.on("error", (err) => {
                this.logger.error("FFmpeg Error:", err);
                reject(err);
            });

            ffmpegCmd.stderr.on("data", (data) => {
                this.logger.debug("FFmpeg stderr:", data);
            });

            this.pipelineAsync(inputStream, ffmpegCmd.stdin)
                .then(() => this.logger.debug("Input stream piped to ffmpeg"))
                .catch((err) => {
                    this.logger.error("Pipeline to ffmpeg stdin failed:", err);
                    reject(err);
                });

            resolve({ stream: ffmpegCmd.stdout, process: ffmpegCmd });
        });
    }
}
