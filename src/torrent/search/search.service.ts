import { Injectable } from "@nestjs/common";

@Injectable()
export class SearchService {
    findAll() {
        return `This action returns all search`;
    }

    findOne(id: number) {
        return `This action returns a #${id} search`;
    }
}
