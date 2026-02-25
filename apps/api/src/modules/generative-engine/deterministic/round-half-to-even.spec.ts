import { roundHalfToEven, roundAllNumbers } from "./round-half-to-even";

/**
 * Тесты roundHalfToEven — IEEE 754 Banker's Rounding.
 *
 * Гарантирует детерминизм Level C Hash Pipeline (I30).
 */
describe("roundHalfToEven", () => {
  describe("Banker's rounding (half-to-even)", () => {
    it("0.5 → 0 (к ближайшему чётному)", () => {
      expect(roundHalfToEven(0.5, 0)).toBe(0);
    });

    it("1.5 → 2 (к ближайшему чётному)", () => {
      expect(roundHalfToEven(1.5, 0)).toBe(2);
    });

    it("2.5 → 2 (к ближайшему чётному)", () => {
      expect(roundHalfToEven(2.5, 0)).toBe(2);
    });

    it("3.5 → 4 (к ближайшему чётному)", () => {
      expect(roundHalfToEven(3.5, 0)).toBe(4);
    });

    it("-0.5 → 0 (симметрия)", () => {
      expect(roundHalfToEven(-0.5, 0)).toBe(0);
    });

    it("-1.5 → -2 (симметрия)", () => {
      expect(roundHalfToEven(-1.5, 0)).toBe(-2);
    });
  });

  describe("Decimal precision", () => {
    it("1.2345 с decimals=2 → 1.23", () => {
      expect(roundHalfToEven(1.2345, 2)).toBe(1.23);
    });

    it("1.235 с decimals=2 → 1.24 (5 → к чётному)", () => {
      expect(roundHalfToEven(1.235, 2)).toBe(1.24);
    });

    it("1.245 с decimals=2 → 1.24 (5 → к чётному)", () => {
      expect(roundHalfToEven(1.245, 2)).toBe(1.24);
    });

    it("decimals=8 (default) работает корректно", () => {
      const result = roundHalfToEven(3.141592653589793);
      expect(result).toBe(3.14159265);
    });
  });

  describe("Edge cases", () => {
    it("0 → 0", () => {
      expect(roundHalfToEven(0)).toBe(0);
    });

    it("целое число → без изменений", () => {
      expect(roundHalfToEven(42)).toBe(42);
    });

    it("Infinity → throw", () => {
      expect(() => roundHalfToEven(Infinity)).toThrow("[I30]");
    });

    it("NaN → throw", () => {
      expect(() => roundHalfToEven(NaN)).toThrow("[I30]");
    });

    it("decimals < 0 → throw", () => {
      expect(() => roundHalfToEven(1.5, -1)).toThrow("[I30]");
    });
  });

  describe("Детерминизм (I30)", () => {
    it("3 прогона → один результат", () => {
      const input = 0.123456789012345;
      const r1 = roundHalfToEven(input);
      const r2 = roundHalfToEven(input);
      const r3 = roundHalfToEven(input);
      expect(r1).toBe(r2);
      expect(r2).toBe(r3);
    });
  });
});

describe("roundAllNumbers", () => {
  it("рекурсивно округляет числа в объекте", () => {
    const input = {
      yield: 30.123456789,
      cost: 45000.987654321,
      nested: {
        value: 1.555555555,
      },
    };
    const result = roundAllNumbers(input) as any;
    expect(result.yield).toBe(roundHalfToEven(30.123456789));
    expect(result.cost).toBe(roundHalfToEven(45000.987654321));
    expect(result.nested.value).toBe(roundHalfToEven(1.555555555));
  });

  it("сохраняет строки и boolean", () => {
    const input = { name: "test", active: true, count: 3.14 };
    const result = roundAllNumbers(input) as any;
    expect(result.name).toBe("test");
    expect(result.active).toBe(true);
  });

  it("обрабатывает массивы", () => {
    const input = [1.123456789, 2.987654321];
    const result = roundAllNumbers(input) as number[];
    expect(result[0]).toBe(roundHalfToEven(1.123456789));
    expect(result[1]).toBe(roundHalfToEven(2.987654321));
  });

  it("null → null", () => {
    expect(roundAllNumbers(null)).toBeNull();
  });
});
