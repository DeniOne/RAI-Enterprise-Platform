import { KnowledgeAgent } from "./knowledge-agent.service";
import { KnowledgeToolsRegistry } from "../tools/knowledge-tools.registry";

describe("KnowledgeAgent", () => {
  const knowledgeRegistryMock = {
    execute: jest.fn().mockResolvedValue({
      hits: 2,
      items: [
        { content: "Рапс: норма высева 4–6 кг/га.", score: 0.9 },
        { content: "Предшественник влияет на норму высева.", score: 0.7 },
      ],
    }),
  };

  let agent: KnowledgeAgent;

  beforeEach(() => {
    jest.clearAllMocks();
    agent = new KnowledgeAgent(knowledgeRegistryMock as unknown as KnowledgeToolsRegistry);
  });

  it("query_knowledge вызывает KnowledgeToolsRegistry и возвращает COMPLETED с explain", async () => {
    const result = await agent.run({
      companyId: "c1",
      traceId: "tr1",
      query: "норма высева рапса",
    });
    expect(result.agentName).toBe("KnowledgeAgent");
    expect(result.status).toBe("COMPLETED");
    expect(result.explain).toContain("Найдено совпадений: 2");
    expect(result.explain).toContain("Рапс");
    expect(result.toolCallsCount).toBe(1);
    expect(knowledgeRegistryMock.execute).toHaveBeenCalledWith(
      "query_knowledge",
      { query: "норма высева рапса" },
      { companyId: "c1", traceId: "tr1" },
    );
    expect(result.evidence.length).toBeGreaterThan(0);
  });

  it("при 0 hits возвращает explain «ничего не найдено»", async () => {
    knowledgeRegistryMock.execute.mockResolvedValueOnce({ hits: 0, items: [] });
    const result = await agent.run({
      companyId: "c1",
      traceId: "tr1",
      query: "xyz",
    });
    expect(result.status).toBe("COMPLETED");
    expect(result.explain).toMatch(/ничего не найдено|Найдено совпадений: 0/i);
    expect(result.evidence).toEqual([]);
  });

  it("при ошибке registry возвращает FAILED", async () => {
    knowledgeRegistryMock.execute.mockRejectedValueOnce(new Error("Adapter error"));
    const result = await agent.run({
      companyId: "c1",
      traceId: "tr1",
      query: "q",
    });
    expect(result.status).toBe("FAILED");
    expect(result.explain).toBe("Adapter error");
  });
});
