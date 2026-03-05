import * as Joi from "joi";
import { RiskToolsRegistry } from "./risk-tools.registry";
import { RaiToolName } from "./rai-tools.types";
import { SecurityViolationError } from "../security/security-violation.error";

describe("RiskToolsRegistry", () => {
  const actorContext = { companyId: "company-1", traceId: "trace-1" };
  const prismaMock = {
    agroEscalation: { findMany: jest.fn().mockResolvedValue([]) },
  };

  const createRegistry = () => {
    const r = new RiskToolsRegistry(prismaMock as any);
    r.onModuleInit();
    return r;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("has emit_alerts and get_weather_forecast", () => {
    const r = createRegistry();
    expect(r.has(RaiToolName.EmitAlerts)).toBe(true);
    expect(r.has(RaiToolName.GetWeatherForecast)).toBe(true);
    expect(r.has(RaiToolName.QueryKnowledge)).toBe(false);
  });

  it("emit_alerts returns open escalations in tenant scope", async () => {
    prismaMock.agroEscalation.findMany.mockResolvedValueOnce([
      { id: "e1", severity: "S4", reason: "r1", status: "OPEN", references: {} },
    ]);
    const r = createRegistry();
    const result = await r.execute(
      RaiToolName.EmitAlerts,
      { severity: "S4" },
      actorContext,
    );
    expect(result).toEqual({
      count: 1,
      severity: "S4",
      items: [{ id: "e1", severity: "S4", reason: "r1", status: "OPEN", references: {} }],
    });
  });

  it("get_weather_forecast stub returns unavailable", async () => {
    const r = createRegistry();
    const result = await r.execute(
      RaiToolName.GetWeatherForecast,
      {},
      actorContext,
    );
    expect(result).toEqual({ forecast: "unavailable", source: "stub" });
  });

  it("READ tools work with isAutonomous context", async () => {
    prismaMock.agroEscalation.findMany.mockResolvedValueOnce([]);
    const r = createRegistry();
    const autonomousContext = {
      companyId: "company-1",
      traceId: "trace-1",
      isAutonomous: true,
    };
    const result = await r.execute(
      RaiToolName.EmitAlerts,
      { severity: "S3" },
      autonomousContext,
    );
    expect(result.count).toBe(0);
  });

  it("throws SecurityViolationError when WRITE tool called from autonomous context", async () => {
    const r = new RiskToolsRegistry(prismaMock as any);
    r.register(
      RaiToolName.EmitAlerts,
      Joi.object({ severity: Joi.string().valid("S3", "S4").default("S3") }),
      "WRITE",
      async () => ({ count: 0, severity: "S3", items: [] }),
    );
    await expect(
      r.execute(RaiToolName.EmitAlerts, {}, {
        companyId: "c1",
        traceId: "t1",
        isAutonomous: true,
      }),
    ).rejects.toThrow(SecurityViolationError);
  });
});
