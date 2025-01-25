import { Module } from "@nestjs/common";
import { DownloadAndStreamService } from "./download-and-stream.service";
import { DownloadAndStreamController } from "./download-and-stream.controller";

@Module({
  controllers: [DownloadAndStreamController],
  providers: [DownloadAndStreamService],
})
export class DownloadAndStreamModule {}
