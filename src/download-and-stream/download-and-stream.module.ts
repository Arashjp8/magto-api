import { Module } from "@nestjs/common";
import { DownloadAndStreamService } from "./download-and-stream.service";
import { DownloadAndStreamController } from "./download-and-stream.controller";
import { UrlShortenerService } from "src/url-shortener/url-shortener.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MagnetMappings } from "src/url-shortener/entities/magnet-mappings.entity";

@Module({
    imports: [TypeOrmModule.forFeature([MagnetMappings])],
    controllers: [DownloadAndStreamController],
    providers: [DownloadAndStreamService, UrlShortenerService],
})
export class DownloadAndStreamModule {}
