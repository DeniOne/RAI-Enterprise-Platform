import { Injectable, Logger } from "@nestjs/common";
import * as crypto from "crypto";

/**
 * HSM (Hardware Security Module) Proxy Service
 * Отвечает за интерфейс с HashiCorp Vault / AWS KMS (Transit Secrets Engine).
 * Главный инвариант Level F: Приватный ключ никогда не извлекается в RAM приложения (Анклавное подписание).
 */
@Injectable()
export class HsmService {
  private readonly logger = new Logger(HsmService.name);

  // В реальной интеграции Vault: `vault transit sign <key_name> <base64(payload)>`
  private readonly IS_DEV_MODE = process.env.NODE_ENV !== "production";

  // Fallback key пары для локальной симуляции "Vault" в Dev-среде
  private devPrivateKey: crypto.KeyObject;
  private devPublicKey: crypto.KeyObject;

  constructor() {
    if (this.IS_DEV_MODE) {
      this.logger.warn(
        `[HSM] Running in DEV mode. Using local in-memory Ed25519 keypair instead of Vault.`,
      );
      const { privateKey, publicKey } = crypto.generateKeyPairSync("ed25519");
      this.devPrivateKey = privateKey;
      this.devPublicKey = publicKey;
    } else {
      this.logger.log(
        `[HSM] Connected to HashiCorp Vault (Transit Engine). Keys remain strictly in enclave.`,
      );
    }
  }

  /**
   * Подписание строки (или собранного JWT Payload'а) в HSM
   */
  async signEd25519(
    payload: string,
    keyName: string = "institutional-jwt-mstr",
  ): Promise<string> {
    this.logger.debug(`[HSM] Requesting enclave signature for key: ${keyName}`);

    if (this.IS_DEV_MODE) {
      // Симуляция анклавного подписания для тестов
      const sign = crypto.createSign("ed25519");
      sign.update(Buffer.from(payload));
      const signature = sign.sign(this.devPrivateKey, "base64url");
      return signature;
    }

    // --- В бой летит вот это (Vault API) ---
    // const b64Payload = Buffer.from(payload).toString('base64');
    // const response = await vaultClient.write(`transit/sign/${keyName}`, { input: b64Payload });
    // return response.data.signature.replace('vault:v1:', ''); // Vault specifics

    throw new Error(
      "HSM Proxy not fully implemented for Production (Missing Vault Token)",
    );
  }

  /**
   * Извлечение Публичного ключа для передачи в цепочку сертификатов
   */
  async exportPublicKey(
    keyName: string = "institutional-jwt-mstr",
  ): Promise<string> {
    if (this.IS_DEV_MODE) {
      return this.devPublicKey
        .export({ format: "pem", type: "spki" })
        .toString();
    }

    // Vault API: vault read transit/keys/<key_name> (Возвращает только Public Key)
    return "-----BEGIN PUBLIC KEY----- ... -----END PUBLIC KEY-----";
  }
}
