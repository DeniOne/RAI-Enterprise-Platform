import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";
import * as crypto from "crypto";
import * as https from "https";
import * as fs from "fs";
import {
  parseBooleanSetting,
} from "../../shared/config/secret-value.util";
import { SecretsService } from "../../shared/config/secrets.service";

type HsmProvider = "memory" | "vault-transit";

export interface HsmKeyReference {
  provider: HsmProvider;
  keyName: string;
  keyVersion?: number;
  kid: string;
}

interface VaultKeyReadResponse {
  latest_version?: number;
  name?: string;
  keys?: Record<string, { public_key?: string }>;
}

/**
 * HSM (Hardware Security Module) Proxy Service
 * Отвечает за интерфейс с HashiCorp Vault / AWS KMS (Transit Secrets Engine).
 * Главный инвариант Level F: Приватный ключ никогда не извлекается в RAM приложения (Анклавное подписание).
 */
@Injectable()
export class HsmService implements OnModuleInit {
  private readonly logger = new Logger(HsmService.name);
  private readonly isProduction: boolean;
  private readonly provider: HsmProvider;
  private readonly defaultKeyName: string;
  private readonly configuredKidPrefix?: string;
  private readonly allowMemoryProviderInProduction: boolean;
  private readonly vaultKeyAutoCreate: boolean;
  private readonly vaultAutoRotatePeriod?: string;
  private readonly vaultTransitMount: string;
  private readonly vaultTimeoutMs: number;
  private readonly vaultClient?: AxiosInstance;
  private readonly keyReferenceCache = new Map<
    string,
    { expiresAt: number; value: HsmKeyReference }
  >();
  private readonly cacheTtlMs = 60_000;

  // Fallback key пары для локальной симуляции "Vault" в Dev-среде
  private devPrivateKey: crypto.KeyObject;
  private devPublicKey: crypto.KeyObject;

  constructor(
    private readonly configService: ConfigService,
    private readonly secretsService: SecretsService,
  ) {
    this.isProduction = this.configService.get<string>("NODE_ENV") === "production";
    this.defaultKeyName =
      this.configService.get<string>("HSM_SIGNING_KEY_NAME") ||
      "institutional-jwt-mstr";
    this.configuredKidPrefix =
      this.configService.get<string>("HSM_KID_PREFIX") || undefined;
    this.allowMemoryProviderInProduction = parseBooleanSetting(
      this.configService.get<string>("HSM_ALLOW_MEMORY_PROVIDER_IN_PRODUCTION"),
      false,
    );
    this.vaultKeyAutoCreate = parseBooleanSetting(
      this.configService.get<string>("HSM_VAULT_KEY_AUTO_CREATE"),
      !this.isProduction,
    );
    this.vaultAutoRotatePeriod =
      this.configService.get<string>("HSM_VAULT_AUTO_ROTATE_PERIOD") ||
      "2160h";
    this.vaultTransitMount =
      this.configService.get<string>("HSM_VAULT_TRANSIT_MOUNT") || "transit";
    this.vaultTimeoutMs =
      Number(this.configService.get<string>("HSM_VAULT_TIMEOUT_MS")) || 5000;

    const configuredProvider = (
      this.configService.get<string>("HSM_PROVIDER") ||
      (this.isProduction ? "vault-transit" : "memory")
    )
      .trim()
      .toLowerCase() as HsmProvider;

    this.provider = configuredProvider;

    if (this.provider === "memory") {
      if (this.isProduction && !this.allowMemoryProviderInProduction) {
        throw new Error(
          "HSM memory provider запрещён в production без HSM_ALLOW_MEMORY_PROVIDER_IN_PRODUCTION=true.",
        );
      }

      this.initializeMemoryProvider();
      return;
    }

    this.vaultClient = this.createVaultClient();
  }

  async onModuleInit(): Promise<void> {
    if (this.provider === "memory") {
      return;
    }

    const keyReference = await this.getActiveKeyReference();
    await this.exportPublicKey(keyReference);
    this.logger.log(
      `[HSM] Vault Transit готов. active_kid=${keyReference.kid}, mount=${this.vaultTransitMount}`,
    );
  }

