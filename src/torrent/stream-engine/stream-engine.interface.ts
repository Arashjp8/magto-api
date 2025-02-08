import WebTorrent from "webtorrent";

export interface IStreamEngine {
    findPlayableFile(magnet: string): Promise<WebTorrent.TorrentFile>;
    getStream(
        file: WebTorrent.TorrentFile,
        range?: { start: number; end: number },
    ): NodeJS.ReadableStream;
    destroy(): void;
}
