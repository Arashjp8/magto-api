import { PartialType } from "@nestjs/mapped-types";
import { CreateMovieTorrentDto } from "./create-movie-torrent.dto";

export class UpdateMovieTorrentDto extends PartialType(CreateMovieTorrentDto) {}
