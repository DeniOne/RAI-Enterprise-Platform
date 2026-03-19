import { RaiToolName } from "./rai-tools.types";
import {
  detectContractsIntent,
  detectCrmIntent,
  detectDataScientistIntent,
} from "./execution-adapter-heuristics";

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

  it("не форсит strategy_forecast по умолчанию без явного сигнала", () => {
    expect(detectDataScientistIntent("Посмотри общую динамику по сезону")).toBe(
      "seasonal_report",
    );
  });
});

describe("detectContractsIntent", () => {
  it("не форсит create_commerce_contract для read-only запроса", () => {
    expect(detectContractsIntent([], "покажи все контракты")).toBe(
      "list_commerce_contracts",
    );
  });

  it("выбирает write-intent только при action-сигнале", () => {
    expect(detectContractsIntent([], "создай договор поставки")).toBe(
      "create_commerce_contract",
    );
  });

  it("сохраняет tool_call приоритет над эвристикой", () => {
    expect(
      detectContractsIntent(
        [{ name: RaiToolName.GetArBalance, payload: {} }],
        "создай договор",
      ),
    ).toBe("review_ar_balance");
  });
});

describe("detectCrmIntent", () => {
  it("не форсит create_crm_contact на read-only запросе", () => {
    expect(detectCrmIntent([], "покажи контакт клиента")).toBe(
      "review_account_workspace",
    );
  });

  it("переходит в create_crm_contact при явном action-сигнале", () => {
    expect(detectCrmIntent([], "добавь контакт Иван Петров")).toBe(
      "create_crm_contact",
    );
  });
});
