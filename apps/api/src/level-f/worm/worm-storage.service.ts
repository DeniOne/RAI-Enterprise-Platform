import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as Minio from "minio";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { SecretsService } from "../../shared/config/secrets.service";
import { CanonicalJsonBuilder } from "../../shared/crypto/canonical-json.builder";

type WormProvider = "filesystem" | "s3_compatible" | "dual";
type WormRetentionMode = "COMPLIANCE" | "GOVERNANCE";
type WormRetentionUnit = "Years" | "Days";

export interface WormStorageReceipt {
  provider: WormProvider;
  uri: string;
  objectKey: string;
  contentHash: string;
  retentionUntil: Date;
  mirroredUri?: string | null;
}

type WormStorageReadinessDetails = {
  provider: WormProvider;
  ready: boolean;
  objectLockRequired: boolean;
  filesystemPath: string | null;
  bucket: string | null;
  prefix: string | null;
  versioningEnabled: boolean | null;
  objectLockEnabled: boolean | null;
  retentionMode: WormRetentionMode | null;
  retentionUnit: WormRetentionUnit | null;
  retentionValidity: number | null;
};

@Injectable()
export class WormStorageService implements OnModuleInit {
  private readonly logger = new Logger(WormStorageService.name);
  private readonly provider: WormProvider;
  private readonly nodeEnv: string;
  private readonly basePath: string;
  private readonly s3Bucket: string;
  private readonly s3Prefix: string;
  private readonly s3Region: string;
  private readonly allowFilesystemInProduction: boolean;
  private readonly s3ObjectLockRequired: boolean;
  private readonly s3AutoCreateBucket: boolean;
  private readonly s3AutoConfigureDefaultRetention: boolean;
  private readonly defaultRetentionMode: WormRetentionMode;
  private readonly defaultRetentionYears: number;
  private readonly minioUseSsl: boolean;
  private s3ClientReady = false;
  private s3VersioningEnabled: boolean | null = null;
  private s3ObjectLockEnabled: boolean | null = null;
  private s3RetentionMode: WormRetentionMode | null = null;
  private s3RetentionUnit: WormRetentionUnit | null = null;
  private s3RetentionValidity: number | null = null;
  private s3Client?: Minio.Client;

  constructor(
    private readonly config: ConfigService,
    private readonly secretsService: SecretsService,
  ) {
    this.provider = this.resolveProvider();
    this.nodeEnv = (
      this.config.get<string>("NODE_ENV") ||
      process.env.NODE_ENV ||
      "development"
    )
      .toLowerCase()
      .trim();
    this.basePath = this.resolveBasePath();
    this.s3Bucket = this.config.get<string>("WORM_S3_BUCKET") || "";
    this.s3Prefix = (this.config.get<string>("WORM_S3_PREFIX") || "audit-worm")
      .replace(/^\/+|\/+$/g, "");
    this.s3Region = this.config.get<string>("WORM_S3_REGION") || "us-east-1";
    this.allowFilesystemInProduction =
      (
        this.config.get<string>("AUDIT_WORM_ALLOW_FILESYSTEM_IN_PRODUCTION") ||
        "false"
      )
        .toLowerCase()
        .trim() === "true";
    this.s3ObjectLockRequired =
      (this.config.get<string>("WORM_S3_OBJECT_LOCK_REQUIRED") || "true")
        .toLowerCase()
        .trim() !== "false";
    this.s3AutoCreateBucket =
      (this.config.get<string>("WORM_S3_AUTO_CREATE_BUCKET") || "true")
        .toLowerCase()
        .trim() !== "false";
    this.s3AutoConfigureDefaultRetention =
      (
        this.config.get<string>("WORM_S3_AUTO_CONFIGURE_DEFAULT_RETENTION") ||
        "true"
      )
        .toLowerCase()
        .trim() !== "false";
    this.defaultRetentionMode =
      (
        this.config.get<string>("WORM_S3_RETENTION_MODE") || "COMPLIANCE"
      ).toUpperCase() === "GOVERNANCE"
        ? "GOVERNANCE"
        : "COMPLIANCE";
    this.defaultRetentionYears = Math.max(
      Number(this.config.get<string>("WORM_S3_RETENTION_YEARS") || "7"),
      1,
    );
    this.minioUseSsl =
      (this.config.get<string>("MINIO_USE_SSL") || "false")
        .toLowerCase()
        .trim() === "true";
  }

  async onModuleInit(): Promise<void> {
    this.validateRuntimePolicy();
    this.ensureFilesystemRoot();
    await this.initS3();
  }

  isReady(): boolean {
    if (this.provider === "filesystem") {
      return true;
    }

    return this.s3ClientReady;
  }

