import { Module } from "@nestjs/common";
import { MovieTorrentService } from "./movie-torrent.service";
import { MovieTorrentController } from "./movie-torrent.controller";
import { UrlShortenerService } from "src/url-shortener/url-shortener.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MagnetMappings } from "src/url-shortener/entities/magnet-mappings.entity";

@Module({
    imports: [TypeOrmModule.forFeature([MagnetMappings])],
    controllers: [MovieTorrentController],
    providers: [MovieTorrentService, UrlShortenerService],
})
export class MovieTorrentModule {}
