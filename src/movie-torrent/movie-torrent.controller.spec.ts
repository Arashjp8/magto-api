import { Test, TestingModule } from "@nestjs/testing";
import { MovieTorrentController } from "./movie-torrent.controller";
import { MovieTorrentService } from "./movie-torrent.service";

describe("MovieTorrentController", () => {
    let controller: MovieTorrentController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [MovieTorrentController],
            providers: [MovieTorrentService],
        }).compile();

        controller = module.get<MovieTorrentController>(MovieTorrentController);
    });

    it("should be defined", () => {
        expect(controller).toBeDefined();
    });
});
