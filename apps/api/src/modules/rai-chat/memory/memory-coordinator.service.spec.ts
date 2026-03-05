import { Test, TestingModule } from "@nestjs/testing";
import { MemoryCoordinatorService } from "./memory-coordinator.service";

describe("MemoryCoordinatorService", () => {
  let service: MemoryCoordinatorService;
  const memoryAdapterMock = {
    retrieve: jest.fn().mockResolvedValue({
      traceId: "tr_1",
      total: 0,
      positive: 0,
      negative: 0,
      unknown: 0,
      items: [],
    }),
    getProfile: jest.fn().mockResolvedValue({}),
    appendInteraction: jest.fn().mockResolvedValue(undefined),
    updateProfile: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemoryCoordinatorService,
        { provide: "MEMORY_ADAPTER", useValue: memoryAdapterMock },
      ],
    }).compile();
    service = module.get(MemoryCoordinatorService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("recallContext returns recall and profile", async () => {
    const result = await service.recallContext(
      { message: "test" },
      { companyId: "c1", traceId: "tr_1" },
      "u1",
    );
    expect(result.recall).toBeDefined();
    expect(result.recall.items).toEqual([]);
    expect(result.profile).toEqual({});
    expect(memoryAdapterMock.getProfile).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: "c1", userId: "u1" }),
    );
  });
});
