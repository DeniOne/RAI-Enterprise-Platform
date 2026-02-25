import { Test, TestingModule } from "@nestjs/testing";
import { ConfidenceIntervalValidator } from "./confidence-interval-validator";
import { BadRequestException } from "@nestjs/common";

describe("ConfidenceIntervalValidator", () => {
  let validator: ConfidenceIntervalValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfidenceIntervalValidator],
    }).compile();

    validator = module.get<ConfidenceIntervalValidator>(
      ConfidenceIntervalValidator,
    );
  });

  it("должен пропускать корректные интервалы", () => {
    expect(() => validator.validateInterval(10, 20, 0.95)).not.toThrow();
  });

  it("должен кидать ошибку на некорректный уровень доверия", () => {
    expect(() => validator.validateInterval(10, 20, 0.5)).toThrow(
      BadRequestException,
    );
    expect(() => validator.validateInterval(10, 20, 1.0)).toThrow(
      BadRequestException,
    );
  });

  it("должен кидать ошибку если lower >= upper", () => {
    expect(() => validator.validateInterval(20, 10, 0.95)).toThrow(
      BadRequestException,
    );
  });
});
