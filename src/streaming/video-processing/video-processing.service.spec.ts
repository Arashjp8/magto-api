import { Test, TestingModule } from "@nestjs/testing";
import { VideoProcessingService } from "./video-processing.service.js";

describe("VideoProcessingService", () => {
    let service: VideoProcessingService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [VideoProcessingService],
        }).compile();

        service = module.get<VideoProcessingService>(VideoProcessingService);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });
});
