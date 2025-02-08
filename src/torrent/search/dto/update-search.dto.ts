import { PartialType } from "@nestjs/mapped-types";
import { CreateSearchDto } from "./create-search.dto.js";

export class UpdateSearchDto extends PartialType(CreateSearchDto) { }
