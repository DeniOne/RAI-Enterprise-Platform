import { Injectable, Logger } from "@nestjs/common";
import { RedisService } from "../../../shared/redis/redis.service";

@Injectable()
export class CooldownManager {
  private readonly logger = new Logger(CooldownManager.name);
  private readonly DEFAULT_COOLDOWN = 3600; // 1 час по умолчанию

  constructor(private readonly redis: RedisService) {}

  /**
   * Устанавливает период ожидания для конкретной фичи тенанта.
   */
  async setCooldown(
    companyId: string,
    featureId: string,
    durationSeconds: number = this.DEFAULT_COOLDOWN,
  ) {
    const key = `rai:cooldown:${companyId}:${featureId}`;
    this.logger.warn(
      `🛑 Setting cooldown for ${featureId} (${companyId}): ${durationSeconds}s`,
    );
    await this.redis.set(key, "ACTIVE", durationSeconds);
  }

  /**
   * Проверяет, находится ли процесс переобучения под блокировкой.
   */
  async isUnderCooldown(
    companyId: string,
    featureId: string,
  ): Promise<boolean> {
    const key = `rai:cooldown:${companyId}:${featureId}`;
    return await this.redis.exists(key);
  }
}
