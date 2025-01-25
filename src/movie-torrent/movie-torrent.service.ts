import { Injectable } from "@nestjs/common";
import * as TorrentSearchApi from "torrent-search-api";

@Injectable()
export class MovieTorrentService {
  constructor() {
    TorrentSearchApi.enableProvider("ThePirateBay");
    TorrentSearchApi.enableProvider("1337x");
  }

  async getMovieMagnateLinks(movieName: string) {
    try {
      const torrents = await TorrentSearchApi.search(movieName, "Video", 20);

      const torrentsCount = torrents.length;

      return {
        movieName,
        torrents,
        torrentsCount,
      };
    } catch (error) {
      console.error("Error fetching torrents:", error);
      throw new Error("Failed to fetch torrents.");
    }
  }
}
