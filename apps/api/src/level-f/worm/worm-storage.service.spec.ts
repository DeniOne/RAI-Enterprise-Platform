import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as Minio from "minio";
import { WormStorageService } from "./worm-storage.service";
import { SecretsService } from "../../shared/config/secrets.service";

describe("WormStorageService", () => {
  const originalClient = (Minio as any).Client;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    (Minio as any).Client = originalClient;
    jest.restoreAllMocks();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("пишет immutable object в filesystem WORM path и запрещает overwrite", async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "rai-worm-"));

    try {
      const service = new WormStorageService(
        new ConfigService({
          AUDIT_WORM_PROVIDER: "filesystem",
          AUDIT_WORM_BASE_PATH: directory,
        }),
        new SecretsService(new ConfigService({})),
      );

      await service.onModuleInit();

      const receipt = await service.uploadImmutableObject(
        "audit-logs/company-1/test.json",
        { hello: "world" },
      );

      expect(receipt.provider).toBe("filesystem");
      expect(receipt.uri.startsWith("file://")).toBe(true);

      const fullPath = receipt.uri.replace("file://", "");
      expect(fs.existsSync(fullPath)).toBe(true);

      await expect(
        service.uploadImmutableObject(
          "audit-logs/company-1/test.json",
          { hello: "again" },
        ),
      ).rejects.toThrow();
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });

  it("разрешает default WORM path от корня workspace, а не от cwd процесса", async () => {
    const originalCwd = process.cwd();
    const fakeCwd = fs.mkdtempSync(path.join(os.tmpdir(), "rai-worm-cwd-"));
    const workspaceRoot = path.resolve(__dirname, "../../../../../");

    try {
      process.chdir(fakeCwd);

      const service = new WormStorageService(
        new ConfigService({
          AUDIT_WORM_PROVIDER: "filesystem",
        }),
        new SecretsService(new ConfigService({})),
      );

      await service.onModuleInit();

      expect(service.describeConfig()).toContain(
        `path=${path.join(workspaceRoot, "var", "audit-worm")}`,
      );
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(fakeCwd, { recursive: true, force: true });
    }
  });

  it("инициализирует s3-compatible WORM bucket с Object Lock и default retention", async () => {
    const mockClient = {
      bucketExists: jest.fn().mockResolvedValue(false),
      makeBucket: jest.fn().mockResolvedValue(undefined),
      getBucketVersioning: jest
        .fn()
        .mockResolvedValueOnce({ Status: "Suspended" })
        .mockResolvedValueOnce({ Status: "Enabled" }),
      setBucketVersioning: jest.fn().mockResolvedValue(undefined),
      getObjectLockConfig: jest
        .fn()
        .mockResolvedValueOnce({ objectLockEnabled: "Enabled" })
        .mockResolvedValueOnce({
          objectLockEnabled: "Enabled",
          mode: "COMPLIANCE",
          unit: "Years",
          validity: 7,
        }),
      setObjectLockConfig: jest.fn().mockResolvedValue(undefined),
      putObject: jest.fn().mockResolvedValue({
        etag: "etag-1",
        versionId: "version-1",
      }),
      putObjectRetention: jest.fn().mockResolvedValue(undefined),
      getObjectRetention: jest.fn(),
      statObject: jest.fn().mockResolvedValue({}),
    };

    let retainedUntil = "";
    mockClient.putObjectRetention.mockImplementation(
      async (_bucket: string, _key: string, opts: { retainUntilDate: string }) => {
        retainedUntil = opts.retainUntilDate;
      },
    );
    mockClient.getObjectRetention.mockImplementation(async () => ({
      mode: "COMPLIANCE",
      retainUntilDate: retainedUntil,
    }));

    (Minio as any).Client = jest.fn(() => mockClient);

    const service = new WormStorageService(
      new ConfigService({
        AUDIT_WORM_PROVIDER: "s3_compatible",
        WORM_S3_BUCKET: "rai-audit-worm",
        WORM_S3_PREFIX: "audit-worm",
        WORM_S3_RETENTION_MODE: "COMPLIANCE",
        WORM_S3_RETENTION_YEARS: "7",
        WORM_S3_AUTO_CREATE_BUCKET: "true",
        WORM_S3_AUTO_CONFIGURE_DEFAULT_RETENTION: "true",
        MINIO_ENDPOINT: "localhost",
        MINIO_PORT: 9000,
      }),
      new SecretsService(
        new ConfigService({
          MINIO_ROOT_USER: "rai_admin",
          MINIO_ROOT_PASSWORD: "rai_secret_password",
        }),
      ),
    );

    await service.onModuleInit();

    expect(mockClient.makeBucket).toHaveBeenCalledWith("rai-audit-worm", "us-east-1", {
      ObjectLocking: true,
    });
    expect(mockClient.setBucketVersioning).toHaveBeenCalledWith(
      "rai-audit-worm",
      { Status: "Enabled" },
    );
    expect(mockClient.setObjectLockConfig).toHaveBeenCalledWith(
      "rai-audit-worm",
      {
        mode: "COMPLIANCE",
        unit: "Years",
        validity: 7,
      },
    );

    const receipt = await service.uploadImmutableObject(
      "audit-logs/company-1/test.json",
      { hello: "world" },
    );

    expect(receipt.provider).toBe("s3_compatible");
    expect(receipt.uri).toBe("s3://rai-audit-worm/audit-worm/audit-logs/company-1/test.json");
    expect(mockClient.putObject).toHaveBeenCalledWith(
      "rai-audit-worm",
      "audit-worm/audit-logs/company-1/test.json",
      expect.any(Buffer),
      expect.any(Number),
      expect.objectContaining({
        "x-amz-object-lock-mode": "COMPLIANCE",
      }),
    );
    expect(mockClient.putObjectRetention).toHaveBeenCalledWith(
      "rai-audit-worm",
      "audit-worm/audit-logs/company-1/test.json",
      expect.objectContaining({
        versionId: "version-1",
        mode: "COMPLIANCE",
      }),
    );
    expect(service.isReady()).toBe(true);
    expect(service.getReadinessDetails()).toMatchObject({
      provider: "s3_compatible",
      ready: true,
      objectLockRequired: true,
      bucket: "rai-audit-worm",
      versioningEnabled: true,
      objectLockEnabled: true,
      retentionMode: "COMPLIANCE",
      retentionUnit: "Years",
      retentionValidity: 7,
    });
  });

  it("роняет инициализацию, если bucket существует без Object Lock", async () => {
    const mockClient = {
      bucketExists: jest.fn().mockResolvedValue(true),
      getBucketVersioning: jest.fn().mockResolvedValue({ Status: "Enabled" }),
      setBucketVersioning: jest.fn().mockResolvedValue(undefined),
      getObjectLockConfig: jest.fn().mockResolvedValue({}),
    };

    (Minio as any).Client = jest.fn(() => mockClient);

    const service = new WormStorageService(
      new ConfigService({
        AUDIT_WORM_PROVIDER: "s3_compatible",
        WORM_S3_BUCKET: "rai-audit-worm",
        WORM_S3_OBJECT_LOCK_REQUIRED: "true",
      }),
      new SecretsService(
        new ConfigService({
          MINIO_ROOT_USER: "rai_admin",
          MINIO_ROOT_PASSWORD: "rai_secret_password",
        }),
      ),
    );

    await expect(service.onModuleInit()).rejects.toThrow(/Object Lock/i);
  });

  it("запрещает filesystem provider в production без явного override", async () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "rai-worm-prod-"));

    try {
      process.env.NODE_ENV = "production";

      const service = new WormStorageService(
        new ConfigService({
          NODE_ENV: "production",
          AUDIT_WORM_PROVIDER: "filesystem",
          AUDIT_WORM_BASE_PATH: directory,
        }),
        new SecretsService(new ConfigService({})),
      );

      await expect(service.onModuleInit()).rejects.toThrow(
        /filesystem запрещён в production/i,
      );
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });
});
