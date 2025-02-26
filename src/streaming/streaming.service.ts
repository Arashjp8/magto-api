import { Injectable, Logger } from "@nestjs/common";
import { Request, Response } from "express";
import { pipeline } from "stream";
import { StreamEngineService } from "../torrent/stream-engine/stream-engine.service.js";
import { VideoProcessingService } from "./video-processing/video-processing.service.js";

@Injectable()
export class StreamingService {
    private logger = new Logger(StreamingService.name);

    constructor(
        private readonly streamEngine: StreamEngineService,
        private readonly videoProcessing: VideoProcessingService,
    ) {}

    private parseRangeHeader(range: string | undefined, fileSize: number) {
        if (!range) {
            return { start: 0, end: fileSize - 1, contentLength: fileSize };
        }

        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const contentLength = end - start + 1;

        if (
            isNaN(start) ||
            isNaN(end) ||
            start >= fileSize ||
            end >= fileSize
        ) {
            throw new Error("Invalid range");
        }

        return { start, end, contentLength };
    }

    private calculateTimeRange(
        startByte: number,
        endByte: number,
        fileSize: number,
        durationMs: number,
    ) {
        const bytesPerMs = fileSize / durationMs;
        return {
            startTimeMs: Math.floor(startByte / bytesPerMs),
            endTimeMs: Math.ceil(endByte / bytesPerMs),
        };
    }

    async streamVideo(magnet: string, req: Request, res: Response) {
        if (!magnet) {
            throw new Error("Magnet URI required");
        }

        const file = await this.streamEngine.findPlayableFile(magnet);

        const range = req.headers.range;

        const { start, end, contentLength } = this.parseRangeHeader(
            range,
            file.length,
        );

        res.writeHead(206, {
            "Content-Range": `bytes ${start}-${end}/${file.length}`,
            "Accept-Ranges": "bytes",
            "Content-Length": contentLength,
            "Content-Type": "video/mp4",
        });

        const metadataStream = this.streamEngine.getStream(file);

        const metadata = await this.videoProcessing.getMetadata(metadataStream);

        const durationMs = metadata.format.duration! * 1000;

        const { startTimeMs, endTimeMs } = this.calculateTimeRange(
            start,
            end,
            file.length,
            durationMs,
        );

        const processingStream = this.streamEngine.getStream(file);
        const { stream: convertedStream, process: ffmpegProcess } =
            await this.videoProcessing.convertVideo(
                processingStream,
                metadata,
                startTimeMs,
                endTimeMs,
            );

        convertedStream.on("error", (err) => {
            if (err.code === "EPIPE") {
                this.logger.debug("Client disconnected, EPIPE error");
            } else {
                this.logger.error("Converted stream error:", err);
                res.destroy(err);
            }
        });

        convertedStream.on("end", () => {
            this.logger.log("Streaming completed.");
        });

        if (!res.writableEnded) {
            pipeline(convertedStream, res, (err) => {
                if (err) {
                    if (err.code === "EPIPE") {
                        this.logger.error(
                            "Pipe error (EPIPE), likely due to premature stream termination.",
                        );
                    } else {
                        this.logger.error("FFmpeg output stream error:", err);
                    }
                    res.destroy(err);
                }
            });
        } else {
            this.logger.warn(
                "Response has already been closed, skipping streaming.",
            );
        }

        res.on("close", () => {
            this.logger.log("Response closed prematurely.");
            ffmpegProcess.kill("SIGTERM");
        });

        res.on("error", (err) => {
            this.logger.error("Response error:", err);
        });
    }
}
