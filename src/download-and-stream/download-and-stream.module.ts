import { Module } from "@nestjs/common";
import { DownloadAndStreamService } from "./download-and-stream.service";
import { DownloadAndStreamController } from "./download-and-stream.controller";
import { UrlShortenerService } from "src/url-shortener/url-shortener.service";

@Module({
  controllers: [DownloadAndStreamController],
  providers: [DownloadAndStreamService, UrlShortenerService],
})
export class DownloadAndStreamModule {}
