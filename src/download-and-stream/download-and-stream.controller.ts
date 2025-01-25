import { Controller, Get, Res } from "@nestjs/common";
import { DownloadAndStreamService } from "./download-and-stream.service";
import { Response } from "express";

@Controller("download-and-stream")
export class DownloadAndStreamController {
  constructor(
    private readonly downloadAndStreamService: DownloadAndStreamService,
  ) {}

  @Get()
  async downloadAndStream(@Res() res: Response) {
    return this.downloadAndStreamService.downloadAndStream(res);
  }
}
