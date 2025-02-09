import {
    BadRequestException,
    Controller,
    Get,
    HttpException,
    Logger,
    Query,
    Req,
    Res,
} from "@nestjs/common";
import { Request, Response } from "express";
import { VideoProcessingService } from "./video-processing/video-processing.service.js";
import { StreamEngineService } from "../torrent/stream-engine/stream-engine.service.js";

@Controller("streaming")
export class StreamingController {
    private logger = new Logger(StreamingController.name);

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
            throw new HttpException("Invalid range", 416);
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

    @Get()
    async streamVideo(
        @Query("magnet") magnet: string,
        @Res() res: Response,
        @Req() req: Request,
    ) {
        try {
            if (!magnet) {
                throw new BadRequestException("Magnet URI required");
            }

            const file = await this.streamEngine.findPlayableFile(magnet);
            this.logger.debug("controller file:", file);

            const range = req.headers.range;
            this.logger.debug("controller range:", range);
            const { start, end, contentLength } = this.parseRangeHeader(
                range,
                file.length,
            );
            this.logger.debug("controller start:", start);
            this.logger.debug("controller end:", end);
            this.logger.debug("controller contentLength:", contentLength);

            const metadataStream = this.streamEngine.getStream(file);
            const metadata =
                await this.videoProcessing.getMetadata(metadataStream);
            this.logger.debug("controller metadata:", metadata);
            const durationMs = metadata.format.duration! * 1000;
            this.logger.debug("controller durationMs:", durationMs);

            const { startTimeMs, endTimeMs } = this.calculateTimeRange(
                start,
                end,
                file.length,
                durationMs,
            );
            this.logger.debug("controller startTimeMs:", startTimeMs);
            this.logger.debug("controller endTimeMs:", endTimeMs);

            const processingStream = this.streamEngine.getStream(file);

            const convertedStream = await this.videoProcessing.convertVideo(
                processingStream,
                startTimeMs,
                endTimeMs,
            );

            res.writeHead(206, {
                "Content-Range": `bytes ${start}-${end}/${file.length}`,
                "Accept-Ranges": "bytes",
                "Content-Type": "video/mp4",
            });

            convertedStream.pipe(res);
        } catch (error: unknown) {
            if (error instanceof Error) {
                this.logger.error(`Streaming failed: ${error.message}`);
                throw new HttpException(error.message, 500);
            }
        }
    }
}
