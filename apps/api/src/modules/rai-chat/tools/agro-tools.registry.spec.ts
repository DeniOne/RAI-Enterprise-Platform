import { AgroToolsRegistry } from "./agro-tools.registry";
import { RaiToolName } from "./rai-tools.types";
import { BadRequestException } from "@nestjs/common";

describe("AgroToolsRegistry", () => {
  const actorContext = { companyId: "company-1", traceId: "trace-1" };
  const deviationServiceMock = {
    getActiveDeviations: jest.fn().mockResolvedValue([]),
  };
  const techMapServiceMock = {
    createDraftStub: jest.fn(),
  };

  let registry: AgroToolsRegistry;

  beforeEach(() => {
    jest.clearAllMocks();
    registry = new AgroToolsRegistry(
      deviationServiceMock as any,
      techMapServiceMock as any,
    );
    registry.onModuleInit();
  });

  it("has returns true for agro tools only", () => {
    expect(registry.has(RaiToolName.ComputeDeviations)).toBe(true);
    expect(registry.has(RaiToolName.GenerateTechMapDraft)).toBe(true);
    expect(registry.has(RaiToolName.EchoMessage)).toBe(false);
    expect(registry.has(RaiToolName.ComputePlanFact)).toBe(false);
  });

  it("execute compute_deviations returns count and items", async () => {
    deviationServiceMock.getActiveDeviations.mockResolvedValueOnce([
      {
        id: "d1",
        status: "OPEN",
        harvestPlanId: "p1",
        budgetPlanId: "b1",
        harvestPlan: { seasonId: "s1", techMaps: [{ fieldId: "f1" }] },
      },
    ]);

    const result = await registry.execute(
      RaiToolName.ComputeDeviations,
      { scope: { seasonId: "s1", fieldId: "f1" } },
      actorContext,
    );

    expect(result).toEqual(
      expect.objectContaining({
        count: 1,
        seasonId: "s1",
        fieldId: "f1",
        items: expect.arrayContaining([
          expect.objectContaining({
            id: "d1",
            status: "OPEN",
            harvestPlanId: "p1",
            budgetPlanId: "b1",
          }),
        ]),
      }),
    );
  });

  it("execute generate_tech_map_draft calls techMapService.createDraftStub", async () => {
    techMapServiceMock.createDraftStub.mockResolvedValueOnce({
      draftId: "tm-1",
      status: "DRAFT",
      fieldRef: "f1",
      seasonRef: "s1",
      crop: "rapeseed",
      missingMust: [],
      tasks: [],
      assumptions: [],
    });

    const result = await registry.execute(
      RaiToolName.GenerateTechMapDraft,
      { fieldRef: "f1", seasonRef: "s1", crop: "rapeseed" },
      actorContext,
    );

    expect(techMapServiceMock.createDraftStub).toHaveBeenCalledWith({
      fieldRef: "f1",
      seasonRef: "s1",
      crop: "rapeseed",
      companyId: "company-1",
    });
    expect(result.draftId).toBe("tm-1");
    expect(result.status).toBe("DRAFT");
  });

  it("execute throws for invalid payload", async () => {
    await expect(
      registry.execute(
        RaiToolName.GenerateTechMapDraft,
        { fieldRef: "f1" }, // missing seasonRef, crop
        actorContext,
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
