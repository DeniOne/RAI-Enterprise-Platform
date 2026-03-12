import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import * as http from "http";
import { AddressInfo } from "net";
import { HsmService } from "./hsm.service";
import { SecretsService } from "../../shared/config/secrets.service";

describe("HsmService", () => {
  it("подписывает payload через memory provider и подпись проходит verify", async () => {
    const service = new HsmService(
      new ConfigService({
        NODE_ENV: "development",
        HSM_PROVIDER: "memory",
        HSM_SIGNING_KEY_NAME: "institutional-jwt-mstr",
      }),
      new SecretsService(
        new ConfigService({
          NODE_ENV: "development",
          HSM_PROVIDER: "memory",
          HSM_SIGNING_KEY_NAME: "institutional-jwt-mstr",
        }),
      ),
    );

    const keyReference = await service.getActiveKeyReference();
    const publicKey = await service.exportPublicKey(keyReference);
    const signature = await service.signEd25519("payload-123", keyReference);

    expect(keyReference.kid).toBe("institutional-jwt-mstr");
    expect(
      crypto.verify(
        null,
        Buffer.from("payload-123"),
        publicKey,
        Buffer.from(signature, "base64url"),
      ),
    ).toBe(true);
  });

  it("инициализирует Vault Transit, создаёт ключ и возвращает JWT-совместимую подпись", async () => {
    const { privateKey, publicKey } = crypto.generateKeyPairSync("ed25519");
    let keyCreated = false;

    const server = http.createServer(async (request, response) => {
      const chunks: Buffer[] = [];
      for await (const chunk of request) {
        chunks.push(Buffer.from(chunk));
      }

      const body = chunks.length
        ? JSON.parse(Buffer.concat(chunks).toString("utf8"))
        : undefined;

      if (
        request.method === "GET" &&
        request.url === "/v1/transit/keys/institutional-jwt-mstr"
      ) {
        if (!keyCreated) {
          response.writeHead(404, { "Content-Type": "application/json" });
          response.end(JSON.stringify({ errors: ["not found"] }));
          return;
        }

        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(
          JSON.stringify({
            data: {
              name: "institutional-jwt-mstr",
              latest_version: 7,
            },
          }),
        );
        return;
      }

      if (
        request.method === "POST" &&
        request.url === "/v1/transit/keys/institutional-jwt-mstr"
      ) {
        keyCreated = true;
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ data: { created: true } }));
        return;
      }

      if (
        request.method === "GET" &&
        [
          "/v1/transit/export/public-key/institutional-jwt-mstr/latest",
          "/v1/transit/export/public-key/institutional-jwt-mstr/7",
        ].includes(request.url || "")
      ) {
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(
          JSON.stringify({
            data: {
              keys: {
                "7": {
                  public_key: publicKey
                    .export({ format: "pem", type: "spki" })
                    .toString(),
                },
              },
            },
          }),
        );
        return;
      }

      if (
        request.method === "POST" &&
        request.url === "/v1/transit/sign/institutional-jwt-mstr"
      ) {
        const payload = Buffer.from(body.input, "base64");
        const signature = crypto
          .sign(null, payload, privateKey)
          .toString("base64");

        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(
          JSON.stringify({
            data: {
              signature: `vault:v7:${signature}`,
            },
          }),
        );
        return;
      }

      response.writeHead(404, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ errors: ["unexpected route"] }));
    });

    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address() as AddressInfo;

    try {
      const service = new HsmService(
        new ConfigService({
          NODE_ENV: "production",
          HSM_PROVIDER: "vault-transit",
          HSM_VAULT_ADDR: `http://127.0.0.1:${address.port}`,
          HSM_VAULT_TOKEN: "test-token",
          HSM_VAULT_KEY_AUTO_CREATE: "true",
          HSM_SIGNING_KEY_NAME: "institutional-jwt-mstr",
        }),
        new SecretsService(
          new ConfigService({
            NODE_ENV: "production",
            HSM_PROVIDER: "vault-transit",
            HSM_VAULT_ADDR: `http://127.0.0.1:${address.port}`,
            HSM_VAULT_TOKEN: "test-token",
            HSM_VAULT_KEY_AUTO_CREATE: "true",
            HSM_SIGNING_KEY_NAME: "institutional-jwt-mstr",
          }),
        ),
      );

      await service.onModuleInit();

      const keyReference = await service.getActiveKeyReference();
      const signature = await service.signEd25519("vault-payload", keyReference);
      const publicKeyPem = await service.exportPublicKey(keyReference);

      expect(keyReference.kid).toBe("institutional-jwt-mstr:v7");
      expect(
        crypto.verify(
          null,
          Buffer.from("vault-payload"),
          publicKeyPem,
          Buffer.from(signature, "base64url"),
        ),
      ).toBe(true);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });
});
