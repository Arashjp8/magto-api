import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { MovieTorrentModule } from "./movie-torrent/movie-torrent.module";

@Module({
  imports: [MovieTorrentModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
