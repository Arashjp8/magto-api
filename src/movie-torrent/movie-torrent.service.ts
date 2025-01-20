import { Injectable } from "@nestjs/common";
import * as TorrentSearchApi from "torrent-search-api";

@Injectable()
export class MovieTorrentService {
  constructor() {
    TorrentSearchApi.enableProvider("ThePirateBay");
  }

  async getMovieMagnateLinks(movieName: string) {
    //console.log(TorrentSearchApi.getActiveProviders());

    try {
      const torrents = await TorrentSearchApi.search(movieName, "Video", 20);
      return { movieName, torrents };
    } catch (error) {
      console.error("Error fetching torrents:", error);
      throw new Error("Failed to fetch torrents");
    }
  }
}
