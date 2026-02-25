import { Test, TestingModule } from "@nestjs/testing";
import { IsolationGuard } from "./isolation-guard";

describe("IsolationGuard", () => {
  let guard: IsolationGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IsolationGuard],
    }).compile();

    guard = module.get<IsolationGuard>(IsolationGuard);
  });

  it("должен разрешать SIMULATION контекст", () => {
    expect(() => guard.assertIsolation("SIMULATION")).not.toThrow();
  });

  it("должен блокировать запись в production таблицы", () => {
    expect(() => guard.blockProductionWrite("users")).toThrow(
      /Isolation Violation/,
    );
  });
});
