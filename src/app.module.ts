import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { MovieTorrentModule } from "./movie-torrent/movie-torrent.module";
import { VideoStreamModule } from "./video-stream/video-stream.module";
import { ConfigModule } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ".env",
      isGlobal: true,
    }),
    MovieTorrentModule,
    VideoStreamModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
