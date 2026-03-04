import { Test, TestingModule } from "@nestjs/testing";
import { EvidenceType } from "@rai/prisma-client";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { EvidenceService } from "./evidence.service";

describe("EvidenceService", () => {
  let service: EvidenceService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      evidence: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      mapOperation: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvidenceService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get(EvidenceService);
  });

  it("операция без evidenceRequired возвращает isComplete=true", async () => {
    prisma.mapOperation.findFirst.mockResolvedValue({ evidenceRequired: null });

    await expect(
      service.validateOperationCompletion("op-1", "company-1"),
    ).resolves.toEqual({
      isComplete: true,
      missingEvidenceTypes: [],
      presentEvidenceTypes: [],
    });
  });

  it("если прикреплено только PHOTO, GEO_TRACK остаётся missing", async () => {
    prisma.mapOperation.findFirst.mockResolvedValue({
      evidenceRequired: ["PHOTO", "GEO_TRACK"],
    });
    prisma.evidence.findMany.mockResolvedValue([{ evidenceType: EvidenceType.PHOTO }]);

    await expect(
      service.validateOperationCompletion("op-1", "company-1"),
    ).resolves.toEqual({
      isComplete: false,
      missingEvidenceTypes: [EvidenceType.GEO_TRACK],
      presentEvidenceTypes: [EvidenceType.PHOTO],
    });
  });

  it("все required evidence прикреплены -> isComplete=true", async () => {
    prisma.mapOperation.findFirst.mockResolvedValue({
      evidenceRequired: ["PHOTO", "GEO_TRACK"],
    });
    prisma.evidence.findMany.mockResolvedValue([
      { evidenceType: EvidenceType.PHOTO },
      { evidenceType: EvidenceType.GEO_TRACK },
    ]);

    await expect(
      service.validateOperationCompletion("op-1", "company-1"),
    ).resolves.toEqual({
      isComplete: true,
      missingEvidenceTypes: [],
      presentEvidenceTypes: [EvidenceType.PHOTO, EvidenceType.GEO_TRACK],
    });
  });

  it("attachEvidence создаёт запись с companyId из контекста", async () => {
    prisma.evidence.create.mockResolvedValue({ id: "ev-1" });

    await service.attachEvidence(
      {
        operationId: "op-1",
        evidenceType: EvidenceType.PHOTO,
        fileUrl: "https://example.com/photo.jpg",
        capturedAt: new Date("2026-03-03T10:00:00.000Z"),
        checksum:
          "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        companyId: "payload-company",
      },
      "company-1",
    );

    expect(prisma.evidence.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        operationId: "op-1",
        companyId: "company-1",
      }),
    });
  });
});
