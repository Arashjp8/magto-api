import { Injectable, Logger } from "@nestjs/common";
import TorrentSearchApi from "torrent-search-api";
import { SEARCH_CONSTS } from "./search.constants.js";

@Injectable()
export class SearchService {
    private logger = new Logger(SearchService.name);

    constructor() {
        this.initializeProviders();
    }

    private initializeProviders(): void {
        SEARCH_CONSTS.PROVIDERS.forEach((provider) => {
            TorrentSearchApi.enableProvider(provider);
        });
    }

    async findAll(movieName: string) {
        try {
            const torrents = await TorrentSearchApi.search(
                movieName,
                "Video",
                20,
            );

            if (!torrents || torrents[0].title === "No results returned") {
                return { message: "No Torrents were found." };
            }

            return {
                movieName,
                torrents,
                torrentsCount: torrents.length,
            };
        } catch (error) {
            this.logger.error(
                "Error fetching torrents for movie:",
                movieName,
                error,
            );
            throw new Error(`Failed to fetch torrents for "${movieName}".`);
        }
    }
}
