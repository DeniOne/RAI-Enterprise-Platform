import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { WormStorageService } from "./worm-storage.service";
import { SecretsService } from "../../shared/config/secrets.service";

describe("WormStorageService", () => {
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
});
