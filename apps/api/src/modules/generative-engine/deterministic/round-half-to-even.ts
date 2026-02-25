/**
 * roundHalfToEven — Банковское округление (IEEE 754 round-half-to-even).
 *
 * Level C Numeric Policy:
 * - Precision: 8 десятичных знаков (по умолчанию)
 * - Все числовые результаты симуляций ОБЯЗАНЫ проходить через эту функцию
 *   ПЕРЕД каноникализацией и хешированием.
 *
 * Гарантии:
 *   roundHalfToEven(0.5) === 0       (к ближайшему чётному)
 *   roundHalfToEven(1.5) === 2       (к ближайшему чётному)
 *   roundHalfToEven(2.5) === 2       (к ближайшему чётному)
 *   roundHalfToEven(3.5) === 4       (к ближайшему чётному)
 *   roundHalfToEven(-0.5) === 0      (симметрия)
 *   roundHalfToEven(1.2345, 2) === 1.23
 *   roundHalfToEven(1.235, 2) === 1.24  (5 → к чётному)
 */
export function roundHalfToEven(value: number, decimals = 8): number {
  if (!isFinite(value)) {
    throw new Error(
      `[I30] roundHalfToEven: Infinity/NaN запрещён. value=${value}`,
    );
  }

  if (decimals < 0 || decimals > 15) {
    throw new Error(
      `[I30] roundHalfToEven: decimals=${decimals} вне диапазона [0, 15]`,
    );
  }

  const factor = Math.pow(10, decimals);
  const shifted = value * factor;
  const truncated = Math.trunc(shifted);
  const remainder = Math.abs(shifted - truncated);

  // Точное сравнение с 0.5 (with epsilon для fp artifacts)
  const EPSILON = 1e-12;

  if (Math.abs(remainder - 0.5) < EPSILON) {
    // Banker's rounding: к ближайшему чётному
    let result: number;
    if (truncated % 2 === 0) {
      result = truncated / factor;
    } else {
      result = (truncated + (shifted > 0 ? 1 : -1)) / factor;
    }
    // IEEE 754: устранение negative zero (-0 → +0)
    return result === 0 ? 0 : result;
  }

  const result = Math.round(shifted) / factor;
  // IEEE 754: устранение negative zero (-0 → +0)
  return result === 0 ? 0 : result;
}

/**
 * Рекурсивно округляет все числовые значения в объекте/массиве.
 * Строки, boolean, null — без изменений.
 *
 * ОБЯЗАТЕЛЬНО вызывается на результатах симуляции ПЕРЕД RFC8785.
 */
export function roundAllNumbers(obj: unknown, decimals = 8): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "number") return roundHalfToEven(obj, decimals);
  if (typeof obj === "string" || typeof obj === "boolean") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => roundAllNumbers(item, decimals));
  }

  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = roundAllNumbers(val, decimals);
    }
    return result;
  }

  return obj;
}
