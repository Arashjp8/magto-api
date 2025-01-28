import {
  BadRequestException,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  Query,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { UrlShortenerService } from "src/url-shortener/url-shortener.service";
import { DownloadAndStreamService } from "./download-and-stream.service";

@Controller("download-and-stream")
export class DownloadAndStreamController {
  private readonly logger = new Logger(DownloadAndStreamController.name);

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
    this.logger.log(`Received GET request to '/download-and-stream'`, {
      magnet,
      shortMagnet,
    });

    if (!magnet && !shortMagnet) {
      throw new BadRequestException("Magnet link or shortMagnet is required.");
    }

    let fullMagnet = magnet;

    if (shortMagnet) {
      fullMagnet = await this.urlShortenerService.resolveUrl(shortMagnet);
      if (!fullMagnet) {
        throw new BadRequestException("Invalid shortMagnet.");
      }
    }

    try {
      await this.downloadAndStreamService.downloadAndStream(fullMagnet, res);
    } catch (error) {
      console.error("Error in download and stream:", error);
      throw new InternalServerErrorException("Internal Server Error");
    }
  }
}