  getReadinessDetails(): WormStorageReadinessDetails {
    return {
      provider: this.provider,
      ready: this.isReady(),
      objectLockRequired:
        this.provider === "filesystem" ? false : this.s3ObjectLockRequired,
      filesystemPath:
        this.provider === "filesystem" || this.provider === "dual"
          ? this.basePath
          : null,
      bucket: this.provider === "filesystem" ? null : this.s3Bucket || null,
      prefix: this.provider === "filesystem" ? null : this.s3Prefix || null,
      versioningEnabled: this.s3VersioningEnabled,
      objectLockEnabled: this.s3ObjectLockEnabled,
      retentionMode: this.s3RetentionMode,
      retentionUnit: this.s3RetentionUnit,
      retentionValidity: this.s3RetentionValidity,
    };
  }

  describeConfig(): string {
    if (this.provider === "filesystem") {
      return `provider=filesystem,path=${this.basePath}`;
    }

    const bucket = this.s3Bucket || "missing-bucket";
    const suffix =
      this.provider === "dual"
        ? `,mirror=filesystem:${this.basePath}`
        : "";
    const objectLockSummary = this.s3ObjectLockRequired
      ? `,objectLock=${this.s3ObjectLockEnabled ? "enabled" : "disabled"},versioning=${this.s3VersioningEnabled ? "enabled" : "disabled"},defaultRetention=${this.s3RetentionMode || "-"}:${this.s3RetentionUnit || "-"}:${this.s3RetentionValidity ?? "-"}`
      : "";
    return `provider=${this.provider},bucket=${bucket},prefix=${this.s3Prefix}${objectLockSummary}${suffix}`;
  }

