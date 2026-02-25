import { Injectable, Logger } from "@nestjs/common";
import { createHash } from "crypto";

/**
 * SeedManager — Управление seed для детерминизма.
 *
 * Контракт Фазы 0.5 §2:
 * seed = SHA-256(canonical(params)) → first 4 bytes → uint32 → String
 *
 * Lifecycle:
 * 1. computeSeed(params) — вычислить seed из каноникализированных параметров
 * 2. acceptExplicitSeed(seed) — принять явный seed для replay
 * 3. seed хранится в GenerationRecord как String для determinism proof
 *
 * ВАЖНО: NO RANDOM FALLBACK. Если canonicalizedParams пустой → THROW.
 * Любой fallback на Math.random() = нарушение I19.
 */
@Injectable()
export class SeedManager {
  private readonly logger = new Logger(SeedManager.name);

  /**
   * Вычисляет seed из каноникализированной строки параметров.
   * Контракт §2: SHA-256 → first 4 bytes → uint32 → toString
   *
   * @param canonicalizedParams - каноникализированная строка параметров
   * @returns seed как String (для хранения и replay)
   * @throws Error если canonicalizedParams пустой
   */
  computeSeed(canonicalizedParams: string): string {
    if (!canonicalizedParams || canonicalizedParams.trim() === "") {
      throw new SeedDerivationError(
        "[SEED] canonicalizedParams не может быть пустым. " +
          "Детерминистический seed невозможно вычислить. " +
          "Random fallback ЗАПРЕЩЁН (I19).",
      );
    }

    const hash = createHash("sha256")
      .update(canonicalizedParams, "utf8")
      .digest();

    // First 4 bytes → unsigned 32-bit integer (big-endian) → String
    const seedNumeric = hash.readUInt32BE(0);
    const seed = seedNumeric.toString();

    this.logger.log(
      `[SEED] Вычислен seed: ${seed} из hash=${hash.toString("hex").substring(0, 16)}...`,
    );

    return seed;
  }

  /**
   * Принимает явный seed (для replay).
   * Валидирует формат.
   *
   * @param seed - явный seed как строка
   * @returns валидированный seed
   * @throws Error если seed невалиден
   */
  acceptExplicitSeed(seed: string): string {
    if (!seed || seed.trim() === "") {
      throw new SeedDerivationError(
        "[SEED] explicit seed не может быть пустым.",
      );
    }

    const numeric = parseInt(seed, 10);
    if (isNaN(numeric) || numeric < 0 || numeric > 0xffffffff) {
      throw new SeedDerivationError(
        `[SEED] Невалидный explicit seed: "${seed}". ` +
          `Должен быть числовой строкой в диапазоне [0, 2^32).`,
      );
    }

    this.logger.log(`[SEED] Принят explicit seed: ${seed}`);
    return seed;
  }

  /**
   * Решает, какой seed использовать: explicit или computed.
   * NO RANDOM FALLBACK — только детерминированные источники.
   *
   * @param canonicalizedParams - каноникализированные параметры
   * @param explicitSeed - явный seed (optional, для replay)
   * @returns финальный seed String
   */
  resolveSeed(canonicalizedParams: string, explicitSeed?: number): string {
    if (explicitSeed !== undefined && explicitSeed !== null) {
      return this.acceptExplicitSeed(explicitSeed.toString());
    }
    return this.computeSeed(canonicalizedParams);
  }

  /**
   * Генерирует детерминированную последовательность чисел из seed.
   * Использует mulberry32 PRNG для повторяемости.
   *
   * @param seed - начальный seed (String → parsed to uint32)
   * @param count - количество чисел
   * @returns массив чисел [0, 1)
   */
  generateSequence(seed: string, count: number): number[] {
    const result: number[] = [];
    let state = parseInt(seed, 10);

    for (let i = 0; i < count; i++) {
      // mulberry32 PRNG — полностью детерминированный
      state |= 0;
      state = (state + 0x6d2b79f5) | 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      result.push(((t ^ (t >>> 14)) >>> 0) / 4294967296);
    }

    return result;
  }
}

/**
 * Ошибка вычисления seed.
 */
export class SeedDerivationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SeedDerivationError";
  }
}
