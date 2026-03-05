import { MonitoringAgent } from "./monitoring-agent.service";
import { RiskToolsRegistry } from "../tools/risk-tools.registry";

describe("MonitoringAgent", () => {
  const riskRegistryMock = { execute: jest.fn() };
  let agent: MonitoringAgent;

  beforeEach(() => {
    jest.clearAllMocks();
    riskRegistryMock.execute.mockResolvedValue({
      count: 1,
      severity: "S4",
      items: [{ id: "e1", severity: "S4", reason: "r1", status: "OPEN", references: {} }],
    });
    agent = new MonitoringAgent(riskRegistryMock as unknown as RiskToolsRegistry);
  });

  it("run вызывает emit_alerts с autonomous контекстом и возвращает COMPLETED с explain", async () => {
    const result = await agent.run({
      companyId: "c1",
      traceId: "t1",
    });
    expect(result.agentName).toBe("MonitoringAgent");
    expect(result.status).toBe("COMPLETED");
    expect(result.traceId).toBe("t1");
    expect(result.explain).toMatch(/алертов|Причина/i);
    expect(result.signalsSnapshot).toBeDefined();
    expect(riskRegistryMock.execute).toHaveBeenCalledWith(
      "emit_alerts",
      { severity: "S4" },
      expect.objectContaining({
        companyId: "c1",
        traceId: "t1",
        isAutonomous: true,
      }),
    );
  });

  it("дедупликация: второй вызов с тем же результатом возвращает 0 alerts и explain про дедуп", async () => {
    const sameResult = {
      count: 2,
      severity: "S4",
      items: [
        { id: "a", severity: "S4", reason: "x", status: "OPEN", references: {} },
      ],
    };
    riskRegistryMock.execute.mockResolvedValue(sameResult);
    const r1 = await agent.run({ companyId: "c1", traceId: "t1" });
    expect(r1.alertsEmitted).toBe(2);
    const r2 = await agent.run({ companyId: "c1", traceId: "t2" });
    expect(r2.alertsEmitted).toBe(0);
    expect(r2.explain).toMatch(/дедупликация|совпадает/i);
  });

  it("rate limit: после 10 алертов возвращает RATE_LIMITED", async () => {
    let callCount = 0;
    riskRegistryMock.execute.mockImplementation(() =>
      Promise.resolve({
        count: 1,
        severity: "S4",
        items: [{ id: `e-${++callCount}`, severity: "S4", reason: "r", status: "OPEN", references: {} }],
      }),
    );
    const companyId = "rate-limit-company";
    for (let i = 0; i < 10; i++) {
      const r = await agent.run({ companyId, traceId: `trace-${i}` });
      expect(r.status).toBe("COMPLETED");
    }
    const r11 = await agent.run({ companyId, traceId: "trace-11" });
    expect(r11.status).toBe("RATE_LIMITED");
    expect(r11.alertsEmitted).toBe(0);
    expect(r11.explain).toMatch(/Лимит|исчерпан/i);
  });
});
