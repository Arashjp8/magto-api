import { Inject, Injectable, Logger } from "@nestjs/common";
import { IStreamEngine } from "./stream-engine.interface.js";
import WebTorrent from "webtorrent";
import { ENGINE_CONSTS } from "./stream-engine.constant.js";

@Injectable()
export class StreamEngineService implements IStreamEngine {
    private readonly logger = new Logger(StreamEngineService.name);

    constructor(
        @Inject("WEBTORRENT_INSTANCE")
        private readonly engineClient: WebTorrent.Instance,
    ) { }

    findPlayableFile(magnet: string): Promise<WebTorrent.TorrentFile> {
        return new Promise((resolve, reject) => {
            this.engineClient.add(magnet, (torrent) => {
                this.logger.log(ENGINE_CONSTS.LOGS.TORRENT_ADDED, magnet);

                const timeout = setTimeout(() => {
                    this.engineClient.remove(torrent);
                    this.logger.error(ENGINE_CONSTS.LOGS.METADATA_TIMEOUT);
                    reject(new Error(ENGINE_CONSTS.LOGS.TORRENT_ERROR));
                }, 30000);

                this.logger.debug("before file");
                const file = torrent.files.find((file) => {
                    return ENGINE_CONSTS.PLAYABLE.some((playable) => {
                        return file.name.endsWith(`.${playable}`);
                    });
                });
                this.logger.debug("file", file);

                if (!file) {
                    this.logger.warn(ENGINE_CONSTS.LOGS.NO_PLAYABLE_FILE);
                    reject(null);
                    throw new Error(ENGINE_CONSTS.LOGS.NO_PLAYABLE_FILE);
                }

                clearTimeout(timeout);

                this.logger.log(
                    ENGINE_CONSTS.LOGS.PLAYABLE_FILE_FOUND,
                    file.name,
                );
                resolve(file);
                this.logger.debug("after engine resolve");

                torrent.on("error", (err) => {
                    this.engineClient.remove(torrent);
                    this.logger.error(ENGINE_CONSTS.LOGS.TORRENT_ERROR, err);
                    reject(err);
                });

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
        this.logger.debug("file", file);
        this.logger.debug("range.start", range?.start);
        this.logger.debug("range.end", range?.end);
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
