import { Controller, Get, Logger, Query } from "@nestjs/common";
import { SearchService } from "./search.service.js";
import { SearchQueryDto } from "./dto/search-query.dto.js";

@Controller("search")
export class SearchController {
    private readonly logger = new Logger(SearchController.name);

    constructor(private readonly searchService: SearchService) {}

    @Get()
    async findAll(@Query() query: SearchQueryDto) {
        this.logger.log(
            `Received GET request to '/api/movie-torrent' with query: ${JSON.stringify(query)}`,
        );
        return await this.searchService.findAll(query.movie_name);
    }
}
