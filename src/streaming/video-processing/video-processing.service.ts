import { Injectable, Logger } from "@nestjs/common";
import { spawn } from "child_process";
import { createWriteStream, promises as fsPromises } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { FFprobeData } from "./ffprobe.interface.js";
import { VIDEOPROC_CONSTS } from "./video-processing.constants.js";
import { IVideoProcessing } from "./video-processing.interface.js";
import { PassThrough } from "stream";

@Injectable()
export class VideoProcessingService implements IVideoProcessing {
    private readonly logger = new Logger(VideoProcessingService.name);

    private async getMetadataFromFile(
        videoFilePath: string,
    ): Promise<FFprobeData> {
        this.logger.debug("Running ffprobe on temporary file:", videoFilePath);
        return new Promise((resolve, reject) => {
            const ffprobeCmd = spawn("ffprobe", [
                ...VIDEOPROC_CONSTS.FFPROBE.DEFAULT_ARGS,
                videoFilePath,
            ]);

            let metadataOutput = "";
            ffprobeCmd.stdout.on("data", (data) => {
                metadataOutput += data.toString();
                this.logger.debug("ffprobe stdout data:", data.toString());
            });

            ffprobeCmd.stderr.on("data", (data) => {
                this.logger.error(
                    VIDEOPROC_CONSTS.FFPROBE.LOGS.FFPROBE_STDERR,
                    data.toString(),
                );
                reject(new Error(`ffprobe error: ${data.toString()}`));
            });

            ffprobeCmd.on("close", async (code: number) => {
                if (code === 0) {
                    try {
                        const metadata = JSON.parse(
                            metadataOutput,
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
                    const errorMsg =
                        VIDEOPROC_CONSTS.FFPROBE.LOGS.FFPROBE_EXIT_ERROR(code);
                    this.logger.error(errorMsg);
                    reject(new Error(errorMsg));
                }
            });
        });
    }

    public async getMetadata(
        inputStream: NodeJS.ReadableStream,
    ): Promise<FFprobeData> {
        const tempVideoPath = join(
            tmpdir(),
            `video-${Date.now()}-${Math.random()}.tmp`,
        );
        this.logger.debug(
            "Writing input stream for metadata extraction to",
            tempVideoPath,
        );
        await new Promise<void>((resolve, reject) => {
            const writeStream = createWriteStream(tempVideoPath);
            inputStream.pipe(writeStream);
            writeStream.on("finish", resolve);
            writeStream.on("error", reject);
        });
        const metadata = await this.getMetadataFromFile(tempVideoPath);
        await fsPromises.unlink(tempVideoPath);
        return metadata;
    }

    async buildConversionArgs(
        videoFilePath: string,
        start: number,
        end: number,
    ): Promise<string[]> {
        this.logger.log(
            VIDEOPROC_CONSTS.FFMPEG.LOGS.METADATA_EXTRACTION_STARTED,
        );

        try {
            const metadata = await this.getMetadataFromFile(videoFilePath);
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

            this.logger.debug("videoStream.codec_name", videoStream.codec_name);
            this.logger.debug("audioStream.codec_name", audioStream.codec_name);
            switch (videoStream.codec_name) {
                case "h264":
                    args.push("-c:v", "copy");
                    break;
                case "hevc":
                    args.push("-c:v", "libx264");
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
        startTimeMs: number,
        endTimeMs: number,
    ): Promise<NodeJS.ReadableStream> {
        this.logger.debug(
            "Duplicating input stream for metadata and processing.",
        );

        const stream1 = new PassThrough();
        const stream2 = new PassThrough();

        inputStream.on("data", (chunk) => {
            stream1.write(chunk);
            stream2.write(chunk);
        });

        inputStream.on("end", () => {
            stream1.end();
            stream2.end();
        });

        inputStream.on("error", (err) => {
            stream1.destroy(err);
            stream2.destroy(err);
        });

        const tempVideoPath = join(
            tmpdir(),
            `video-${Date.now()}-${Math.random()}.tmp`,
        );
        this.logger.debug("Writing input stream to", tempVideoPath);

        await new Promise<void>((resolve, reject) => {
            const writeStream = createWriteStream(tempVideoPath);
            stream1.pipe(writeStream);
            writeStream.on("finish", resolve);
            writeStream.on("error", reject);
        });

        this.logger.debug("Finished writing input stream.");

        const ffmpegArgs = await this.buildConversionArgs(
            tempVideoPath,
            startTimeMs,
            endTimeMs,
        );

        const ffmpegCmd = spawn("ffmpeg", ffmpegArgs);

        stream2.pipe(ffmpegCmd.stdin);

        ffmpegCmd.on("close", async () => {
            try {
                await fsPromises.unlink(tempVideoPath);
                this.logger.debug(
                    "Deleted temporary video file:",
                    tempVideoPath,
                );
            } catch (err) {
                this.logger.error("Error deleting temp video file:", err);
            }
        });

        ffmpegCmd.stderr.on("data", (data) => {
            this.logger.debug("ffmpeg stderr:", data.toString());
        });

        return ffmpegCmd.stdout;
    }
}
