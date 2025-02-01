import { IsString, IsNotEmpty } from "class-validator";

export class MovieQueryDto {
    @IsString()
    @IsNotEmpty()
    movie_name: string;
}
