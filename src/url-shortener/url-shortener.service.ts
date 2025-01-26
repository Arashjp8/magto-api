import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { createHash } from "crypto";
import { LessThanOrEqual, Repository } from "typeorm";
import { MagnetMappings } from "./entities/magnet-mappings.entity";
import { Cron } from "@nestjs/schedule";

const CRON_SCHEDULE = "0 0 * * *";
const TTL_IN_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

@Injectable()
export class UrlShortenerService {
  private logger = new Logger(UrlShortenerService.name);

  constructor(
    @InjectRepository(MagnetMappings)
    private magnetMappingsRepository: Repository<MagnetMappings>,
  ) {}

  @Cron(CRON_SCHEDULE) // runs every day at midnight
  private async _dbCleanup(): Promise<void> {
    try {
      const deleteResult = await this.magnetMappingsRepository.delete({
        expires_at: LessThanOrEqual(new Date()),
      });

      if (deleteResult.affected) {
        this.logger.log(
          `Database cleanup completed: ${deleteResult.affected} records removed.`,
        );
      } else {
        this.logger.log("Database cleanup completed: No records to delete.");
      }
    } catch (error) {
      this.logger.error("Error during database cleanup.", error.stack);
    }
  }

  private generateShortKey(magnet: string): string {
    const hash = createHash("sha256").update(magnet).digest("hex");
    return hash.substring(0, 8); // return first 8 characters of hash
  }

  private createMapping(
    shortMagnet: string,
    fullMagnet: string,
  ): MagnetMappings {
    return this.magnetMappingsRepository.create({
      shortMagnet,
      fullMagnet,
      expires_at: new Date(Date.now() + TTL_IN_MS),
    });
  }

  async shortenUrl(magnet: string): Promise<string> {
    const existingMapping = await this.magnetMappingsRepository.findOne({
      where: { fullMagnet: magnet },
    });

    if (existingMapping) {
      return existingMapping.shortMagnet;
    }

    const shortKey = this.generateShortKey(magnet);
    const newMapping = this.createMapping(shortKey, magnet);

    await this.magnetMappingsRepository.save(newMapping);

    return shortKey;
  }

  async resolveUrl(shortKey: string): Promise<string | null> {
    try {
      const mapping = await this.magnetMappingsRepository.findOne({
        where: { shortMagnet: shortKey },
      });

      if (!mapping) {
        console.log(`Short magnet not found: ${shortKey}`);
        return null;
      }

      return mapping.fullMagnet;
    } catch (error) {
      this.logger.error(`Error resolving shortKey ${shortKey}:`, error.stack);
      throw new Error("Unable to resolve URL");
    }
  }
}
