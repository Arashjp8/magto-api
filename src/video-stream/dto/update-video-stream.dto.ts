import { PartialType } from "@nestjs/mapped-types";
import { CreateVideoStreamDto } from "./create-video-stream.dto";

export class UpdateVideoStreamDto extends PartialType(CreateVideoStreamDto) {}
