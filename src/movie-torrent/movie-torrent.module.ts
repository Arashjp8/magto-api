import { Module } from "@nestjs/common";
import { MovieTorrentService } from "./movie-torrent.service";
import { MovieTorrentController } from "./movie-torrent.controller";
import { UrlShortenerService } from "src/url-shortener/url-shortener.service";

@Module({
  controllers: [MovieTorrentController],
  providers: [MovieTorrentService, UrlShortenerService],
})
export class MovieTorrentModule {}