  async isObjectAccessible(uri?: string | null): Promise<boolean> {
    if (!uri) {
      return false;
    }

    if (uri.startsWith("file://")) {
      const fileUrl = new URL(uri);
      return fs.existsSync(fileUrl.pathname);
    }

    if (uri.startsWith("s3://")) {
      if (!this.s3ClientReady || !this.s3Client) {
        return false;
      }

      try {
        const s3Url = new URL(uri);
        const bucket = decodeURIComponent(s3Url.hostname);
        const objectKey = decodeURIComponent(s3Url.pathname.replace(/^\/+/, ""));
        await this.s3Client.statObject(bucket, objectKey);
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }

  async uploadImmutableObject(
    key: string,
    payload: unknown,
    retentionYears: number = this.defaultRetentionYears,
  ): Promise<WormStorageReceipt> {
    const buffer = Buffer.from(CanonicalJsonBuilder.stringify(payload), "utf8");
    const retentionUntil = new Date();
    retentionUntil.setUTCFullYear(
      retentionUntil.getUTCFullYear() + retentionYears,
    );
    const contentHash = crypto.createHash("sha256").update(buffer).digest("hex");

    let primaryUri: string;
    let mirroredUri: string | null = null;

    if (this.provider === "filesystem" || this.provider === "dual") {
      primaryUri = await this.writeFilesystemObject(key, buffer);
      if (this.provider === "dual" && this.s3ClientReady) {
        mirroredUri = await this.writeS3Object(key, buffer, retentionUntil);
      }
    } else {
      primaryUri = await this.writeS3Object(key, buffer, retentionUntil);
    }

    return {
      provider: this.provider,
      uri: primaryUri,
      objectKey: key,
      contentHash,
      retentionUntil,
      mirroredUri,
    };
  }

  private resolveProvider(): WormProvider {
    const configured = (
      this.config.get<string>("AUDIT_WORM_PROVIDER") || "filesystem"
    )
      .trim()
      .toLowerCase();

    if (configured === "s3_compatible" || configured === "dual") {
      return configured;
    }

    return "filesystem";
  }

  private resolveBasePath(): string {
    const configured = this.config.get<string>("AUDIT_WORM_BASE_PATH");
    if (configured && configured.trim().length > 0) {
      return path.resolve(configured.trim());
    }

    const workspaceRoot =
      this.findWorkspaceRoot(__dirname) ??
      this.findWorkspaceRoot(process.cwd()) ??
      process.cwd();

    return path.join(workspaceRoot, "var", "audit-worm");
  }

  private findWorkspaceRoot(start: string): string | null {
    let current = path.resolve(start);

    while (true) {
      if (
        fs.existsSync(path.join(current, "pnpm-workspace.yaml")) ||
        fs.existsSync(path.join(current, ".git"))
      ) {
        return current;
      }

      const parent = path.dirname(current);
      if (parent === current) {
        return null;
      }
      current = parent;
    }
  }

  private ensureFilesystemRoot(): void {
    fs.mkdirSync(this.basePath, { recursive: true });
  }

  private validateRuntimePolicy(): void {
    if (
      this.provider === "filesystem" &&
      this.nodeEnv === "production" &&
      !this.allowFilesystemInProduction
    ) {
      throw new Error(
        "AUDIT_WORM_PROVIDER=filesystem запрещён в production без AUDIT_WORM_ALLOW_FILESYSTEM_IN_PRODUCTION=true",
      );
    }

    if (
      this.nodeEnv === "production" &&
      this.provider !== "filesystem" &&
      this.defaultRetentionMode !== "COMPLIANCE"
    ) {
      throw new Error(
        "WORM_S3_RETENTION_MODE должен быть COMPLIANCE в production",
      );
    }
  }

  private async initS3(): Promise<void> {
    if (this.provider === "filesystem") {
      return;
    }

    const accessKey =
      this.secretsService.getOptionalSecret("MINIO_ACCESS_KEY", {
        fallbackKeys: ["MINIO_ROOT_USER"],
      }) || "minio";
    const secretKey =
      this.secretsService.getOptionalSecret("MINIO_SECRET_KEY", {
        fallbackKeys: ["MINIO_ROOT_PASSWORD"],
      }) || "minio123";

    if (!this.s3Bucket) {
      throw new Error(
        "WORM S3 bucket не задан. Укажите WORM_S3_BUCKET для s3_compatible/dual провайдера.",
      );
    }

    this.s3Client = new Minio.Client({
      endPoint: this.config.get<string>("MINIO_ENDPOINT", "localhost"),
      port: this.config.get<number>("MINIO_PORT", 9000),
      useSSL: this.minioUseSsl,
      accessKey,
      secretKey,
    });

    try {
      await this.ensureS3BucketPrepared();
      this.s3ClientReady = true;
      this.logger.log(
        `WORM S3 client initialized. bucket=${this.s3Bucket}, prefix=${this.s3Prefix || "-"}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Не удалось инициализировать WORM S3 client: ${error?.message || error}`,
      );
      this.s3ClientReady = false;
      throw error;
    }
  }

  private async ensureS3BucketPrepared(): Promise<void> {
    if (!this.s3Client) {
      throw new Error("WORM S3 client is not initialized");
    }

    const exists = await this.s3Client.bucketExists(this.s3Bucket);
    if (!exists) {
      if (!this.s3AutoCreateBucket) {
        throw new Error(
          `WORM bucket ${this.s3Bucket} не существует и WORM_S3_AUTO_CREATE_BUCKET=false`,
        );
      }

      await this.s3Client.makeBucket(this.s3Bucket, this.s3Region, {
        ObjectLocking: this.s3ObjectLockRequired,
      });
    }

    await this.ensureBucketVersioning();

    if (!this.s3ObjectLockRequired) {
      return;
    }

    let objectLockConfig = await this.readObjectLockConfig();
    if (!this.isObjectLockEnabled(objectLockConfig)) {
      throw new Error(
        `Bucket ${this.s3Bucket} не имеет Object Lock. Создайте новый bucket с ObjectLocking=true.`,
      );
    }

    if (!this.matchesDefaultRetention(objectLockConfig)) {
      if (!this.s3AutoConfigureDefaultRetention) {
        throw new Error(
          `Bucket ${this.s3Bucket} не имеет ожидаемой default retention policy (${this.defaultRetentionMode}/${this.defaultRetentionYears}y)`,
        );
      }

      await this.s3Client.setObjectLockConfig(this.s3Bucket, {
        mode: this.defaultRetentionMode,
        unit: "Years",
        validity: this.defaultRetentionYears,
      });
      objectLockConfig = await this.readObjectLockConfig();
    }

    this.captureObjectLockConfig(objectLockConfig);

    if (!this.matchesDefaultRetention(objectLockConfig)) {
      throw new Error(
        `Bucket ${this.s3Bucket} не подтвердил default retention policy ${this.defaultRetentionMode}/${this.defaultRetentionYears}y`,
      );
    }
  }

  private async ensureBucketVersioning(): Promise<void> {
    if (!this.s3Client) {
      throw new Error("WORM S3 client is not initialized");
    }

    const current = await this.s3Client.getBucketVersioning(this.s3Bucket);
    const currentStatus = this.extractVersioningStatus(current);

    if (currentStatus !== "Enabled") {
      await this.s3Client.setBucketVersioning(this.s3Bucket, {
        Status: "Enabled",
      });
    }

    const updated = await this.s3Client.getBucketVersioning(this.s3Bucket);
    this.s3VersioningEnabled =
      this.extractVersioningStatus(updated) === "Enabled";

    if (!this.s3VersioningEnabled) {
      throw new Error(
        `Bucket ${this.s3Bucket} не подтвердил Versioning=Enabled`,
      );
    }
  }

  private extractVersioningStatus(payload: unknown): string | null {
    if (!payload || typeof payload !== "object") {
      return null;
    }

    const record = payload as Record<string, unknown>;
    const value = record.Status ?? record.status ?? null;
    return typeof value === "string" ? value : null;
  }

  private async readObjectLockConfig(): Promise<any> {
    if (!this.s3Client) {
      throw new Error("WORM S3 client is not initialized");
    }

    try {
      return await this.s3Client.getObjectLockConfig(this.s3Bucket);
    } catch (error: any) {
      const message = String(error?.message || error || "");
      if (
        message.includes("ObjectLockConfigurationNotFoundError") ||
        message.includes("object lock configuration") ||
        message.includes("Object Lock configuration")
      ) {
        return {};
      }
      throw error;
    }
  }

  private captureObjectLockConfig(config: any): void {
    this.s3ObjectLockEnabled = this.isObjectLockEnabled(config);
    this.s3RetentionMode =
      config?.mode === "GOVERNANCE" ? "GOVERNANCE" : config?.mode || null;
    this.s3RetentionUnit =
      config?.unit === "Days" || config?.unit === "Years" ? config.unit : null;
    this.s3RetentionValidity =
      typeof config?.validity === "number" ? config.validity : null;
  }

  private isObjectLockEnabled(config: any): boolean {
    return config?.objectLockEnabled === "Enabled";
  }

  private matchesDefaultRetention(config: any): boolean {
    return (
      this.isObjectLockEnabled(config) &&
      config?.mode === this.defaultRetentionMode &&
      config?.unit === "Years" &&
      Number(config?.validity) === this.defaultRetentionYears
    );
  }

  private async writeFilesystemObject(
    key: string,
    buffer: Buffer,
  ): Promise<string> {
    const normalizedKey = key.replace(/^\/+/, "");
    const fullPath = path.join(this.basePath, normalizedKey);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, buffer, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o440,
    });
    return `file://${fullPath}`;
  }

