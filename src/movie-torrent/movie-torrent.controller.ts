import { Controller, Get, Query, Res } from "@nestjs/common";
import { MovieQueryDto } from "./dto/movie-query.dto";
import { MovieTorrentService } from "./movie-torrent.service";
import { Response } from "express";

@Controller("movie-torrent")
export class MovieTorrentController {
  constructor(private readonly movieTorrentService: MovieTorrentService) {}

  @Get()
  async findAll(@Query() query: MovieQueryDto) {
    return this.movieTorrentService.getMovieMagnateLinks(query.movie_name);
  }

  @Get("download-and-stream")
  async downloadAndStream(@Res() res: Response) {
    return this.movieTorrentService.downloadAndStream(res);
  }
}
