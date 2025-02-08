import { Controller, Get, Param } from "@nestjs/common";
import { SearchService } from "./search.service.js";

@Controller("search")
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    @Get()
    findAll() {
        return this.searchService.findAll();
    }

    @Get(":id")
    findOne(@Param("id") id: string) {
        return this.searchService.findOne(+id);
    }
}
