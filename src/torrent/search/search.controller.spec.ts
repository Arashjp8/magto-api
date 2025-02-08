import { Test, TestingModule } from "@nestjs/testing";
import { SearchController } from "./search.controller.js";
import { SearchService } from "./search.service.js";

describe("SearchController", () => {
    let controller: SearchController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [SearchController],
            providers: [SearchService],
        }).compile();

        controller = module.get<SearchController>(SearchController);
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });
});
