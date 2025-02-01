import { Test, TestingModule } from "@nestjs/testing";
import { DownloadAndStreamService } from "./download-and-stream.service";

describe("DownloadAndStreamService", () => {
    let service: DownloadAndStreamService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [DownloadAndStreamService],
        }).compile();

        service = module.get<DownloadAndStreamService>(
            DownloadAndStreamService,
        );
    });

    it("should be defined", () => {
        expect(service).toBeDefined();
    });
});
