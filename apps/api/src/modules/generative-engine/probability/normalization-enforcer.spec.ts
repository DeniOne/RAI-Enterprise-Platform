import { Test, TestingModule } from "@nestjs/testing";
import { NormalizationEnforcer } from "./normalization-enforcer";
import { InternalServerErrorException } from "@nestjs/common";

describe("NormalizationEnforcer", () => {
  let enforcer: NormalizationEnforcer;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NormalizationEnforcer],
    }).compile();

    enforcer = module.get<NormalizationEnforcer>(NormalizationEnforcer);
  });

  it("должен проходить валидацию для суммы ~1.0", () => {
    expect(() => enforcer.validateNormalization([0.5, 0.5])).not.toThrow();
    expect(() =>
      enforcer.validateNormalization([0.333, 0.333, 0.334]),
    ).not.toThrow();
  });

  it("должен кидать ошибку если сумма отклоняется > 0.001", () => {
    expect(() => enforcer.validateNormalization([0.5, 0.6])).toThrow(
      InternalServerErrorException,
    );
  });

  it("должен нормализовать распределение", () => {
    const input = [1, 2, 1]; // sum=4
    const normalized = enforcer.normalize(input);
    expect(normalized).toEqual([0.25, 0.5, 0.25]);
  });
});
