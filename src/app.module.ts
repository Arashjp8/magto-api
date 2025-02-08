import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { StreamingModule } from "./streaming/streaming.module.js";
import { SearchModule } from "./torrent/search/search.module.js";

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: "mariadb",
            host: "localhost",
            port: 3306,
            username: "root",
            password: "",
            database: "test",
            entities: [], // change this if you had an entity
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
        SearchModule,
        StreamingModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
