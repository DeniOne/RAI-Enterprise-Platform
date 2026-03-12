import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as Minio from "minio";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { SecretsService } from "../../shared/config/secrets.service";
import { CanonicalJsonBuilder } from "../../shared/crypto/canonical-json.builder";

type WormProvider = "filesystem" | "s3_compatible" | "dual";

export interface WormStorageReceipt {
  provider: WormProvider;
  uri: string;
  objectKey: string;
  contentHash: string;
  retentionUntil: Date;
  mirroredUri?: string | null;
}

@Injectable()
export class WormStorageService implements OnModuleInit {
  private readonly logger = new Logger(WormStorageService.name);
  private readonly provider: WormProvider;
  private readonly basePath: string;
  private readonly s3Bucket: string;
  private readonly s3Prefix: string;
  private s3ClientReady = false;
  private s3Client?: Minio.Client;

  constructor(
    private readonly config: ConfigService,
    private readonly secretsService: SecretsService,
  ) {
    this.provider = this.resolveProvider();
    this.basePath = this.resolveBasePath();
    this.s3Bucket = this.config.get<string>("WORM_S3_BUCKET") || "";
    this.s3Prefix = (this.config.get<string>("WORM_S3_PREFIX") || "audit-worm")
      .replace(/^\/+|\/+$/g, "");
  }

  async onModuleInit(): Promise<void> {
    this.ensureFilesystemRoot();
    await this.initS3();
  }

  isReady(): boolean {
    if (this.provider === "filesystem") {
      return true;
    }

    return this.s3ClientReady;
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
    return `provider=${this.provider},bucket=${bucket},prefix=${this.s3Prefix}${suffix}`;
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
    retentionYears: number = 7,
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
      this.logger.warn(
        "WORM S3 bucket не задан. Контур останется без S3-зеркала.",
      );
      this.s3ClientReady = false;
      return;
    }

    this.s3Client = new Minio.Client({
      endPoint: this.config.get<string>("MINIO_ENDPOINT", "localhost"),
      port: this.config.get<number>("MINIO_PORT", 9000),
      useSSL: this.config.get<boolean>("MINIO_USE_SSL", false),
      accessKey,
      secretKey,
    });

    try {
      const exists = await this.s3Client.bucketExists(this.s3Bucket);
      if (!exists) {
        await this.s3Client.makeBucket(this.s3Bucket, "us-east-1");
      }
      this.s3ClientReady = true;
      this.logger.log(
        `WORM S3 client initialized. bucket=${this.s3Bucket}, prefix=${this.s3Prefix || "-"}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Не удалось инициализировать WORM S3 client: ${error?.message || error}`,
      );
      this.s3ClientReady = false;
    }
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

    await this.s3Client.putObject(
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

    return `s3://${this.s3Bucket}/${normalizedKey}`;
  }
}
