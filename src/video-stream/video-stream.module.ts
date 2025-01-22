import { Module } from "@nestjs/common";
import { VideoStreamService } from "./video-stream.service";
import { VideoStreamController } from "./video-stream.controller";

@Module({
  controllers: [VideoStreamController],
  providers: [VideoStreamService],
})
export class VideoStreamModule {}
