import { Controller, Get, Query } from "@nestjs/common";
import { MovieQueryDto } from "./dto/movie-query.dto";
import { MovieTorrentService } from "./movie-torrent.service";

@Controller("movie-torrent")
export class MovieTorrentController {
  constructor(private readonly movieTorrentService: MovieTorrentService) {}

  @Get()
  async findAll(@Query() query: MovieQueryDto) {
    return this.movieTorrentService.getMovieMagnateLinks(query.movie_name);
  }
}
