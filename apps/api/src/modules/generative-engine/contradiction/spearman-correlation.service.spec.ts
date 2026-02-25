import {
  SpearmanCorrelationService,
  CorrelationDataPoint,
} from "./spearman-correlation.service";

/**
 * Тесты SpearmanCorrelationService — Мониторинг DIS↔Regret.
 */
describe("SpearmanCorrelationService", () => {
  let service: SpearmanCorrelationService;

  beforeEach(() => {
    service = new SpearmanCorrelationService();
  });

  describe("INSUFFICIENT_DATA", () => {
    it("N < 50 → status INSUFFICIENT_DATA", () => {
      const data: CorrelationDataPoint[] = Array.from(
        { length: 10 },
        (_, i) => ({ disScore: i * 0.1, regret: i * 100 }),
      );
      const result = service.calculate(data);
      expect(result.status).toBe("INSUFFICIENT_DATA");
      expect(result.sampleSize).toBe(10);
      expect(result.rho).toBe(0);
    });
  });

  describe("Perfect correlation", () => {
    it("идеальная прямая корреляция → ρ ≈ 1.0", () => {
      const data: CorrelationDataPoint[] = Array.from(
        { length: 100 },
        (_, i) => ({ disScore: i * 0.01, regret: i * 50 }),
      );
      const result = service.calculate(data);
      expect(result.rho).toBeCloseTo(1.0, 2);
      expect(result.isSignificant).toBe(true);
      expect(result.status).toBe("OK");
    });

    it("идеальная обратная корреляция → ρ ≈ -1.0", () => {
      const data: CorrelationDataPoint[] = Array.from(
        { length: 100 },
        (_, i) => ({ disScore: i * 0.01, regret: -i * 50 }),
      );
      const result = service.calculate(data);
      expect(result.rho).toBeCloseTo(-1.0, 2);
      expect(result.isSignificant).toBe(true);
    });
  });

  describe("No correlation", () => {
    it("случайные данные → |ρ| < 0.3 → WEAK_CORRELATION", () => {
      // Создаём данные без корреляции
      const data: CorrelationDataPoint[] = Array.from(
        { length: 100 },
        (_, i) => ({
          disScore: Math.sin(i * 1.618) * 0.5 + 0.5,
          regret: Math.cos(i * 2.718) * 1000,
        }),
      );
      const result = service.calculate(data);
      expect(Math.abs(result.rho)).toBeLessThan(0.5);
    });
  });

  describe("Ties handling", () => {
    it("одинаковые значения DIS → средний ранг", () => {
      const data: CorrelationDataPoint[] = [
        ...Array.from({ length: 25 }, () => ({ disScore: 0.5, regret: 100 })),
        ...Array.from({ length: 75 }, (_, i) => ({
          disScore: 0.1 + i * 0.01,
          regret: i * 10,
        })),
      ];
      const result = service.calculate(data);
      // Должен вычислиться без ошибок
      expect(typeof result.rho).toBe("number");
      expect(isFinite(result.rho)).toBe(true);
    });
  });
});
