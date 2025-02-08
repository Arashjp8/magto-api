import { Controller, Get } from "@nestjs/common";
import { StreamingService } from "./streaming.service.js";

@Controller("streaming")
export class StreamingController {
    constructor(private readonly streamingService: StreamingService) {}

    @Get()
    findAll() {
        return this.streamingService.findAll();
    }
}
