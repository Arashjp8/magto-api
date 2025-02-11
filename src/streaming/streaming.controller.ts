import {
    Controller,
    Get,
    InternalServerErrorException,
    Logger,
    Query,
    Req,
    Res,
} from "@nestjs/common";
import { Request, Response } from "express";
import { StreamingService } from "./streaming.service.js";

@Controller("streaming")
export class StreamingController {
    private logger = new Logger(StreamingController.name);

    constructor(private readonly streamingService: StreamingService) {}

    @Get()
    async streamVideo(
        @Query("magnet") magnet: string,
        @Res() res: Response,
        @Req() req: Request,
    ) {
        try {
            this.logger.log("Got request for magnet:", magnet);
            await this.streamingService.streamVideo(magnet, req, res);
        } catch (error: unknown) {
            if (error instanceof Error) {
                this.logger.error(`Streaming failed: ${error.message}`);
                throw new InternalServerErrorException(error.message);
            }
        }
    }
}
