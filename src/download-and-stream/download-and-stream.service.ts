import {
    HttpException,
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from "@nestjs/common";
import { Request, Response } from "express";
import * as torrentStream from "torrent-stream";
import * as mime from "mime-types";

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

    private getMimeType(fileName: string): string {
        const ext = fileName.split(".").pop();
        if (ext) {
            const mimeType = mime.lookup(ext);
            if (mimeType) {
                return mimeType;
            }
        }
        return "application/octet-stream";
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

            this.logger.log("Serving file:", file.name);
            const fileSize = file.length;
            this.logger.log("fileSize:", fileSize);
            const rangeHeader = req.headers.range;
            this.logger.log("RangeHeader:", rangeHeader);

            const contentType = this.getMimeType(file.name);

            if (rangeHeader) {
                const [startStr, endStr] = rangeHeader
                    .replace(/bytes=/, "")
                    .split("-");
                this.logger.log("startStr", startStr);
                this.logger.log("endStr", endStr);

                const start = parseInt(startStr, 10);
                this.logger.log("start:", start);
                const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
                this.logger.log("end:", end);

                if (start >= fileSize || end >= fileSize) {
                    this.logger.error(
                        `Invalid range: ${start}-${end} (File size: ${fileSize})`,
                    );
                    throw new HttpException(
                        "Requested range not satisfiable",
                        416,
                    );
                }

                const contentRange = `bytes ${start}-${end}/${fileSize}`;
                this.logger.log("contentRange:", contentRange);

                res.set({
                    "Content-Range": `bytes ${start}-${end}/${fileSize}`,
                    "Content-Length": end - start + 1,
                    "Accept-Ranges": "bytes",
                    "Content-Type": contentType,
                });

                const stream = file.createReadStream({ start, end });
                stream.pipe(res);
            } else {
                res.set({
                    "Content-Length": fileSize,
                    "Accept-Ranges": "bytes",
                    "Content-Type": contentType,
                });

                const stream = file.createReadStream();
                stream.pipe(res);
            }
        } catch (error) {
            this.logger.error("Error downloading or streaming:", error);
            throw new InternalServerErrorException("Internal Server Error");
        }
    }
}
