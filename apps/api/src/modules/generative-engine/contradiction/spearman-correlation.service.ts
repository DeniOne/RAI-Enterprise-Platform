import { Injectable, Logger } from "@nestjs/common";

/**
 * SpearmanCorrelationService — Мониторинг корреляции DIS↔Regret.
 *
 * Rolling window: 90 дней.
 * Minimum sample: N ≥ 50 (иначе INSUFFICIENT_DATA).
 *
 * Spearman Rank Correlation:
 *   ρ = 1 - (6 Σ dᵢ²) / (n(n² - 1))
 *   где dᵢ = rank(DIS_i) - rank(Regret_i)
 */

export interface CorrelationDataPoint {
  disScore: number;
  regret: number;
}

export interface CorrelationResult {
  rho: number; // [-1, 1] Spearman ρ
  sampleSize: number;
  isSignificant: boolean; // True если |ρ| > 0.3 и N ≥ 50
  status: "OK" | "INSUFFICIENT_DATA" | "WEAK_CORRELATION";
}

@Injectable()
export class SpearmanCorrelationService {
  private readonly logger = new Logger(SpearmanCorrelationService.name);
  private static readonly MIN_SAMPLE = 50;
  private static readonly SIGNIFICANCE_THRESHOLD = 0.3;

  /**
   * Рассчитывает Spearman Rank Correlation.
   */
  calculate(data: CorrelationDataPoint[]): CorrelationResult {
    const n = data.length;

    if (n < SpearmanCorrelationService.MIN_SAMPLE) {
      this.logger.warn(
        `[INSUFFICIENT_DATA] Spearman: N=${n} < ${SpearmanCorrelationService.MIN_SAMPLE}. ` +
          `Корреляция не рассчитана.`,
      );
      return {
        rho: 0,
        sampleSize: n,
        isSignificant: false,
        status: "INSUFFICIENT_DATA",
      };
    }

    // Ранжирование
    const disRanks = this.rank(data.map((d) => d.disScore));
    const regretRanks = this.rank(data.map((d) => d.regret));

    // Σ dᵢ²
    let sumD2 = 0;
    for (let i = 0; i < n; i++) {
      const d = disRanks[i] - regretRanks[i];
      sumD2 += d * d;
    }

    // ρ = 1 - (6 Σ dᵢ²) / (n(n² - 1))
    const rho = 1 - (6 * sumD2) / (n * (n * n - 1));

    const isSignificant =
      Math.abs(rho) >= SpearmanCorrelationService.SIGNIFICANCE_THRESHOLD;

    const status: CorrelationResult["status"] = isSignificant
      ? "OK"
      : "WEAK_CORRELATION";

    this.logger.log(
      `Spearman ρ=${rho.toFixed(4)}, N=${n}, significant=${isSignificant}`,
    );

    return { rho, sampleSize: n, isSignificant, status };
  }

  /**
   * Вычисляет ранги для массива чисел.
   * Ties → средний ранг.
   */
  private rank(values: number[]): number[] {
    const indexed = values.map((v, i) => ({ value: v, index: i }));
    indexed.sort((a, b) => a.value - b.value);

    const ranks = new Array<number>(values.length);
    let i = 0;

    while (i < indexed.length) {
      let j = i;
      // Находим все одинаковые значения (ties)
      while (j < indexed.length && indexed[j].value === indexed[i].value) {
        j++;
      }

      // Средний ранг для ties
      const avgRank = (i + j - 1) / 2 + 1;
      for (let k = i; k < j; k++) {
        ranks[indexed[k].index] = avgRank;
      }
      i = j;
    }

    return ranks;
  }
}