  /**
   * Подписание строки (или собранного JWT Payload'а) в HSM
   */
  async signEd25519(
    payload: string,
    keyReference?: Pick<HsmKeyReference, "keyName" | "keyVersion">,
  ): Promise<string> {
    const resolvedKeyName = keyReference?.keyName || this.defaultKeyName;
    this.logger.debug(
      `[HSM] Requesting enclave signature for key: ${resolvedKeyName}`,
    );

    if (this.provider === "memory") {
      // Симуляция анклавного подписания для тестов
      return crypto
        .sign(null, Buffer.from(payload), this.devPrivateKey)
        .toString("base64url");
    }

    const response = await this.vaultRequest<{
      data?: { signature?: string };
    }>({
      method: "POST",
      url: `/sign/${encodeURIComponent(resolvedKeyName)}`,
      data: {
        input: Buffer.from(payload).toString("base64"),
        ...(keyReference?.keyVersion
          ? { key_version: keyReference.keyVersion }
          : {}),
      },
    });

    const rawSignature = response.data?.signature;
    if (!rawSignature) {
      throw new Error("Vault Transit не вернул подпись.");
    }

    const parsedSignature = this.parseVaultSignature(rawSignature);
    if (parsedSignature.version) {
      this.cacheKeyReference(resolvedKeyName, {
        provider: "vault-transit",
        keyName: resolvedKeyName,
        keyVersion: parsedSignature.version,
        kid: this.buildKid(resolvedKeyName, parsedSignature.version),
      });
    }

    return parsedSignature.signature;
  }

  async getActiveKeyReference(
    keyName: string = this.defaultKeyName,
  ): Promise<HsmKeyReference> {
    const cached = this.keyReferenceCache.get(keyName);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    if (this.provider === "memory") {
      const reference: HsmKeyReference = {
        provider: "memory",
        keyName,
        kid: this.buildKid(keyName),
      };
      this.cacheKeyReference(keyName, reference);
      return reference;
    }

    const metadata = await this.readOrCreateVaultKey(keyName);
    const reference: HsmKeyReference = {
      provider: "vault-transit",
      keyName,
      keyVersion: metadata.latestVersion,
      kid: this.buildKid(keyName, metadata.latestVersion),
    };
    this.cacheKeyReference(keyName, reference);
    return reference;
  }

  /**
   * Извлечение Публичного ключа для передачи в цепочку сертификатов
   */
  async exportPublicKey(
    keyReference?: Pick<HsmKeyReference, "keyName" | "keyVersion">,
  ): Promise<string> {
    if (this.provider === "memory") {
      return this.devPublicKey
        .export({ format: "pem", type: "spki" })
        .toString();
    }

    const resolvedKeyName = keyReference?.keyName || this.defaultKeyName;
    const resolvedVersion = keyReference?.keyVersion;
    const response = await this.vaultRequest<{
      data?: { keys?: Record<string, { public_key?: string }> };
    }>({
      method: "GET",
      url: `/export/public-key/${encodeURIComponent(resolvedKeyName)}/${resolvedVersion || "latest"}`,
    });

    const publicKey = this.extractVaultPublicKey(
      response.data?.keys,
      resolvedVersion,
    );

    if (!publicKey) {
      throw new Error(
        `Vault Transit не вернул публичный ключ для ${resolvedKeyName}.`,
      );
    }

    return publicKey;
  }

  async checkReadiness(): Promise<{
    provider: HsmProvider;
    kid: string;
    keyName: string;
  }> {
    const keyReference = await this.getActiveKeyReference();
    await this.exportPublicKey(keyReference);

    return {
      provider: keyReference.provider,
      kid: keyReference.kid,
      keyName: keyReference.keyName,
    };
  }

  private initializeMemoryProvider(): void {
    const configuredPrivateKey =
      this.secretsService.getOptionalSecret("HSM_DEV_PRIVATE_KEY");

    if (configuredPrivateKey) {
      this.devPrivateKey = crypto.createPrivateKey(configuredPrivateKey);
      this.devPublicKey = crypto.createPublicKey(this.devPrivateKey);
      this.logger.warn(
        `[HSM] Running with local memory provider and configured Ed25519 key.`,
      );
      return;
    }

    this.logger.warn(
      `[HSM] Running with local memory provider. Using generated in-memory Ed25519 keypair.`,
    );
    const { privateKey, publicKey } = crypto.generateKeyPairSync("ed25519");
    this.devPrivateKey = privateKey;
    this.devPublicKey = publicKey;
  }

