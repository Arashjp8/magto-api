import { Module } from "@nestjs/common";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { SearchModule } from "./torrent/search/search.module.js";
import { StreamEngineService } from "./torrent/stream-engine/stream-engine.service.js";
import { StreamingModule } from "./streaming/streaming.module.js";

@Module({
    controllers: [AppController],
    providers: [AppService, StreamEngineService],
    imports: [SearchModule, StreamingModule],
})
export class AppModule {}
