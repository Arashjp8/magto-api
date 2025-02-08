import {
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from "@nestjs/common";
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
                throw new NotFoundException(SEARCH_CONSTS.ERRORS.NOT_FOUND);
            }

            return {
                movieName,
                torrents,
                torrentsCount: torrents.length,
            };
        } catch (error) {
            if (error instanceof NotFoundException) {
                this.logger.warn(`No torrents found for movie: ${movieName}`);
                throw error;
            }

            this.logger.error(SEARCH_CONSTS.ERRORS.FETCHING, movieName, error);

            throw new InternalServerErrorException(
                `${SEARCH_CONSTS.ERRORS.FETCHING}${movieName}`,
            );
        }
    }
}
