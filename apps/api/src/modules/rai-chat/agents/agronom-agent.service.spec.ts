import { AgronomAgent } from "./agronom-agent.service";
import { AgroToolsRegistry } from "../tools/agro-tools.registry";
import { AgroDeterministicEngineFacade } from "../deterministic/agro-deterministic.facade";

describe("AgronomAgent", () => {
  const techMapMock = { createDraftStub: jest.fn() };
  const deviationMock = { getActiveDeviations: jest.fn().mockResolvedValue([]) };
  const agroRegistry = new AgroToolsRegistry(
    deviationMock as any,
    techMapMock as any,
  );
  agroRegistry.onModuleInit();
  const agroFacade = new AgroDeterministicEngineFacade();
  const agent = new AgronomAgent(agroRegistry, agroFacade);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("generate_tech_map_draft with fieldRef and seasonRef returns COMPLETED with explain", async () => {
    techMapMock.createDraftStub.mockResolvedValueOnce({
      draftId: "tm-1",
      status: "DRAFT",
      fieldRef: "f1",
      seasonRef: "s1",
      crop: "rapeseed",
      missingMust: [],
      tasks: [],
      assumptions: [],
    });
    const result = await agent.run({
      companyId: "c1",
      traceId: "tr1",
      intent: "generate_tech_map_draft",
      fieldRef: "f1",
      seasonRef: "s1",
      crop: "rapeseed",
    });
    expect(result.agentName).toBe("AgronomAgent");
    expect(result.status).toBe("COMPLETED");
    expect(result.confidence).toBe(0.6);
    expect(result.explain).toContain("Черновик создан детерминированно");
    expect(result.toolCallsCount).toBe(1);
    expect((result.data as { draftId: string }).draftId).toBe("tm-1");
    expect(Array.isArray(result.mathBasis)).toBe(true);
    expect((result.mathBasis ?? []).length).toBeGreaterThan(0);
    expect((result.mathBasis ?? [])[0]).toMatchObject({
      value: expect.any(Number),
      formula: expect.any(String),
      unit: "кг/га",
      explanation: expect.any(String),
    });
  });

  it("generate_tech_map_draft without fieldRef returns NEEDS_MORE_DATA", async () => {
    const result = await agent.run({
      companyId: "c1",
      traceId: "tr1",
      intent: "generate_tech_map_draft",
      seasonRef: "s1",
    });
    expect(result.status).toBe("NEEDS_MORE_DATA");
    expect(result.missingContext).toContain("fieldRef");
    expect(result.toolCallsCount).toBe(0);
  });

  it("compute_deviations returns COMPLETED with data", async () => {
    deviationMock.getActiveDeviations.mockResolvedValueOnce([
      { id: "d1", status: "OPEN", harvestPlanId: "p1", budgetPlanId: "b1", harvestPlan: { seasonId: "s1", techMaps: [] } },
    ]);
    const result = await agent.run({
      companyId: "c1",
      traceId: "tr1",
      intent: "compute_deviations",
      scope: { seasonId: "s1" },
    });
    expect(result.status).toBe("COMPLETED");
    expect(result.confidence).toBe(0.9);
    expect(result.explain).toContain("Отклонения получены");
    expect((result.data as { count: number }).count).toBe(1);
  });

  it("generate_tech_map_draft when handler throws returns FAILED", async () => {
    techMapMock.createDraftStub.mockRejectedValueOnce(new Error("service error"));
    const result = await agent.run({
      companyId: "c1",
      traceId: "tr1",
      intent: "generate_tech_map_draft",
      fieldRef: "f1",
      seasonRef: "s1",
    });
    expect(result.status).toBe("FAILED");
    expect(result.explain).toContain("service error");
  });
});
