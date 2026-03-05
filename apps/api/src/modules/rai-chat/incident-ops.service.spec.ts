import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { IncidentOpsService } from "./incident-ops.service";
import { SystemIncidentType } from "@rai/prisma-client";

describe("IncidentOpsService", () => {
  let service: IncidentOpsService;
  const createMock = jest.fn();
  const findManyMock = jest.fn();
  const prisma = {
    systemIncident: { create: createMock, findMany: findManyMock },
  } as unknown as PrismaService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentOpsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(IncidentOpsService);
  });

  it("logIncident создаёт запись в systemIncident", () => {
    createMock.mockResolvedValue({ id: "inc1" });
    service.logIncident({
      companyId: "c1",
      traceId: "tr1",
      incidentType: SystemIncidentType.PII_LEAK,
      severity: "MEDIUM",
      details: { x: 1 },
    });
    expect(createMock).toHaveBeenCalledWith({
      data: {
        companyId: "c1",
        traceId: "tr1",
        incidentType: SystemIncidentType.PII_LEAK,
        severity: "MEDIUM",
        details: { x: 1 },
      },
    });
  });

  it("getIncidentsFeed возвращает только записи companyId с пагинацией", async () => {
    const row = {
      id: "inc1",
      companyId: "c1",
      traceId: "tr1",
      incidentType: SystemIncidentType.PII_LEAK,
      severity: "MEDIUM",
      details: {},
      createdAt: new Date("2026-03-05T12:00:00Z"),
    };
    findManyMock.mockResolvedValue([row]);
    const feed = await service.getIncidentsFeed("c1", 10, 0);
    expect(findManyMock).toHaveBeenCalledWith({
      where: { companyId: "c1" },
      orderBy: { createdAt: "desc" },
      take: 10,
      skip: 0,
    });
    expect(feed).toHaveLength(1);
    expect(feed[0].id).toBe("inc1");
    expect(feed[0].companyId).toBe("c1");
    expect(feed[0].incidentType).toBe(SystemIncidentType.PII_LEAK);
    expect(feed[0].createdAt).toBe("2026-03-05T12:00:00.000Z");
  });
});
