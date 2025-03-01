import { Module } from "@nestjs/common";
import { SearchService } from "./search.service.js";
import { SearchController } from "./search.controller.js";

@Module({
    controllers: [SearchController],
    providers: [SearchService],
})
export class SearchModule { }
