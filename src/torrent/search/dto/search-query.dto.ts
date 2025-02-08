import { IsString, IsNotEmpty } from "class-validator";

export class SearchQueryDto {
    @IsString()
    @IsNotEmpty()
    movie_name: string;

    constructor(movie_name: string) {
        this.movie_name = movie_name;
    }
}
