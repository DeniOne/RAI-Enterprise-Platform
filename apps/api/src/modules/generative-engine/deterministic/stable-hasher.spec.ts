import { Test, TestingModule } from "@nestjs/testing";
import { StableHasher } from "./stable-hasher";

/**
 * StableHasher Unit Tests
 *
 * Test Coverage:
 * - HASH-01: Baseline SHA-256 (hex64)
 * - HASH-02: Generation Hash Contract (payload|version|seed)
 * - HASH-03: Verification logic
 */
describe("StableHasher", () => {
  let hasher: StableHasher;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StableHasher],
    }).compile();

    hasher = module.get<StableHasher>(StableHasher);
  });

  describe("HASH-01: Baseline SHA-256", () => {
    it("должен возвращать 64-символьную hex строку", () => {
      const result = hasher.hash("test");
      expect(result).toHaveLength(64);
      expect(result).toMatch(/^[0-9a-f]+$/);
    });

    it("одинаковый input → одинаковый hash", () => {
      const result1 = hasher.hash("контент");
      const result2 = hasher.hash("контент");
      expect(result1).toBe(result2);
    });
  });

  describe("HASH-02: Generation Hash Contract", () => {
    it("hashGeneration должен следовать контракту payload|version|seed", () => {
      const payload = '{"a":1}';
      const version = "1.0.0";
      const seed = "12345";

      const result = hasher.hashGeneration(payload, version, seed);

      // Ручной пересчёт для контроля контракта
      const expected = hasher.hash(`${payload}|${version}|${seed}`);
      expect(result).toBe(expected);
    });

    it("изменение любого компонента → изменение хеша", () => {
      const p = "p";
      const v = "v";
      const s = "s";
      const h = hasher.hashGeneration(p, v, s);

      expect(hasher.hashGeneration("x", v, s)).not.toBe(h);
      expect(hasher.hashGeneration(p, "x", s)).not.toBe(h);
      expect(hasher.hashGeneration(p, v, "x")).not.toBe(h);
    });
  });

  describe("HASH-03: Verification", () => {
    it("verify/verifyGeneration должны возвращать true при совпадении", () => {
      const p = "payload";
      const v = "1.0.0";
      const s = "999";
      const h = hasher.hashGeneration(p, v, s);

      expect(hasher.verifyGeneration(p, v, s, h)).toBe(true);
      expect(hasher.verifyGeneration(p, v, s, "wrong")).toBe(false);
    });
  });
});
