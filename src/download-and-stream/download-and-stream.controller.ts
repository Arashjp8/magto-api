import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Res,
} from "@nestjs/common";
import { DownloadAndStreamService } from "./download-and-stream.service";
import { Response } from "express";
import { UrlShortenerService } from "src/url-shortener/url-shortener.service";

@Controller("download-and-stream")
export class DownloadAndStreamController {
  constructor(
    private readonly downloadAndStreamService: DownloadAndStreamService,
    private readonly urlShortenerService: UrlShortenerService,
  ) {}

  @Get()
  async downloadAndStream(
    @Query("magnet") magnet: string,
    @Query("shortMagnet") shortMagnet: string,
    @Res() res: Response,
  ) {
    if (!magnet && !shortMagnet) {
      throw new BadRequestException("Magnet link or shortMagnet is required.");
    }

    let fullMagnet = magnet;

    if (shortMagnet) {
      fullMagnet = this.urlShortenerService.resolveUrl(shortMagnet);
      if (!fullMagnet) {
        throw new BadRequestException("Invalid shortMagnet.");
      }
    }

    try {
      await this.downloadAndStreamService.downloadAndStream(fullMagnet, res);
    } catch (error) {
      console.error("Error in download and stream:", error);
      res.status(500).send("Internal Server Error");
    }
  }
}
