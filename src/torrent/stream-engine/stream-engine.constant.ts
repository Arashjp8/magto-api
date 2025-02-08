export const ENGINE_CONSTS = {
    PLAYABLE: ["mp4", "mkv", "webm", "avi", "mov"] as const,

    LOGS: {
        TORRENT_ADDED: "Torrent added:",
        PLAYABLE_FILE_FOUND: "Playable file found:",
        NO_PLAYABLE_FILE: "No playable file found",
        TORRENT_ERROR: "Torrent Error:",
        METADATA_TIMEOUT: "Torrent metadata timeout",
        ENGINE_CLIENT_ERROR: "Engine Client Error:",
        TORRENT_TIMEOUT: "Torrent metadata timeout",
    } as const,
} as const;
