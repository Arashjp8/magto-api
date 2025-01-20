import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import { MovieTorrentService } from "./movie-torrent.service";

@Controller("movie-torrent")
export class MovieTorrentController {
  constructor(private readonly movieTorrentService: MovieTorrentService) {}

  @Get()
  async findAll(@Query("movie_name") movieName: string) {
    if (!movieName) {
      throw new BadRequestException(
        "The `movie_name` query parameter is required.",
      );
    }

    return this.movieTorrentService.getMoveMagnateLinks(movieName);
  }
}
