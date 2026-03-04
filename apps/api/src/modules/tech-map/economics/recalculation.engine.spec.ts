import { RecalculationEngine } from "./recalculation.engine";

describe("RecalculationEngine", () => {
  let engine: RecalculationEngine;
  let budgetService: any;
  let kpiService: any;
  let triggerService: any;

  beforeEach(() => {
    budgetService = {
      calculateBudget: jest.fn(),
      checkOverspend: jest.fn(),
    };
    kpiService = {
      recalculate: jest.fn(),
    };
    triggerService = {
      evaluateTriggers: jest.fn(),
    };

    engine = new RecalculationEngine(
      budgetService,
      kpiService,
      triggerService,
    );
  });

  it("onEvent CHANGE_ORDER_APPLIED -> вызывает calculateBudget + checkOverspend + recalculate", async () => {
    budgetService.calculateBudget.mockResolvedValue({ totalPlanned: 1 });
    budgetService.checkOverspend.mockResolvedValue({ createdChangeOrders: [] });
    kpiService.recalculate.mockResolvedValue({ marginPct: 12 });

    await engine.onEvent(
      { type: "CHANGE_ORDER_APPLIED", techMapId: "tm-1" },
      "company-1",
      7000,
    );

    expect(budgetService.calculateBudget).toHaveBeenCalledWith(
      "tm-1",
      "company-1",
    );
    expect(budgetService.checkOverspend).toHaveBeenCalledWith(
      "tm-1",
      "company-1",
    );
    expect(kpiService.recalculate).toHaveBeenCalledWith(
      "tm-1",
      "company-1",
      7000,
      undefined,
    );
  });

  it("onEvent PRICE_CHANGED -> обновляет KPI с новой ценой", async () => {
    budgetService.calculateBudget.mockResolvedValue({ totalPlanned: 1 });
    budgetService.checkOverspend.mockResolvedValue({ createdChangeOrders: [] });
    kpiService.recalculate.mockResolvedValue({ grossRevenuePerHa: 30000 });

    await engine.onEvent(
      { type: "PRICE_CHANGED", techMapId: "tm-1" },
      "company-1",
      7500,
      0.15,
    );

    expect(kpiService.recalculate).toHaveBeenCalledWith(
      "tm-1",
      "company-1",
      7500,
      0.15,
    );
  });
});
