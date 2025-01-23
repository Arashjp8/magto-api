import { Injectable } from "@nestjs/common";
import { Readable } from "stream";
import * as TorrentSearchApi from "torrent-search-api";
import * as torrentStream from "torrent-stream";

@Injectable()
export class MovieTorrentService {
  constructor() {
    TorrentSearchApi.enableProvider("ThePirateBay");
    TorrentSearchApi.enableProvider("1337x");
    this.downloadAndStream();
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

  // TODO: change this later to get magnet link as an input
  // TODO: start downloading
  async downloadAndStream() {
    const engine = torrentStream(process.env.TEST_MAGNET);

    engine.on("ready", () => {
      engine.files.forEach((file) => console.log("file: ", file));

      const file = engine.files.find(
        (file) => file.name.endsWith(".mp4") || file.name.endsWith(".mkv"),
      );

      if (!file) {
        throw new Error("No playable file found in torrent.");
      }

      console.log("Streming file: ", file.name);
      const stream: Readable = file.createReadStream();
      console.log(stream);
    });

    engine.on("idle", () => {
      console.log("Torrent download completed.");
    });
  }
}
