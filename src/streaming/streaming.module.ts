import { Module } from "@nestjs/common";
import { StreamingService } from "./streaming.service.js";
import { StreamingController } from "./streaming.controller.js";
import { VideoProcessingService } from "./video-processing/video-processing.service.js";
import { StreamEngineService } from "../torrent/stream-engine/stream-engine.service.js";
import WebTorrent from "webtorrent";

@Module({
    imports: [],
    controllers: [StreamingController],
    providers: [
        StreamingService,
        VideoProcessingService,
        StreamEngineService,
        {
            provide: "WEBTORRENT_INSTANCE",
            useValue: new WebTorrent(), // Directly provide an instance of WebTorrent
        },
    ],
})
export class StreamingModule {}
