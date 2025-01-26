import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { createHash } from "crypto";
import { LessThanOrEqual, Repository } from "typeorm";
import { MagnetMappings } from "./entities/magnet-mappings.entity";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class UrlShortenerService {
  constructor(
    @InjectRepository(MagnetMappings)
    private magnetMappingsRepository: Repository<MagnetMappings>,
  ) {}

  @Cron("0 0 * * *") // runs every day at midnight
  private async dbCleanup(): Promise<void> {
    await this.magnetMappingsRepository.delete({
      expires_at: LessThanOrEqual(new Date()),
    });
  }

  generateShortKey(magnet: string): string {
    const hash = createHash("sha256").update(magnet).digest("hex");
    // return first 8 characters of hash
    return hash.substring(0, 8);
  }

  async shortenUrl(magnet: string): Promise<string> {
    const existingMapping = await this.magnetMappingsRepository.findOne({
      where: { fullMagnet: magnet },
    });

    if (existingMapping) {
      return existingMapping.shortMagnet;
    }

    await this.dbCleanup();

    const shortKey = this.generateShortKey(magnet);
    const ttl = 30 * 24 * 60 * 60 * 1000; // 30 days

    const newMapping = this.magnetMappingsRepository.create({
      shortMagnet: shortKey,
      fullMagnet: magnet,
      expires_at: new Date(Date.now() + ttl),
    });
    await this.magnetMappingsRepository.save(newMapping);

    return shortKey;
  }

  async resolveUrl(shortKey: string): Promise<string | null> {
    const mapping = await this.magnetMappingsRepository.findOne({
      where: { shortMagnet: shortKey },
    });

    if (!mapping) {
      console.log(`Short magnet not found: ${shortKey}`);
      return null;
    }

    return mapping.fullMagnet;
  }
}
