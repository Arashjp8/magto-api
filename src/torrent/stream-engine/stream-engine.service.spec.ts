import { Test, TestingModule } from "@nestjs/testing";
import { StreamEngineService } from "./stream-engine.service.js";

describe("StreamEngineService", () => {
    let service: StreamEngineService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [StreamEngineService],
        }).compile();

        service = module.get<StreamEngineService>(StreamEngineService);
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });
});
