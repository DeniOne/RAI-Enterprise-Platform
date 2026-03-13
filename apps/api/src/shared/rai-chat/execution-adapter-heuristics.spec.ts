import { detectDataScientistIntent } from "./execution-adapter-heuristics";

describe("detectDataScientistIntent", () => {
  it("маршрутизирует explicit what-if запрос в what_if", () => {
    expect(detectDataScientistIntent("Что если снизить дозу удобрений?")).toBe("what_if");
  });

  it("маршрутизирует стратегический прогноз в strategy_forecast", () => {
    expect(
      detectDataScientistIntent("Сделай прогноз по марже и cash flow на 90 дней"),
    ).toBe("strategy_forecast");
  });

  it("маршрутизирует агрономический прогноз урожайности в yield_prediction", () => {
    expect(detectDataScientistIntent("Нужен прогноз урожая по полю 14")).toBe(
      "yield_prediction",
    );
  });

  it("маршрутизирует запрос по оптимизации затрат в cost_optimization", () => {
    expect(detectDataScientistIntent("Проведи оптимизацию затрат сезона 2026")).toBe(
      "cost_optimization",
    );
  });
});
