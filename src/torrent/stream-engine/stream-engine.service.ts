import { Inject, Injectable, Logger } from "@nestjs/common";
import { IStreamEngine } from "./stream-engine.interface.js";
import WebTorrent from "webtorrent";
import { ENGINE_CONSTS } from "./stream-engine.constant.js";

@Injectable()
export class StreamEngineService implements IStreamEngine {
    private readonly logger = new Logger(StreamEngineService.name);
    private readonly metadataTimeout = 30000;

    constructor(
        @Inject("WEBTORRENT_INSTANCE")
        private readonly engineClient: WebTorrent.Instance,
    ) {
        this.engineClient.on("error", (err) => {
            this.logger.error(ENGINE_CONSTS.LOGS.ENGINE_CLIENT_ERROR, err);
        });
    }

    findPlayableFile(magnet: string): Promise<WebTorrent.TorrentFile> {
        return new Promise((resolve, reject) => {
            let rejected = false;
            let removed = false;

            this.engineClient.add(magnet, (torrent) => {
                this.logger.log(ENGINE_CONSTS.LOGS.TORRENT_ADDED, magnet);

                const timeout = setTimeout(() => {
                    if (!removed) {
                        this.engineClient.remove(torrent);
                        removed = true;
                        this.logger.error(ENGINE_CONSTS.LOGS.METADATA_TIMEOUT);
                    }

                    if (!rejected) {
                        rejected = true;
                        reject(new Error(ENGINE_CONSTS.LOGS.TORRENT_ERROR));
                    }
                }, this.metadataTimeout);

                const file = torrent.files.find((file) => {
                    return ENGINE_CONSTS.PLAYABLE.some((playable) => {
                        return file.name.endsWith(`.${playable}`);
                    });
                });

                if (!file) {
                    this.logger.warn(ENGINE_CONSTS.LOGS.NO_PLAYABLE_FILE);
                    if (!rejected) {
                        rejected = true;
                        return reject(
                            new Error(ENGINE_CONSTS.LOGS.NO_PLAYABLE_FILE),
                        );
                    }
                    return;
                }

                clearTimeout(timeout);
                this.logger.log(
                    ENGINE_CONSTS.LOGS.PLAYABLE_FILE_FOUND,
                    file.name,
                );
                resolve(file);

                torrent.once("error", (err) => {
                    if (!rejected) {
                        rejected = true;
                        if (!removed) {
                            this.engineClient.remove(torrent);
                            removed = true;
                        }
                        this.logger.error(
                            ENGINE_CONSTS.LOGS.TORRENT_ERROR,
                            err,
                        );
                        reject(err);
                    }
                });

                torrent.once("done", () => {
                    clearTimeout(timeout);
                    setTimeout(() => {
                        if (!removed && torrent.done) {
                            this.logger.log("Torrent removed");
                            this.engineClient.remove(torrent);
                            removed = true;
                        }
                    }, 60000);
                });
            });
        });
    }

    getStream(
        file: WebTorrent.TorrentFile,
        range?: { start: number; end: number },
    ): NodeJS.ReadableStream {
        if (range) {
            if (
                range.start < 0 ||
                range.end > file.length - 1 ||
                range.start > range.end
            ) {
                throw new Error("Invalid range");
            }
        }

        return file.createReadStream({
            start: range ? range.start : 0,
            end: range ? range.end : file.length - 1,
        });
    }

    destroy(): void {
        if (this.engineClient) {
            this.engineClient.removeAllListeners("error");
            this.engineClient.destroy();
        }
    }
}
