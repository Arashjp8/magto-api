import { Test, TestingModule } from "@nestjs/testing";
import { StreamingController } from "./streaming.controller.js";
import { StreamingService } from "./streaming.service.js";

describe("StreamingController", () => {
    let controller: StreamingController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [StreamingController],
            providers: [StreamingService],
        }).compile();

        controller = module.get<StreamingController>(StreamingController);
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });
});
