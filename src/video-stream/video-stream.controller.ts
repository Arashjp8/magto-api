import { Controller, Get, Query, Res } from "@nestjs/common";
import { VideoStreamService } from "./video-stream.service";
import { Response } from "express";
import * as path from "path";

@Controller("video-stream")
export class VideoStreamController {
  constructor(private readonly videoStreamService: VideoStreamService) {}

  @Get()
  async stream(
    @Query("filePath") filePath: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!filePath) {
      res.status(400).send("File path is required");
      return;
    }

    const absolutePath = path.resolve(filePath);
    this.videoStreamService.streamVideo(absolutePath, res);
  }
}
