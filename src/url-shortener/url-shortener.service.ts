import { Injectable } from "@nestjs/common";
import { createHash } from "crypto";
import { InjectRepository } from "@nestjs/typeorm";
import { MagnetMappings } from "./entities/magnet-mappings.entity";
import { Repository } from "typeorm";

@Injectable()
export class UrlShortenerService {
  constructor(
    @InjectRepository(MagnetMappings)
    private magnetMappingsRepository: Repository<MagnetMappings>,
  ) {}

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

    const count = await this.magnetMappingsRepository.count();
    if (count >= 100) {
      for (let i = 0; i <= count - 100; i++) {
        const oldestRecord = await this.magnetMappingsRepository
          .createQueryBuilder()
          .orderBy("created_at", "ASC")
          .addOrderBy("id", "ASC")
          .limit(1)
          .getOne();

        if (oldestRecord) {
          await this.magnetMappingsRepository.remove(oldestRecord);
        }
      }
    }

    const shortKey = this.generateShortKey(magnet);

    const newMapping = this.magnetMappingsRepository.create({
      shortMagnet: shortKey,
      fullMagnet: magnet,
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
