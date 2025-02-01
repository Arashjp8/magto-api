import { Module } from "@nestjs/common";
import { UrlShortenerService } from "./url-shortener.service";
import { MagnetMappings } from "./entities/magnet-mappings.entity";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
    imports: [TypeOrmModule.forFeature([MagnetMappings])],
    providers: [UrlShortenerService],
})
export class UrlShortenerModule {}
