import { PartialType } from "@nestjs/mapped-types";
import { CreateDownloadAndStreamDto } from "./create-download-and-stream.dto";

export class UpdateDownloadAndStreamDto extends PartialType(
  CreateDownloadAndStreamDto,
) {}
