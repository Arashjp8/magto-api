import { Injectable } from "@nestjs/common";
import { Response } from "express";
import { spawn } from "child_process";
import * as torrentStream from "torrent-stream";

@Injectable()
export class DownloadAndStreamService {
  // TODO: change this later to get magnet link as an input
  // TODO: start downloading
  async downloadAndStream(res: Response) {
    const engine = torrentStream(process.env.TEST_MAGNET2);

    const fileTypes = [".mp4", ".mkv", ".webm"];

    engine.on("ready", () => {
      const file = engine.files.find((file) =>
        fileTypes.some((type) => {
          return file.name.endsWith(type);
        }),
      );

      if (!file) {
        console.error("No playable file found in torrent.");
        res.status(404).send("No playable file found in torrent.");
        return;
      }

      console.log("Streming file: ", file.name);

      const stream = file.createReadStream();

      res.set({
        "Content-Type": "video/mp4",
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
        console.error("FFmpeg stderr: ", data.toString());
      });

      res.on("close", () => {
        console.info("Client closed the connection.");

        if (ffmpegCommand && !ffmpegCommand.killed) {
          ffmpegCommand.kill("SIGINT");
          console.info("FFmpeg process killed.");
        }

        if (ffmpegCommand.killed) {
          console.info("FFmpeg process killed successfully.");
        }

        engine.destroy(() => console.info("Torrent engine destroyed."));
      });

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
