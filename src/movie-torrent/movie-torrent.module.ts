import { Module } from "@nestjs/common";
import { MovieTorrentService } from "./movie-torrent.service";
import { MovieTorrentController } from "./movie-torrent.controller";

@Module({
  controllers: [MovieTorrentController],
  providers: [MovieTorrentService],
})
export class MovieTorrentModule {}
