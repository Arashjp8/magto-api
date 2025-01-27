import { Injectable, Logger } from "@nestjs/common";
import { UrlShortenerService } from "src/url-shortener/url-shortener.service";
import * as TorrentSearchApi from "torrent-search-api";

export interface ModifiedTorrents extends TorrentSearchApi.Torrent {
  shortMagnet: string;
}

const PROVIDERS = ["ThePirateBay", "1337x"];

@Injectable()
export class MovieTorrentService {
  private logger = new Logger(MovieTorrentService.name);

  constructor(private readonly urlShortenerService: UrlShortenerService) {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    PROVIDERS.forEach((provider) => TorrentSearchApi.enableProvider(provider));
  }

  private async mapTorrentWithShortLinks(
    torrents: TorrentSearchApi.Torrent[],
  ): Promise<ModifiedTorrents[]> {
    return Promise.all(
      torrents.map(async (torrent) => ({
        ...torrent,
        shortMagnet: await this.urlShortenerService.shortenUrl(torrent.magnet),
      })),
    );
  }

  async getMovieMagnateLinks(movieName: string) {
    try {
      const torrents = await TorrentSearchApi.search(movieName, "Video", 20);

      if (!torrents || torrents[0].title === "No results returned") {
        return { message: "No Torrents were found." };
      }

      const torrentsWithShortLinks =
        await this.mapTorrentWithShortLinks(torrents);

      return {
        movieName,
        torrents: torrentsWithShortLinks,
        torrentsCount: torrents.length,
      };
    } catch (error) {
      this.logger.error(
        "Error fetching torrents for movie:",
        movieName,
        error.stack,
      );
      throw new Error(`Failed to fetch torrents for "${movieName}".`);
    }
  }
}
