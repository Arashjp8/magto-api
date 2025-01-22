import { Injectable } from "@nestjs/common";
import { Response } from "express";
import * as ffmpeg from "fluent-ffmpeg";
import * as fs from "fs";

@Injectable()
export class VideoStreamService {
  streamVideo(filePath: string, res: Response): void {
    if (!fs) {
      res.status(404).send("Video file not found!");
      return;
    }

    res.setHeader("Content-Type", "vide/webm");
    res.setHeader("Accept-Ranges", "bytes");

    ffmpeg(filePath)
      .videoCodec("libx264")
      .audioCodec("aac")
      .format("matroska")
      .on("start", (commandLine) => {
        console.log("FFmpeg command: ", commandLine);
      })
      .on("error", (err) => {
        console.error("FFmpeg error: ", err);
        res.status(500).send("Error streaming video");
      })
      .on("end", () => {
        console.log("Streaming finished.");
      })
      .pipe(res, { end: true });
  }
}