  private async writeS3Object(
    key: string,
    buffer: Buffer,
    retentionUntil: Date,
  ): Promise<string> {
    if (!this.s3ClientReady || !this.s3Client) {
      throw new Error("WORM S3 storage is not ready");
    }

    const normalizedKey = [this.s3Prefix, key.replace(/^\/+/, "")]
      .filter(Boolean)
      .join("/");

    const uploaded = await this.s3Client.putObject(
      this.s3Bucket,
      normalizedKey,
      buffer,
      buffer.byteLength,
      {
        "Content-Type": "application/json",
        "x-amz-object-lock-mode": "COMPLIANCE",
        "x-amz-object-lock-retain-until-date": retentionUntil.toISOString(),
      },
    );

    if (this.s3ObjectLockRequired) {
      if (!uploaded.versionId) {
        throw new Error(
          `WORM object ${normalizedKey} загружен без versionId; retention enforcement не подтверждён`,
        );
      }

      let retention = await this.s3Client.getObjectRetention(
        this.s3Bucket,
        normalizedKey,
        {
          versionId: uploaded.versionId,
        },
      );

      if (!this.matchesObjectRetention(retention, retentionUntil)) {
        await this.s3Client.putObjectRetention(this.s3Bucket, normalizedKey, {
          versionId: uploaded.versionId,
          mode: this.defaultRetentionMode,
          retainUntilDate: retentionUntil.toISOString(),
        });

        retention = await this.s3Client.getObjectRetention(
          this.s3Bucket,
          normalizedKey,
          {
            versionId: uploaded.versionId,
          },
        );

        if (!this.matchesObjectRetention(retention, retentionUntil)) {
          throw new Error(
            `WORM retention verification failed for object ${normalizedKey}`,
          );
        }
      }
    }

    return `s3://${this.s3Bucket}/${normalizedKey}`;
  }

  private matchesObjectRetention(
    retention: { mode?: string; retainUntilDate?: string } | null | undefined,
    retentionUntil: Date,
  ): boolean {
    if (!retention || retention.mode !== this.defaultRetentionMode) {
      return false;
    }

    if (!retention.retainUntilDate) {
      return false;
    }

    const actualTs = new Date(retention.retainUntilDate).getTime();
    const expectedTs = retentionUntil.getTime();

    if (!Number.isFinite(actualTs)) {
      return false;
    }

    return Math.abs(actualTs - expectedTs) <= 1000;
  }
}
