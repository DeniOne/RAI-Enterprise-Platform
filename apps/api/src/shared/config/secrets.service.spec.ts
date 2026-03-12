import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { SecretsService } from "./secrets.service";

describe("SecretsService", () => {
  it("читает секрет напрямую из config", () => {
    const service = new SecretsService(
      new ConfigService({ DIRECT_SECRET: "value-1" }),
    );

    expect(service.getRequiredSecret("DIRECT_SECRET")).toBe("value-1");
  });

  it("читает секрет через *_FILE", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "rai-secrets-"));
    const secretFile = path.join(directory, "secret.txt");
    fs.writeFileSync(secretFile, "value-from-file\n", "utf8");

    try {
      const service = new SecretsService(
        new ConfigService({ FILE_SECRET_FILE: secretFile }),
      );

      expect(service.getRequiredSecret("FILE_SECRET")).toBe("value-from-file");
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });

  it("поддерживает fallbackKeys", () => {
    const service = new SecretsService(
      new ConfigService({ PRIMARY_FALLBACK: "fallback-value" }),
    );

    expect(
      service.getRequiredSecret("PRIMARY_SECRET", {
        fallbackKeys: ["PRIMARY_FALLBACK"],
      }),
    ).toBe("fallback-value");
  });
});
