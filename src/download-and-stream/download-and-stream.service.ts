import { Injectable } from "@nestjs/common";
import { Response } from "express";
import { spawn } from "child_process";
import * as torrentStream from "torrent-stream";

@Injectable()
export class DownloadAndStreamService {
  async downloadAndStream(magnet: string, res: Response) {
    const engine = torrentStream(magnet);

    const fileTypes = ["mp4", "mkv", "webm"];

    engine.on("ready", () => {
      const file = engine.files.find((file) =>
        fileTypes.some((type) => file.name.endsWith(`.${type}`)),
      );

      if (!file) {
        console.error("No playable file found in torrent.");
        res.status(404).send("No playable file found in torrent.");
        return;
      }

      console.log("Streaming file:", file.name);

      const stream = file.createReadStream();

      const fileType = fileTypes.find((type) => file.name.endsWith(`.${type}`));

      res.set({
        "Content-Type": `video/${fileType}`,
        "Transfer-Encoding": "chunked",
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
        // real-time streaming
        "-tune",
        "zerolatency",
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

      ffmpegCommand.stderr.on("data", (data) => {
        console.error("FFmpeg stderr:", data.toString());
      });

      res.on("close", () => {
        console.info("Client closed the connection.");

        if (!ffmpegCommand.killed) {
          ffmpegCommand.kill("SIGINT");
          console.info("FFmpeg process killed.");
        }

        engine.destroy(() => console.info("Torrent engine destroyed."));
      });

      ffmpegCommand.on("error", (err) => {
        console.error("FFmpeg error:", err);
        res.status(500).send("Error streaming video.");
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
