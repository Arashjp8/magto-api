import { Injectable } from "@nestjs/common";
import { createHash } from "crypto";

@Injectable()
export class UrlShortenerService {
  private urlMap = new Map<string, string>();
  private reverseMap = new Map<string, string>();
  private baseUrl = "http://localhost:3000/short/";

  generateShortKey(magnet: string): string {
    const hash = createHash("sha256").update(magnet).digest("hex");
    // return first 8 characters of hash
    return hash.substring(0, 8);
  }

  shortenUrl(magnet: string): string {
    if (this.reverseMap.has(magnet)) {
      return this.baseUrl + this.reverseMap.get(magnet);
    }

    let shortKey = this.generateShortKey(magnet);

    while (this.urlMap.has(shortKey)) {
      shortKey = this.generateShortKey(magnet + Math.random().toString());
    }

    this.urlMap.set(shortKey, magnet);
    this.reverseMap.set(magnet, shortKey);

    return this.baseUrl + shortKey;
  }

  resolveUrl(shortKey: string): string | null {
    const fullMagnet = this.urlMap.get(shortKey);
    if (!fullMagnet) {
      console.log(`Short magnet not found: ${shortKey}`);
      return null;
    }
    console.log(`Resolved to full magnet: ${fullMagnet}`);

    return fullMagnet;
  }
}
