import { Injectable, Logger } from "@nestjs/common";
import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import { Response } from "express";
import * as torrentStream from "torrent-stream";

const FILE_TYPES = ["mp4", "mkv", "webm"];
const FFMPEG_OPTIONS = [
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
];

@Injectable()
export class DownloadAndStreamService {
  private logger = new Logger(DownloadAndStreamService.name);

  private async findPlayableFile(
    engine: TorrentStream.TorrentEngine,
  ): Promise<TorrentStream.TorrentFile | null> {
    return new Promise((resolve) => {
      engine.on("ready", () => {
        const file = engine.files.find((file) =>
          FILE_TYPES.some((type) => file.name.endsWith(`.${type}`)),
        );
        resolve(file || null);
      });

      engine.on("error", (error: unknown) => {
        if (error instanceof Error) {
          this.logger.error("Torrent engine error:", error);
        } else {
          this.logger.error("Torrent engine error:", JSON.stringify(error));
        }
        resolve(null);
      });
    });
  }

  private prepareStream(
    file: TorrentStream.TorrentFile,
  ): Promise<NodeJS.ReadableStream> {
    return new Promise((resolve, reject) => {
      const stream = file.createReadStream();

      stream.on("error", (err: NodeJS.ErrnoException) => {
        this.logger.error("Stream error:", err);
        reject(err);
      });

      stream.on("end", () => {
        this.logger.log("Stream ended.");
      });

      resolve(stream);
    });
  }

  private streamWithFFmpeg(
    stream: NodeJS.ReadableStream,
    fileName: string,
    res: Response,
  ): ChildProcessWithoutNullStreams {
    const fileType =
      FILE_TYPES.find((type) => fileName.endsWith(`.${type}`)) || "mp4";

    res.set({
      "Content-Type": `video/${fileType}`,
      "Transfer-Encoding": "chunked",
    });

    const ffmpegCommand = spawn("ffmpeg", FFMPEG_OPTIONS);

    stream.pipe(ffmpegCommand.stdin);
    ffmpegCommand.stdout.pipe(res);

    const onStderrData = (data: Buffer) => {
      const message = data.toString();
      if (message.toLowerCase().includes("error")) {
        this.logger.error("FFmpeg stderr (error):", message);
      } else {
        this.logger.debug("FFmpeg stderr:", message);
      }
    };

    ffmpegCommand.stderr.on("data", onStderrData);

    ffmpegCommand.on("error", (err) => {
      this.logger.error("FFmpeg error:", err);
      res.status(500).send("Error streaming video.");
    });

    ffmpegCommand.on("close", (code) => {
      if (code === 0) {
        this.logger.log("Streaming finished successfully.");
      } else {
        this.logger.error(`FFmpeg process exited with code ${code}`);
      }
    });

    return ffmpegCommand;
  }

  private cleanupEngine(engine: TorrentStream.TorrentEngine) {
    this.logger.log("Cleaning up torrent engine.");

    engine.destroy(() => {
      this.logger.log("Torrent engine destroyed.");
    });
  }

  async downloadAndStream(magnet: string, res: Response) {
    try {
      const engine = torrentStream(magnet);

      const file = await this.findPlayableFile(engine);

      if (!file) {
        this.logger.error("No playable file found in torrent.");
        res.status(404).send("No playable file found in torrent.");
        return;
      }

      this.logger.log(`Streaming file: ${file.name}`);

      const stream = await this.prepareStream(file);

      const ffmpegCommand = this.streamWithFFmpeg(stream, file.name, res);

      res.on("close", () => {
        this.logger.log("FFmpeg command killed.");
        ffmpegCommand.stdin.end();
        ffmpegCommand.kill("SIGINT");
        this.cleanupEngine(engine);
      });
    } catch (error) {
      this.logger.error("Error downloading or streaming:", error);
      res.status(500).send("Internal Server Error");
    }
  }
}
