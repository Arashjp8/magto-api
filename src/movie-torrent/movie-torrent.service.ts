import { Injectable } from "@nestjs/common";
import { UrlShortenerService } from "src/url-shortener/url-shortener.service";
import * as TorrentSearchApi from "torrent-search-api";

@Injectable()
export class MovieTorrentService {
  constructor(private readonly urlShortenerService: UrlShortenerService) {
    TorrentSearchApi.enableProvider("ThePirateBay");
    TorrentSearchApi.enableProvider("1337x");
  }

  async getMovieMagnateLinks(movieName: string) {
    try {
      const torrents = await TorrentSearchApi.search(movieName, "Video", 20);

      if (torrents[0].title === "No results returned") {
        return { message: "No Torrents were found." };
      }

      const torrentsWithShortLinks = await Promise.all(
        torrents.map(async (torrent) => ({
          ...torrent,
          shortMagnet: await this.urlShortenerService.shortenUrl(
            torrent.magnet,
          ),
        })),
      );

      return {
        movieName,
        torrents: torrentsWithShortLinks,
        torrentsCount: torrents.length,
      };
    } catch (error) {
      console.error("Error fetching torrents:", error);
      throw new Error("Failed to fetch torrents.");
    }
  }
}
