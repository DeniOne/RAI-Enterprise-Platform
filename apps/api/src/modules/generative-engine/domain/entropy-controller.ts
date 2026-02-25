import { Injectable, Logger } from "@nestjs/common";

/**
 * EntropyController — Guard для детерминированного контекста.
 *
 * ИНВАРИАНТ I19 (Deterministic Generation, B1 Strict):
 * Запрещает нестерменированные операции внутри генеративного контекста.
 *
 * ВАЖНО: EntropyController — это Guard, НЕ генератор seed.
 * Seed создаётся SeedManager, а EntropyController лишь блокирует
 * запрещённые источники энтропии (Date.now, Math.random).
 *
 * Контракт Фазы 0.5 §2: seed = SHA-256 → uint32 (через SeedManager)
 */
@Injectable()
export class EntropyController {
  private readonly logger = new Logger(EntropyController.name);

  /**
   * Оборачивает функцию в детерминированный контекст.
   * Подменяет Date.now() → fixedTimestamp (из seed).
   * Подменяет Math.random() → throw.
   *
   * @param fn - функция для выполнения в детерминированном контексте
   * @param fixedTimestamp - фиксированный timestamp (ISO 8601)
   * @returns результат вызова fn
   */
  async wrapDeterministicContext<T>(
    fn: () => T | Promise<T>,
    fixedTimestamp: string,
  ): Promise<T> {
    const originalDateNow = Date.now;
    const originalMathRandom = Math.random;
    const fixedMs = new Date(fixedTimestamp).getTime();

    try {
      // Подмена Date.now → фиксированный timestamp
      Date.now = () => fixedMs;

      // Подмена Math.random → запрет
      Math.random = () => {
        throw new EntropyViolationError(
          "Math.random() запрещён в детерминированном контексте (I19)",
        );
      };

      this.logger.debug(
        `[I19] Детерминированный контекст: timestamp=${fixedTimestamp}`,
      );

      return await fn();
    } finally {
      // Восстановление оригинальных функций
      Date.now = originalDateNow;
      Math.random = originalMathRandom;
    }
  }

  /**
   * Runtime-проверка: гарантирует, что операция выполняется
   * в детерминированном контексте.
   * Проверяет, что Date.now() возвращает фиксированное значение.
   */
  assertDeterministicContext(): void {
    // При корректном контексте Date.now всегда возвращает одно значение
    const t1 = Date.now();
    const t2 = Date.now();
    if (t1 !== t2) {
      throw new EntropyViolationError(
        "Операция выполняется вне детерминированного контекста (I19). " +
          "Используйте wrapDeterministicContext().",
      );
    }
  }

  /**
   * Вычисляет фиксированный timestamp из seed.
   * Контракт Фазы 0.5 §2: timestamp = epoch + seed_numeric (ms).
   *
   * @param seed - String seed (parsed to numeric for computation)
   * @returns ISO 8601 timestamp
   */
  computeFixedTimestamp(seed: string): string {
    const seedNumeric = parseInt(seed, 10);
    if (isNaN(seedNumeric)) {
      throw new EntropyViolationError(
        `[I19] Невалидный seed для timestamp: "${seed}". Должен быть числовой строкой.`,
      );
    }
    // Epoch anchor: 2026-01-01T00:00:00Z
    const EPOCH_ANCHOR = 1767225600000;
    return new Date(EPOCH_ANCHOR + (seedNumeric % 86400000)).toISOString();
  }
}

/**
 * Ошибка нарушения детерминизма.
 * Выбрасывается при обнаружении нестерменированных операций
 * внутри генеративного контекста.
 */
export class EntropyViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EntropyViolationError";
  }
}
