import { Test, TestingModule } from "@nestjs/testing";
import { EpisodicRetrievalService } from "./episodic-retrieval.service";

describe("EpisodicRetrievalService", () => {
  let service: EpisodicRetrievalService;

  const memoryManagerMock = {
    recall: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EpisodicRetrievalService,
        { provide: "MEMORY_MANAGER", useValue: memoryManagerMock },
      ],
    }).compile();

    service = module.get(EpisodicRetrievalService);
    jest.clearAllMocks();
  });

  it("должен возвращать агрегированную статистику и сортировку по confidence", async () => {
    memoryManagerMock.recall.mockResolvedValue([
      {
        id: "m1",
        content: "case-1",
        similarity: 0.81,
        metadata: { outcome: "NEGATIVE" },
      },
      {
        id: "m2",
        content: "case-2",
        similarity: 0.92,
        metadata: { outcome: "POSITIVE" },
      },
      {
        id: "m3",
        content: "case-3",
        similarity: 0.95,
        metadata: { anything: "else" },
      },
    ]);

    const result = await service.retrieve({
      companyId: "company-1",
      embedding: Array(1536).fill(0.1),
      traceId: "t-1",
    });

    expect(result.total).toBe(3);
    expect(result.positive).toBe(1);
    expect(result.negative).toBe(1);
    expect(result.unknown).toBe(1);
    expect(result.items[0].id).toBe("m2");
    expect(result.items[1].id).toBe("m1");
    expect(result.items[2].id).toBe("m3");
    expect(memoryManagerMock.recall).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        companyId: "company-1",
        needsKnowledge: true,
      }),
    );
  });

  it("должен корректно обрабатывать пустой ответ", async () => {
    memoryManagerMock.recall.mockResolvedValue([]);

    const result = await service.retrieve({
      companyId: "company-1",
      embedding: Array(1536).fill(0.2),
    });

    expect(result.total).toBe(0);
    expect(result.items).toEqual([]);
  });
});
