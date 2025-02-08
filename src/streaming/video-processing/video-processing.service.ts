import { Injectable, Logger } from "@nestjs/common";
import { IVideoProcessing } from "./video-processing.interface.js";
import { FFprobeData } from "./ffprobe.interface.js";
import { Readable } from "stream";
import { spawn } from "child_process";
import { VIDEOPROC_CONSTS } from "./video-processing.constants.js";

@Injectable()
export class VideoProcessingService implements IVideoProcessing {
    private readonly logger = new Logger(VideoProcessingService.name);

    getMetadata(inputStream: NodeJS.ReadableStream): Promise<FFprobeData> {
        return new Promise((resolve, reject) => {
            const ffprobeCmd = spawn("ffprobe", [
                ...VIDEOPROC_CONSTS.FFPROBE.DEFAULT_ARGS,
                "pipe:0",
            ]);

            let metadataOuput = "";
            ffprobeCmd.stdout.on("data", (data) => {
                metadataOuput += data.toString();
            });

            ffprobeCmd.on("close", (code: number) => {
                if (code === 0) {
                    try {
                        const metadata = JSON.parse(
                            metadataOuput,
                        ) as FFprobeData;
                        this.logger.log(
                            VIDEOPROC_CONSTS.FFPROBE.LOGS
                                .METADATA_EXTRACTION_SUCCESS,
                        );
                        resolve(metadata);
                    } catch (error) {
                        this.logger.error(
                            VIDEOPROC_CONSTS.FFPROBE.LOGS
                                .METADATA_PARSING_ERROR,
                            error,
                        );
                        reject(
                            new Error(
                                VIDEOPROC_CONSTS.FFPROBE.LOGS.METADATA_PARSING_ERROR,
                            ),
                        );
                    }
                } else {
                    this.logger.error(
                        VIDEOPROC_CONSTS.FFPROBE.LOGS.FFPROBE_EXIT_ERROR(code),
                    );
                    reject(
                        new Error(
                            VIDEOPROC_CONSTS.FFPROBE.LOGS.FFPROBE_EXIT_ERROR(
                                code,
                            ),
                        ),
                    );
                }
            });

            ffprobeCmd.stderr.on("data", (data) => {
                this.logger.error(
                    VIDEOPROC_CONSTS.FFPROBE.LOGS.FFPROBE_STDERR,
                    data.toString(),
                );
                reject(new Error(`ffprobe error: ${data.toString()}`));
            });

            inputStream.pipe(ffprobeCmd.stdin);
        });
    }

    async buildConversionArgs(
        inputStream: NodeJS.ReadableStream,
        start: number,
        end: number,
    ): Promise<string[]> {
        this.logger.log(
            VIDEOPROC_CONSTS.FFMPEG.LOGS.METADATA_EXTRACTION_STARTED,
        );

        try {
            const metadata = await this.getMetadata(inputStream);
            this.logger.log(
                VIDEOPROC_CONSTS.FFMPEG.LOGS.METADATA_EXTRACTION_SUCCESS,
            );

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

            const args = VIDEOPROC_CONSTS.FFMPEG.GET_DEFAULT_ARGS(start, end);

            // Video
            // x265 => codec_name = hevc
            // x264 => codec_name = h264
            switch (videoStream.codec_type) {
                case "hevc":
                case "h264":
                    args.push("-c:v", "libx264");
                    break;

                // maybe more codec_types for later?

                default:
                    args.push("-c:v", "copy");
                    break;
            }

            // Audio
            // aac => codec_name = aac
            switch (audioStream.codec_type) {
                case "aac":
                    args.push("-c:v", "copy");
                    break;

                // maybe more codec_types for later?

                default:
                    args.push("-c:v", "aac");
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

    // NOTE: I don't trust Readable used `NodeJS.ReadableStream` before
    // change it if needed

    async convertVideo(
        inputStream: NodeJS.ReadableStream,
        startTimeMs: number,
        endTimeMs: number,
    ): Promise<Readable> {
        const ffmpegArgs = await this.buildConversionArgs(
            inputStream,
            startTimeMs,
            endTimeMs,
        );

        const ffmpegCmd = spawn("ffmpeg", ffmpegArgs);
        inputStream.pipe(ffmpegCmd.stdin);

        return ffmpegCmd.stdout;
    }
}
