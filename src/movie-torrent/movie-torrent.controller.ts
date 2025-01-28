import { Controller, Get, Logger, Query } from "@nestjs/common";
import { MovieQueryDto } from "./dto/movie-query.dto";
import { MovieTorrentService } from "./movie-torrent.service";

@Controller("movie-torrent")
export class MovieTorrentController {
  private logger = new Logger(MovieTorrentController.name);
  constructor(private readonly movieTorrentService: MovieTorrentService) {}

  @Get()
  async findAll(@Query() query: MovieQueryDto) {
    this.logger.log(
      `Received GET request to '/api/movie-torrent' with query: ${JSON.stringify(query)}`,
    );
    return this.movieTorrentService.getMovieMagnateLinks(query.movie_name);
  }
}
