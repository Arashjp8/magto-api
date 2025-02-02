import {
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from "@nestjs/common";
import { spawn } from "child_process";
import { Request, Response } from "express";
import * as torrentStream from "torrent-stream";

const FILE_TYPES = ["mp4", "mkv", "webm"];

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
                    this.logger.error(
                        "Torrent engine error:",
                        JSON.stringify(error),
                    );
                }
                resolve(null);
            });
        });
    }

    async prepareStream(
        file: TorrentStream.TorrentFile,
    ): Promise<NodeJS.ReadableStream> {
        return new Promise((resolve, reject) => {
            const stream: NodeJS.ReadableStream = file.createReadStream();

            // Check stream for errors
            stream.on("error", (err: NodeJS.ErrnoException) => {
                this.logger.error("Stream error:", err);
                reject(err);
            });

            stream.on("end", () => {
                this.logger.log("Stream ended.");
            });

            stream.on("data", (chunk) => {
                // You can add more logging here to inspect stream data if needed
                this.logger.log("Stream data chunk received:", chunk.length);
            });

            resolve(stream);
        });
    }

    async downloadAndStream(magnet: string, res: Response, req: Request) {
        try {
            const engine = torrentStream(magnet);

            const file = await this.findPlayableFile(engine);
            if (!file) {
                this.logger.error("No playable file found in torrent.");
                throw new NotFoundException(
                    "No playable file found in torrent.",
                );
            }

            this.logger.log("LENGTH:", file.length);
            this.logger.log("PATH:", file.path);
            this.logger.log("NAME:", file.name);

            const fileSize = file.length;
            const range = req.headers.range;

            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const contentLength = end - start + 1;

            this.logger.log("Start:", start, "End:", end);

            const stream = await this.prepareStream(file);
            const ffmpeg = spawn("ffmpeg", [
                "-i",
                "pipe:0",
                "-preset",
                "ultrafast",
                "-c:v",
                "libx264",
                "-c:a",
                "aac",
                "-movflags",
                "frag_keyframe+empty_moov",
                "-f",
                "mp4",
                "pipe:1",
            ]);

            stream.pipe(ffmpeg.stdin);

            ffmpeg.stderr.on("data", (data) => {
                this.logger.debug("FFmpeg stderr:", data);
            });

            res.writeHead(206, {
                "Content-Range": `bytes ${start}-${end}/${fileSize}`,
                "Accept-Ranges": "bytes",
                "Content-Length": contentLength,
                "Content-Type": "video/mp4",
            });

            ffmpeg.stdout.pipe(res, { end: false });

            ffmpeg.on("error", (err) => {
                this.logger.error("FFmpeg error:", err);
                res.status(500).send("Error processing video.");
            });
        } catch (error) {
            this.logger.error("Download and stream error:", error);
            throw new InternalServerErrorException("Error streaming video.");
        }
    }
}
