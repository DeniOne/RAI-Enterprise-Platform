import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression } from "@nestjs/schedule";
import * as Minio from "minio";
import { RedisService } from "../redis/redis.service";
import { PrismaService } from "../prisma/prisma.service";

export enum MLJobStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  SUCCEEDED = "SUCCEEDED",
  FAILED = "FAILED",
  OOM = "OOM",
  QUARANTINED = "QUARANTINED",
}

@Injectable()
export class S3Service implements OnModuleInit {
  private client: Minio.Client;
  private readonly logger = new Logger(S3Service.name);
  private isAvailable = false;

  constructor(
    private configService: ConfigService,
    private redis: RedisService,
    private prisma: PrismaService,
  ) {
    this.client = new Minio.Client({
      endPoint: this.configService.get<string>("MINIO_ENDPOINT", "localhost"),
      port: this.configService.get<number>("MINIO_PORT", 9000),
      useSSL: this.configService.get<boolean>("MINIO_USE_SSL", false),
      accessKey: this.configService.get<string>("MINIO_ACCESS_KEY", "minio"),
      secretKey: this.configService.get<string>("MINIO_SECRET_KEY", "minio123"),
    });
  }

  async onModuleInit() {
    try {
      const exists = await this.client.bucketExists("rai-artifacts");
      if (!exists) {
        await this.client.makeBucket("rai-artifacts", "us-east-1");
      }
      this.isAvailable = true;
      this.logger.log("📦 S3 Storage (Minio) is ready.");
    } catch (e) {
      this.logger.error(`❌ S3 Connection failed: ${e.message}`);
    }
  }

  getStatus(): boolean {
    return this.isAvailable;
  }

  /**
   * Проверяет существование объекта и его целостность.
   * Ожидает путь в формате s3://bucket/key или просто bucket/key.
   */
  async validateObjectIntegrity(
    path: string,
    expectedHash: string,
  ): Promise<boolean> {
    try {
      if (!this.isAvailable) return false;

      const cleanPath = path.replace("s3://", "");
      const [bucket, ...keyParts] = cleanPath.split("/");
      const key = keyParts.join("/");

      // Проверка доступности бакета
      const bucketExists = await this.client.bucketExists(bucket);
      if (!bucketExists) {
        this.logger.error(`❌ S3 bucket '${bucket}' does not exist.`);
        return false;
      }

      this.logger.debug(
        `🔍 Validating S3 object: bucket=${bucket}, key=${key}`,
      );

      const info = await this.client.statObject(bucket, key);

      // Проверка на атомарность / полноту загрузки
      if (info.size === 0) {
        this.logger.error(
          `❌ S3 object ${key} is empty (0 bytes)! Partial upload suspected.`,
        );
        return false;
      }

      this.logger.debug(
        `✅ S3 object validated: size=${info.size}, etag=${info.etag}`,
      );

      // Сравнение хеша (ETag)
      if (
        expectedHash &&
        info.etag !== expectedHash &&
        !info.etag.includes(expectedHash)
      ) {
        this.logger.warn(
          `⚠️ Hash mismatch for ${key}. Expected: ${expectedHash}, Got: ${info.etag}`,
        );
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(
        `❌ S3 Integrity Check failed for ${path}: ${error.message}`,
      );
      return false;
    }
  }
}
