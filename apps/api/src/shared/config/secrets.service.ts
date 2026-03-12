import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { resolveSecretValue } from "./secret-value.util";

interface SecretLookupOptions {
  fileKey?: string;
  fallbackKeys?: string[];
}

@Injectable()
export class SecretsService {
  private readonly cache = new Map<string, string | undefined>();

  constructor(private readonly configService: ConfigService) {}

  getOptionalSecret(
    key: string,
    options: SecretLookupOptions = {},
  ): string | undefined {
    return this.readSecret(key, options, false);
  }

  getRequiredSecret(
    key: string,
    options: SecretLookupOptions = {},
  ): string {
    const value = this.readSecret(key, options, true);
    if (!value) {
      throw new Error(`Не найден обязательный секрет ${key}.`);
    }

    return value;
  }

  private readSecret(
    key: string,
    options: SecretLookupOptions,
    required: boolean,
  ): string | undefined {
    const cacheKey = JSON.stringify({
      key,
      fileKey: options.fileKey ?? null,
      fallbackKeys: options.fallbackKeys ?? [],
      required,
    });

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const value = resolveSecretValue(this.configService, key, {
      ...options,
      required,
    });

    this.cache.set(cacheKey, value);
    return value;
  }
}
