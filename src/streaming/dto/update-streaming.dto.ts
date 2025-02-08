import { PartialType } from "@nestjs/mapped-types";
import { CreateStreamingDto } from "./create-streaming.dto.js";

export class UpdateStreamingDto extends PartialType(CreateStreamingDto) {}
