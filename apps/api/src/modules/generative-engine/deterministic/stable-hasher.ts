import { Injectable, Logger } from "@nestjs/common";
import { createHash } from "crypto";

/**
 * StableHasher — Стабильное хеширование (SHA-256).
 *
 * Контракт Фазы 0.5 §3:
 * - Algorithm: SHA-256
 * - Input: canonicalizedPayload + '|' + modelVersion + '|' + seed
 * - Encoding: UTF-8
 * - Output: Hex-encoded 64-char string (lowercase)
 * - Collision Policy: canonicalHash has @unique in DB
 *
 * DET-HASH-01: побайтовое совпадение при одинаковых входах.
 */
@Injectable()
export class StableHasher {
  private readonly logger = new Logger(StableHasher.name);

  /**
   * Вычисляет SHA-256 хеш строки.
   *
   * @param data - UTF-8 строка
   * @returns hex-encoded SHA-256 (64 символа, lowercase)
   */
  hash(data: string): string {
    return createHash("sha256").update(data, "utf8").digest("hex");
  }

  /**
   * Вычисляет хеш генерации по контракту §3.
   * hash = SHA-256(canonicalizedPayload + '|' + modelVersion + '|' + seed)
   *
   * SEED теперь String для полной воспроизводимости.
   *
   * @param canonicalizedPayload - каноникализированная строка
   * @param modelVersion - версия модели
   * @param seed - seed генерации (String)
   * @returns hex-encoded SHA-256 (64 символа)
   */
  hashGeneration(
    canonicalizedPayload: string,
    modelVersion: string,
    seed: string,
  ): string {
    const input = `${canonicalizedPayload}|${modelVersion}|${seed}`;
    const result = this.hash(input);

    this.logger.debug(
      `[HASH] SHA-256: input_length=${input.length}, hash=${result.substring(0, 16)}...`,
    );

    return result;
  }

  /**
   * Проверяет хеш (для верификации).
   *
   * @param data - данные для хеширования
   * @param expectedHash - ожидаемый хеш
   * @returns true если хеши совпадают
   */
  verify(data: string, expectedHash: string): boolean {
    const actualHash = this.hash(data);
    return actualHash === expectedHash;
  }

  /**
   * Проверяет хеш генерации (для replay-верификации).
   * Используется для determinism proof check.
   */
  verifyGeneration(
    canonicalizedPayload: string,
    modelVersion: string,
    seed: string,
    expectedHash: string,
  ): boolean {
    const actualHash = this.hashGeneration(
      canonicalizedPayload,
      modelVersion,
      seed,
    );
    const matches = actualHash === expectedHash;

    if (!matches) {
      this.logger.warn(
        `[HASH] Verification FAILED: expected=${expectedHash.substring(0, 16)}..., ` +
          `actual=${actualHash.substring(0, 16)}...`,
      );
    }

    return matches;
  }
}
