import { Injectable, Logger } from "@nestjs/common";

/**
 * CanonicalSorter — Каноническая сортировка для стабильного хеширования.
 *
 * Контракт Фазы 0.5 §1 (Canonicalization Contract):
 * - Ordering: ALPHABETICAL_RECURSIVE — ключи объектов по Unicode codepoint
 * - Массивы НЕ пересортировываются (domain order: sequence)
 * - null → опускается (не включается в канонический вывод)
 * - undefined → THROW
 * - Float → toFixed(6) для стабильного представления
 * - String → NFC normalization
 * - Date → ISO 8601 string
 * - Вложенные объекты и массивы — РЕКУРСИВНАЯ обработка
 *
 * ГАРАНТИИ:
 * - ∀ obj₁ ≡ obj₂ ⟹ canonical(obj₁) ≡ canonical(obj₂)  (PBT-CANON-01)
 * - canonical(canonical(x)) ≡ canonical(x)               (IDEMPOTENCY)
 * - Hash не зависит от порядка ключей в исходном объекте
 */
@Injectable()
export class CanonicalSorter {
  private readonly logger = new Logger(CanonicalSorter.name);

  /**
   * Каноникализирует объект → стабильная JSON-строка.
   *
   * @param obj - объект для каноникализации
   * @returns каноническая JSON-строка
   * @throws CanonicalSortError если встречен undefined или unsupported type
   */
  canonicalize(obj: unknown): string {
    return JSON.stringify(this.sortRecursive(obj));
  }

  /**
   * Проверяет idempotency: canonical(canonical(x)) === canonical(x).
   * Если не idempotent — THROW.
   *
   * MUST быть вызван после каждой каноникализации в production pipeline.
   */
  assertIdempotent(canonicalized: string): void {
    try {
      const parsed = JSON.parse(canonicalized);
      const recanonicalized = this.canonicalize(parsed);

      if (recanonicalized !== canonicalized) {
        throw new CanonicalSortError(
          `[I19] Canonicalization NOT idempotent! ` +
            `len1=${canonicalized.length}, len2=${recanonicalized.length}. ` +
            `Детерминизм нарушен.`,
        );
      }
    } catch (e) {
      if (e instanceof CanonicalSortError) throw e;
      throw new CanonicalSortError(
        `[I19] Idempotency check failed: ${(e as Error).message}`,
      );
    }
  }

  /**
   * Рекурсивная глубинная канонизация значения.
   *
   * Обрабатывает:
   * - Примитивы (string, number, boolean)
   * - Объекты (рекурсивная сортировка ключей по Unicode codepoint)
   * - Массивы (рекурсивная обработка элементов, порядок СОХРАНЯЕТСЯ)
   * - Date → ISO 8601
   * - null → skip
   * - undefined → throw
   */
  private sortRecursive(value: unknown): unknown {
    // undefined → запрещён
    if (value === undefined) {
      throw new CanonicalSortError(
        "undefined запрещён в каноникализации. Контракт §1: undefined → throw",
      );
    }

    // null → JSON.stringify выдаст null, но мы пропускаем null-ключи в объектах
    if (value === null) {
      return null;
    }

    // Date → ISO 8601 string
    if (value instanceof Date) {
      return value.toISOString();
    }

    // String → NFC normalization
    if (typeof value === "string") {
      return value.normalize("NFC");
    }

    // Number → integers as-is, floats → toFixed(6)
    if (typeof value === "number") {
      if (!isFinite(value)) {
        throw new CanonicalSortError(
          `Infinity/NaN запрещены в каноникализации. Значение: ${value}`,
        );
      }
      if (Number.isInteger(value)) {
        return value;
      }
      return parseFloat(value.toFixed(6));
    }

    // Boolean
    if (typeof value === "boolean") {
      return value;
    }

    // Массивы — НЕ пересортировываются (domain order: sequence)
    // Каждый элемент обрабатывается рекурсивно
    if (Array.isArray(value)) {
      return value
        .filter((item) => item !== null) // null → skip в массивах
        .map((item) => this.sortRecursive(item));
    }

    // Объекты — ГЛУБИННАЯ РЕКУРСИВНАЯ СОРТИРОВКА
    // Ключи сортируются по Unicode codepoint (String.sort default)
    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;
      const sortedKeys = Object.keys(obj).sort();
      const result: Record<string, unknown> = {};

      for (const key of sortedKeys) {
        const val = obj[key];
        // null → пропускаем ключ
        if (val === null) {
          continue;
        }
        // undefined → throw
        if (val === undefined) {
          throw new CanonicalSortError(
            `undefined запрещён: key="${key}". Контракт §1.`,
          );
        }
        // РЕКУРСИЯ — вглубь
        result[key] = this.sortRecursive(val);
      }

      return result;
    }

    // Всё остальное (symbol, function, bigint) → throw
    throw new CanonicalSortError(
      `Неподдерживаемый тип: ${typeof value}. ` +
        `Каноникализация поддерживает: string, number, boolean, object, array, Date.`,
    );
  }

  /**
   * Вспомогательный метод: сортировка ключей без stringify.
   */
  sortKeys(obj: Record<string, unknown>): Record<string, unknown> {
    return this.sortRecursive(obj) as Record<string, unknown>;
  }
}

/**
 * Ошибка каноникализации.
 */
export class CanonicalSortError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CanonicalSortError";
  }
}
