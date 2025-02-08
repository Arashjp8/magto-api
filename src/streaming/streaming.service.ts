import { Injectable } from "@nestjs/common";

@Injectable()
export class StreamingService {
    findAll() {
        return `This action returns all streaming`;
    }
}
