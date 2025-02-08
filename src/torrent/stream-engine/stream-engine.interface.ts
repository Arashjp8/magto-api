import WebTorrent from "webtorrent";

export interface IStreamEngine {
    /**
     * Finds a playable file from a torrent using the provided magnet link.
     * This method adds the torrent to the client, waits for metadata to be ready,
     * and then searches for a file that has an extension considered playable.
     *
     * @param magnet - The magnet link of the torrent.
     * @returns A promise that resolves with the playable torrent file.
     *          If no playable file is found or an error occurs, the promise is rejected.
     */
    findPlayableFile(magnet: string): Promise<WebTorrent.TorrentFile>;

    /**
     * Retrieves a readable stream for the given torrent file.
     * Optionally, a byte range can be specified to stream only a specific part of the file.
     *
     * @param file - The torrent file from which to create the stream.
     * @param range - Optional. An object containing the start and end byte positions.
     * @returns A NodeJS.ReadableStream for the specified file or byte range.
     */
    getStream(
        file: WebTorrent.TorrentFile,
        range?: { start: number; end: number },
    ): NodeJS.ReadableStream;

    /**
     * Destroys the torrent engine client instance to clean up resources.
     * This stops all torrent activity and frees up any used memory.
     */
    destroy(): void;
}