  private createVaultClient(): AxiosInstance {
    const baseUrl = this.configService.get<string>("HSM_VAULT_ADDR")?.trim();
    const token = this.secretsService.getRequiredSecret("HSM_VAULT_TOKEN");
    if (!baseUrl) {
      throw new Error("Не задан HSM_VAULT_ADDR для Vault Transit.");
    }

    const namespace =
      this.configService.get<string>("HSM_VAULT_NAMESPACE")?.trim() || undefined;
    const skipTlsVerify = parseBooleanSetting(
      this.configService.get<string>("HSM_VAULT_SKIP_TLS_VERIFY"),
      false,
    );
    const caCertFile =
      this.configService.get<string>("HSM_VAULT_CACERT_FILE")?.trim() ||
      undefined;

    const httpsAgent =
      baseUrl.startsWith("https://") || caCertFile || skipTlsVerify
        ? new https.Agent({
            rejectUnauthorized: !skipTlsVerify,
            ca: caCertFile ? fs.readFileSync(caCertFile, "utf8") : undefined,
          })
        : undefined;

    if (skipTlsVerify) {
      this.logger.warn(
        `[HSM] HSM_VAULT_SKIP_TLS_VERIFY=true. Использовать только во временных закрытых контурах.`,
      );
    }

    return axios.create({
      baseURL: `${baseUrl.replace(/\/$/, "")}/v1/${this.vaultTransitMount}`,
      timeout: this.vaultTimeoutMs,
      headers: {
        "X-Vault-Token": token,
        ...(namespace ? { "X-Vault-Namespace": namespace } : {}),
      },
      httpsAgent,
    });
  }

  private async readOrCreateVaultKey(
    keyName: string,
  ): Promise<{ latestVersion: number }> {
    try {
      return await this.readVaultKey(keyName);
    } catch (error) {
      if (!this.isVaultNotFound(error) || !this.vaultKeyAutoCreate) {
        throw error;
      }

      this.logger.warn(
        `[HSM] Vault key ${keyName} not found. Auto-creating asymmetric ed25519 key.`,
      );
      await this.vaultRequest({
        method: "POST",
        url: `/keys/${encodeURIComponent(keyName)}`,
        data: {
          type: "ed25519",
          exportable: false,
          auto_rotate_period: this.vaultAutoRotatePeriod,
        },
      });

      return this.readVaultKey(keyName);
    }
  }

  private async readVaultKey(
    keyName: string,
  ): Promise<{ latestVersion: number }> {
    const response = await this.vaultRequest<{ data?: VaultKeyReadResponse }>({
      method: "GET",
      url: `/keys/${encodeURIComponent(keyName)}`,
    });

    const latestVersion = response.data?.latest_version;
    if (!latestVersion) {
      throw new Error(
        `Vault Transit вернул ключ ${keyName} без latest_version.`,
      );
    }

    return { latestVersion };
  }

  private buildKid(keyName: string, version?: number): string {
    const prefix = this.configuredKidPrefix || keyName;
    if (!version) {
      return prefix;
    }

    return `${prefix}:v${version}`;
  }

  private cacheKeyReference(keyName: string, value: HsmKeyReference): void {
    this.keyReferenceCache.set(keyName, {
      value,
      expiresAt: Date.now() + this.cacheTtlMs,
    });
  }

  private parseVaultSignature(signature: string): {
    signature: string;
    version?: number;
  } {
    const match = signature.match(/^vault:v(\d+):(.+)$/);
    if (!match) {
      return { signature: this.toBase64Url(signature) };
    }

    return {
      version: Number(match[1]),
      signature: this.toBase64Url(match[2]),
    };
  }

  private extractVaultPublicKey(
    keys: Record<string, { public_key?: string }> | undefined,
    requestedVersion?: number,
  ): string | undefined {
    if (!keys) {
      return undefined;
    }

    if (requestedVersion && keys[String(requestedVersion)]?.public_key) {
      return keys[String(requestedVersion)].public_key;
    }

    const latestVersion = Object.keys(keys)
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value))
      .sort((left, right) => right - left)[0];

    if (!latestVersion) {
      return undefined;
    }

    return keys[String(latestVersion)]?.public_key;
  }

  private isVaultNotFound(error: unknown): boolean {
    return (
      axios.isAxiosError(error) &&
      [404, 400].includes(error.response?.status || 0)
    );
  }

  private async vaultRequest<T>(params: {
    method: "GET" | "POST";
    url: string;
    data?: unknown;
  }): Promise<T> {
    if (!this.vaultClient) {
      throw new Error("Vault client не инициализирован.");
    }

    try {
      const response = await this.vaultClient.request<T>({
        method: params.method,
        url: params.url,
        data: params.data,
      });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status || "n/a";
        const details =
          typeof error.response?.data === "string"
            ? error.response.data
            : JSON.stringify(error.response?.data || {});
        this.logger.error(
          `[HSM] Vault request failed: ${params.method} ${params.url} | status=${status} | details=${details}`,
        );
      }

      throw error;
    }
  }

  private toBase64Url(value: string): string {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const paddingLength = (4 - (normalized.length % 4)) % 4;
    const padded = `${normalized}${"=".repeat(paddingLength)}`;
    return Buffer.from(padded, "base64").toString("base64url");
  }
}
