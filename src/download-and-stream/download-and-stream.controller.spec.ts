import { Test, TestingModule } from "@nestjs/testing";
import { DownloadAndStreamController } from "./download-and-stream.controller";
import { DownloadAndStreamService } from "./download-and-stream.service";

describe("DownloadAndStreamController", () => {
    let controller: DownloadAndStreamController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [DownloadAndStreamController],
            providers: [DownloadAndStreamService],
        }).compile();

        controller = module.get<DownloadAndStreamController>(
            DownloadAndStreamController,
        );
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });
});
