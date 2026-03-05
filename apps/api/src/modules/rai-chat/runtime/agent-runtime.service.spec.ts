import { Test, TestingModule } from "@nestjs/testing";
import { AgentRuntimeService } from "./agent-runtime.service";
import { RaiToolsRegistry } from "../tools/rai-tools.registry";
import { RaiToolName } from "../tools/rai-tools.types";

describe("AgentRuntimeService", () => {
  let service: AgentRuntimeService;
  const toolsRegistryMock = {
    execute: jest.fn().mockResolvedValue({ echoedMessage: "hi", companyId: "c1" }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentRuntimeService,
        { provide: RaiToolsRegistry, useValue: toolsRegistryMock },
      ],
    }).compile();
    service = module.get(AgentRuntimeService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("run returns executedTools array (other)", async () => {
    const result = await service.run({
      requestedToolCalls: [
        { name: RaiToolName.EchoMessage, payload: { message: "hi" } },
      ],
      actorContext: { companyId: "c1", traceId: "tr_1" },
    });
    expect(result.executedTools).toHaveLength(1);
    expect(result.executedTools[0].name).toBe(RaiToolName.EchoMessage);
    expect(toolsRegistryMock.execute).toHaveBeenCalledWith(
      RaiToolName.EchoMessage,
      { message: "hi" },
      { companyId: "c1", traceId: "tr_1" },
    );
  });

  it("fan-out: agronom и economist вызываются через registry параллельно", async () => {
    toolsRegistryMock.execute
      .mockResolvedValueOnce({ draftId: "d1", status: "DRAFT" })
      .mockResolvedValueOnce({ planId: "p1", roi: 0 });
    const result = await service.run({
      requestedToolCalls: [
        { name: RaiToolName.GenerateTechMapDraft, payload: { fieldRef: "f1", seasonRef: "s1", crop: "rapeseed" } },
        { name: RaiToolName.ComputePlanFact, payload: { scope: { seasonId: "s1" } } },
      ],
      actorContext: { companyId: "c1", traceId: "tr_1" },
    });
    expect(result.executedTools).toHaveLength(2);
    expect(toolsRegistryMock.execute).toHaveBeenCalledWith(
      RaiToolName.GenerateTechMapDraft,
      expect.objectContaining({ fieldRef: "f1", seasonRef: "s1", crop: "rapeseed" }),
      expect.any(Object),
    );
    expect(toolsRegistryMock.execute).toHaveBeenCalledWith(
      RaiToolName.ComputePlanFact,
      expect.objectContaining({ scope: { seasonId: "s1" } }),
      expect.any(Object),
    );
  });

  it("fan-out: knowledge вызывается при QueryKnowledge", async () => {
    toolsRegistryMock.execute.mockResolvedValueOnce({ hits: 2, items: [] });
    const result = await service.run({
      requestedToolCalls: [
        { name: RaiToolName.QueryKnowledge, payload: { query: "нормы высева рапса" } },
      ],
      actorContext: { companyId: "c1", traceId: "tr_1" },
    });
    expect(result.executedTools).toHaveLength(1);
    expect(result.executedTools[0].name).toBe(RaiToolName.QueryKnowledge);
    expect(toolsRegistryMock.execute).toHaveBeenCalledWith(
      RaiToolName.QueryKnowledge,
      { query: "нормы высева рапса" },
      expect.any(Object),
    );
  });
});
