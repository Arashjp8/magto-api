import { Module } from "@nestjs/common";
import { StreamingService } from "./streaming.service.js";
import { StreamingController } from "./streaming.controller.js";
import { VideoProcessingService } from "./video-processing/video-processing.service.js";

@Module({
    controllers: [StreamingController],
    providers: [StreamingService, VideoProcessingService],
})
export class StreamingModule {}
