import { Test, TestingModule } from "@nestjs/testing";
import { ExpectationCalculator } from "./expectation-calculator";

describe("ExpectationCalculator", () => {
  let calculator: ExpectationCalculator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExpectationCalculator],
    }).compile();

    calculator = module.get<ExpectationCalculator>(ExpectationCalculator);
  });

  it("должен рассчитывать мат. ожидание", () => {
    const values = [10, 20, 30];
    const probs = [0.2, 0.5, 0.3];
    // E = 2 + 10 + 9 = 21

    expect(calculator.calculateExpectation(values, probs)).toBeCloseTo(21);
  });

  it("должен кидать ошибку при несовпадении длин", () => {
    expect(() => calculator.calculateExpectation([1], [1, 2])).toThrow();
  });
});
