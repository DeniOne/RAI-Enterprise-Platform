import { KnowledgeToolsRegistry } from "./knowledge-tools.registry";
import { RaiToolName } from "./rai-tools.types";

describe("KnowledgeToolsRegistry", () => {
  const actorContext = { companyId: "company-1", traceId: "trace-1" };
  const memoryAdapterMock = {
    getProfile: jest.fn().mockResolvedValue({}),
  };

  const createRegistry = () => {
    const r = new KnowledgeToolsRegistry(memoryAdapterMock as any);
    r.onModuleInit();
    return r;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("has query_knowledge only", () => {
    const r = createRegistry();
    expect(r.has(RaiToolName.QueryKnowledge)).toBe(true);
    expect(r.has(RaiToolName.EchoMessage)).toBe(false);
  });

  it("query_knowledge returns hits from profile lastMessagePreview when query matches", async () => {
    memoryAdapterMock.getProfile.mockResolvedValueOnce({
      lastMessagePreview: "рапс озимый техкарта",
    });
    const r = createRegistry();
    const result = await r.execute(
      RaiToolName.QueryKnowledge,
      { query: "рапс" },
      actorContext,
    );
    expect(result.hits).toBe(1);
    expect(result.items[0].content).toContain("рапс");
    expect(result.items[0].score).toBe(0.8);
  });

  it("query_knowledge returns zero hits when no match", async () => {
    memoryAdapterMock.getProfile.mockResolvedValueOnce({
      lastMessagePreview: "другая тема",
    });
    const r = createRegistry();
    const result = await r.execute(
      RaiToolName.QueryKnowledge,
      { query: "рапс" },
      actorContext,
    );
    expect(result.hits).toBe(0);
    expect(result.items).toEqual([]);
  });
});
