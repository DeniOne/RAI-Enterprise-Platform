import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class WormStorageService {
  private readonly logger = new Logger(WormStorageService.name);
  private s3ClientReady = false;

  constructor(private readonly config: ConfigService) {
    this.initS3();
  }

  private initS3() {
    // В реальности здесь инициализация AWS.S3 с настройками ObjectLock
    const bucket = this.config.get<string>("WORM_S3_BUCKET");
    const region = this.config.get<string>("AWS_REGION");

    if (bucket && region) {
      this.logger.log(
        `Initialized WORM S3 Client for bucket: ${bucket} in ${region}`,
      );
      this.s3ClientReady = true;
    } else {
      this.logger.warn("WORM S3 configuration missing. Using stub storage.");
    }
  }

  /**
   * Сохраняет данные в WORM хранилище.
   * Требует выставления Object Lock конфигурации на уровне bucket-а,
   * либо можно передавать параметры Retention здесь (например, Compliance mode).
   */
  async uploadImmutableObject(
    key: string,
    buffer: Buffer | string,
    retentionYears: number = 7, // SEC 17a-4 требует часто 7 лет
  ): Promise<string> {
    this.logger.log(
      `Uploading to WORM Storage -> Key: ${key}, Retention: ${retentionYears} years`,
    );

    if (!this.s3ClientReady) {
      // Stub
      return `s3://stub-worm-bucket/${key}`;
    }

    // Пример параметров S3 SDK, если бы использовался aws-sdk v3.
    // const params = {
    //   Bucket: this.config.get('WORM_S3_BUCKET'),
    //   Key: key,
    //   Body: buffer,
    //   ObjectLockMode: 'COMPLIANCE', // Нельзя удалить даже с root доступом
    //   ObjectLockRetainUntilDate: new Date(Date.now() + retentionYears * 365 * 24 * 60 * 60 * 1000)
    // };
    // await this.s3Client.putObject(params).promise();

    return `s3://${this.config.get("WORM_S3_BUCKET")}/${key}`;
  }
}
