import { Test, TestingModule } from "@nestjs/testing";
import { VideoStreamController } from "./video-stream.controller";
import { VideoStreamService } from "./video-stream.service";

describe("VideoStreamController", () => {
  let controller: VideoStreamController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideoStreamController],
      providers: [VideoStreamService],
    }).compile();

    controller = module.get<VideoStreamController>(VideoStreamController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
