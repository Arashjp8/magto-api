import { Injectable } from "@nestjs/common";
import { Response } from "express";
import { spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class VideoStreamService {
  streamVideo(filePath: string, res: Response): void {
    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) {
      res.status(404).send("Video file not found!");
      return;
    }

    res.setHeader("Content-Type", "vide/webm");
    res.setHeader("Accept-Ranges", "bytes");

    const ffmpegCommand = spawn("ffmpeg", [
      // input file
      "-i",
      absolutePath,
      // video codec
      "-c:v",
      "libx264",
      // audio codec
      "-c:a",
      "aac",
      // output format
      "-f",
      "matroska",
      // pipe the output to stdout
      "pipe:1",
    ]);

    // pipe ffmpeg stdout to http response
    ffmpegCommand.stdout.pipe(res);

    ffmpegCommand.on("error", (err) => {
      console.error("FFmpeg error: ", err);
      res.status(500).send("Error streaming video");
    });

    ffmpegCommand.on("close", (code) => {
      if (code === 0) {
        console.log("Streaming finished.");
      } else {
        console.log(`FFmpeg process exited with code ${code}`);
      }
    });
  }
}
