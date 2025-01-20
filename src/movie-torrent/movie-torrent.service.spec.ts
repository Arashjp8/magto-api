import { Test, TestingModule } from "@nestjs/testing";
import { MovieTorrentService } from "./movie-torrent.service";

describe("MovieTorrentService", () => {
  let service: MovieTorrentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MovieTorrentService],
    }).compile();

    service = module.get<MovieTorrentService>(MovieTorrentService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
