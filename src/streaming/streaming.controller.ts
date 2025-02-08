import {
    BadRequestException,
    Controller,
    Get,
    Query,
    Req,
    Res,
} from "@nestjs/common";
import { StreamingService } from "./streaming.service.js";
import { Request, Response } from "express";

@Controller("streaming")
export class StreamingController {
    constructor(private readonly streamingService: StreamingService) {}

    @Get()
    streamVideo(
        @Query("magnet") magnet: string,
        @Res() res: Response,
        @Req() req: Request,
    ) {
        if (!magnet) {
            throw new BadRequestException("Magnet URI required");
        }
    }
}
