import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { MovieTorrentModule } from "./movie-torrent/movie-torrent.module";
import { ConfigModule } from "@nestjs/config";
import { DownloadAndStreamModule } from "./download-and-stream/download-and-stream.module";
import { UrlShortenerModule } from "./url-shortener/url-shortener.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MagnetMappings } from "./url-shortener/entities/magnet-mappings.entity";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: "mariadb",
            host: "localhost",
            port: 3306,
            username: "root",
            password: "",
            database: "test",
            entities: [MagnetMappings],
            // TODO:
            // WARNING: change to false in production
            synchronize: true,
            retryAttempts: 3,
            retryDelay: 3000,
        }),
        ConfigModule.forRoot({
            envFilePath: ".env",
            isGlobal: true,
        }),
        ScheduleModule.forRoot(),
        MovieTorrentModule,
        DownloadAndStreamModule,
        UrlShortenerModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
