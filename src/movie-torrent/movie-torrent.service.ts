import { Injectable } from "@nestjs/common";
import { spawn } from "child_process";
import { Response } from "express";
import * as TorrentSearchApi from "torrent-search-api";
import * as torrentStream from "torrent-stream";

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

  // TODO: change this later to get magnet link as an input
  // TODO: start downloading
  async downloadAndStream(res: Response) {
    const engine = torrentStream(process.env.TEST_MAGNET);

    engine.on("ready", () => {
      const file = engine.files.find(
        (file) => file.name.endsWith(".mp4") || file.name.endsWith(".mkv"),
      );

      if (!file) {
        throw new Error("No playable file found in torrent.");
      }

      console.log("Streming file: ", file.name);
      const stream = file.createReadStream();

      res.set({
        "Content-Type": "video/mp4", // VLC expects a video stream
        "Transfer-Encoding": "chunked", // Chunked transfer for streaming
      });

      const ffmpegCommand = spawn("ffmpeg", [
        // hardware acceleration
        "-hwaccel",
        "auto",
        // input file
        "-i",
        // pipe the input to stdin
        "pipe:0",
        // preset for lower resource usage
        "-preset",
        "ultrafast",
        // video codec
        "-c:v",
        "libx264",
        // audio codec
        "-c:a",
        "aac",
        // Optimize for streaming
        "-movflags",
        "frag_keyframe+empty_moov",
        // output format
        "-f",
        "mp4",
        // pipe the output to stdout
        "pipe:1",
      ]);

      stream.pipe(ffmpegCommand.stdin);
      ffmpegCommand.stdout.pipe(res);

      ffmpegCommand.on("error", (err) => {
        console.error("FFmpeg error: ", err);
        res.status(500).send("Error streaming video");
      });

      ffmpegCommand.on("close", (code) => {
        if (code === 0) {
          console.log("Streaming finished.");
        } else {
          console.log(`FFmpeg process exited with code ${code}`);
        }
      });
    });

    engine.on("idle", () => {
      console.log("Torrent download completed.");
    });
  }
}
