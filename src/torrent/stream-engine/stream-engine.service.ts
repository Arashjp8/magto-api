import { Injectable, Logger } from "@nestjs/common";
import { IStreamEngine } from "./stream-engine.interface.js";
import WebTorrent from "webtorrent";
import { ENGINE_CONSTS } from "./stream-engine.constant.js";

@Injectable()
export class StreamEngineService implements IStreamEngine {
    private logger = new Logger(StreamEngineService.name);

    constructor(private readonly engineClient: WebTorrent.Instance) {}

    findPlayableFile(magnet: string): Promise<WebTorrent.TorrentFile> {
        return new Promise((resolve, reject) => {
            this.engineClient.add(magnet, (torrent) => {
                this.logger.log(ENGINE_CONSTS.LOGS.TORRENT_ADDED, magnet);

                torrent.on("ready", () => {
                    clearTimeout(timeout);

                    const file = torrent.files.find((file) => {
                        return ENGINE_CONSTS.PLAYABLE.some((playable) => {
                            return file.name.endsWith(`.${playable}`);
                        });
                    });

                    if (file) {
                        this.logger.log(
                            ENGINE_CONSTS.LOGS.PLAYABLE_FILE_FOUND,
                            file.name,
                        );
                        resolve(file);
                    }

                    this.logger.warn(ENGINE_CONSTS.LOGS.NO_PLAYABLE_FILE);
                    reject(null);
                });

                torrent.on("error", (err) => {
                    this.engineClient.remove(torrent);
                    this.logger.error(ENGINE_CONSTS.LOGS.TORRENT_ERROR, err);
                    reject(err);
                });

                const timeout = setTimeout(() => {
                    this.engineClient.remove(torrent);
                    this.logger.error(ENGINE_CONSTS.LOGS.METADATA_TIMEOUT);
                    reject(new Error(ENGINE_CONSTS.LOGS.TORRENT_ERROR));
                }, 30_000);

                torrent.on("done", () => clearTimeout(timeout));
            });

            this.engineClient.on("error", (err) => {
                this.logger.error(ENGINE_CONSTS.LOGS.ENGINE_CLIENT_ERROR, err);
                reject(err);
            });
        });
    }

    getStream(
        file: WebTorrent.TorrentFile,
        range?: { start: number; end: number },
    ): NodeJS.ReadableStream {
        return file.createReadStream({
            start: range ? range.start : 0,
            end: range ? range.end : file.length - 1,
        });
    }

    destroy(): void {
        if (this.engineClient) {
            this.engineClient.destroy();
        }
    }
}
