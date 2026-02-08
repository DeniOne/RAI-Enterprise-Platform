import { Test, TestingModule } from "@nestjs/testing";
import { ObservationIntent, ObservationType, IntegrityStatus } from "@rai/prisma-client";
import { FieldObservationService } from "./field-observation.service";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuditService } from "../../shared/audit/audit.service";
import { IntegrityGateService } from "../integrity/integrity-gate.service";
import { ShadowAdvisoryService } from "../../shared/memory/shadow-advisory.service";

describe("FieldObservationService", () => {
  let service: FieldObservationService;

  const prismaMock = {
    fieldObservation: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };
  const auditMock = { log: jest.fn() };
  const gateMock = { processObservation: jest.fn() };
  const shadowMock = { evaluate: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FieldObservationService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: auditMock },
        { provide: IntegrityGateService, useValue: gateMock },
        { provide: ShadowAdvisoryService, useValue: shadowMock },
      ],
    }).compile();

    service = module.get(FieldObservationService);
    jest.clearAllMocks();
  });

  it("должен создавать observation и вызывать shadow advisory в режиме OPERATION", async () => {
    prismaMock.fieldObservation.create.mockResolvedValue({
      id: "obs-1",
      intent: ObservationIntent.MONITORING,
      integrityStatus: IntegrityStatus.NO_EVIDENCE,
      type: ObservationType.PHOTO,
    });
    gateMock.processObservation.mockResolvedValue(undefined);
    shadowMock.evaluate.mockResolvedValue({
      recommendation: "REVIEW",
      confidence: 0.5,
    });

    const result = await service.createObservation({
      type: ObservationType.PHOTO,
      companyId: "c1",
      authorId: "u1",
      fieldId: "f1",
      seasonId: "s1",
      content: "test",
      photoUrl: "http://photo",
    });

    expect(result.id).toBe("obs-1");
    expect(auditMock.log).toHaveBeenCalled();
    expect(shadowMock.evaluate).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "c1",
        traceId: "obs-1",
        signalType: "OPERATION",
        memoryType: "PROCESS",
      }),
    );
  });
});
