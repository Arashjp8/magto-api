import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { MovieTorrentModule } from "./movie-torrent/movie-torrent.module";
import { ConfigModule } from "@nestjs/config";
import { DownloadAndStreamModule } from "./download-and-stream/download-and-stream.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ".env",
      isGlobal: true,
    }),
    MovieTorrentModule,
    DownloadAndStreamModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
