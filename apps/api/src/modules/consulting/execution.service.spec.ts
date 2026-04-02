import { Test, TestingModule } from "@nestjs/testing";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { TechMapStatus } from "@rai/prisma-client";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { OutboxService } from "../../shared/outbox/outbox.service";
import { EvidenceService } from "../tech-map/evidence/evidence.service";
import { FieldObservationService } from "../field-observation/field-observation.service";
import { ExecutionService } from "./execution.service";

describe("ExecutionService", () => {
  let service: ExecutionService;
  let prisma: any;
  let evidenceService: any;
  let fieldObservationService: any;

  beforeEach(async () => {
    prisma = {
      mapOperation: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      deviationReview: {
        findMany: jest.fn(),
      },
      fieldObservation: {
        findMany: jest.fn(),
      },
    };
    evidenceService = {
      attachEvidence: jest.fn(),
      getByOperation: jest.fn(),
      validateOperationCompletion: jest.fn(),
    };
    fieldObservationService = {
      createObservation: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutionService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: EventEmitter2,
          useValue: { emit: jest.fn() },
        },
        {
          provide: OutboxService,
          useValue: { persistEvent: jest.fn() },
        },
        {
          provide: EvidenceService,
          useValue: evidenceService,
        },
        {
          provide: FieldObservationService,
          useValue: fieldObservationService,
        },
      ],
    }).compile();

    service = module.get(ExecutionService);
    prisma.mapOperation.findFirst.mockResolvedValue({
      id: "op-1",
      mapStage: {
        techMap: {
          id: "tm-1",
          fieldId: "field-1",
          seasonId: "season-1",
        },
      },
    });
    prisma.mapOperation.findMany.mockResolvedValue([
      {
        id: "op-1",
        evidenceRequired: ["PHOTO", "LAB_REPORT"],
        mapStage: {
          techMap: {
            id: "tm-1",
            fieldId: "field-1",
            seasonId: "season-1",
            decisionGates: [
              {
                id: "gate-1",
                severity: "CRITICAL",
                status: "OPEN",
                title: "Нужен governed review",
                recommendations: [],
              },
            ],
            recommendations: [
              {
                id: "rec-1",
                severity: "WARNING",
                title: "Проверить операцию",
              },
            ],
            changeOrders: [
              {
                id: "co-1",
                changeType: "CHANGE_INPUT",
                status: "PENDING_APPROVAL",
                approvals: [
                  { id: "approval-1", decision: "APPROVED" },
                  { id: "approval-2", decision: null },
                ],
              },
            ],
          },
          controlPoints: [
            {
              id: "cp-1",
              outcomeExplanations: [
                {
                  id: "outcome-1",
                  payload: {
                    deviationReviewId: "dev-1",
                  },
                },
              ],
            },
          ],
        },
        evidence: [
          {
            id: "ev-1",
            evidenceType: "PHOTO",
            fileUrl: "camera://capture/latest-photo",
            metadata: {
              executionSourceAudit: {
                urlKind: "intermediate_route",
                sourceScheme: "camera",
              },
            },
          },
        ],
      },
    ]);
    prisma.deviationReview.findMany.mockResolvedValue([
      {
        id: "dev-1",
        deviationSummary: "Нарушение по control point",
        severity: "CRITICAL",
        status: "DETECTED",
        createdAt: new Date("2026-04-01T11:00:00.000Z"),
      },
    ]);
    prisma.fieldObservation.findMany.mockResolvedValue([
      {
        id: "obs-1",
        type: "PHOTO",
        intent: "MONITORING",
        integrityStatus: "WEAK_EVIDENCE",
        content: "Осмотр по active execution context",
        photoUrl: "https://example.com/obs.jpg",
        voiceUrl: null,
        createdAt: new Date("2026-04-01T10:00:00.000Z"),
        authorId: "user-1",
      },
    ]);
  });

  it("attachOperationEvidence прокидывает companyId из execution context", async () => {
    evidenceService.attachEvidence.mockResolvedValue({ id: "ev-1" });

    await service.attachOperationEvidence(
      {
        operationId: "op-1",
        evidenceType: "PHOTO" as any,
        fileUrl: "https://example.com/evidence.jpg",
        capturedAt: new Date("2026-04-01T10:00:00.000Z"),
        checksum:
          "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      },
      {
        companyId: "company-1",
        userId: "user-1",
      },
    );

    expect(evidenceService.attachEvidence).toHaveBeenCalledWith(
      expect.objectContaining({
        operationId: "op-1",
        companyId: "company-1",
        metadata: expect.objectContaining({
          executionSourceAudit: expect.objectContaining({
            urlKind: "artifact",
            sourceScheme: "https",
            isArtifactUrl: true,
            isIntermediateRoute: false,
            attachedViaExecutionFlow: true,
          }),
        }),
      }),
      "company-1",
    );
  });

  it("getOperationEvidenceStatus использует evidence service после scope-check", async () => {
    evidenceService.validateOperationCompletion.mockResolvedValue({
      isComplete: false,
      missingEvidenceTypes: ["PHOTO"],
      presentEvidenceTypes: [],
    });

    const result = await service.getOperationEvidenceStatus("op-1", {
      companyId: "company-1",
      userId: "user-1",
    });

    expect(prisma.mapOperation.findFirst).toHaveBeenCalledWith({
      where: {
        id: "op-1",
        mapStage: {
          techMap: {
            companyId: "company-1",
            status: TechMapStatus.ACTIVE,
          },
        },
      },
      select: {
        id: true,
        mapStage: {
          select: {
            techMap: {
              select: {
                id: true,
                fieldId: true,
                seasonId: true,
              },
            },
          },
        },
      },
    });
    expect(result.isComplete).toBe(false);
    expect(evidenceService.validateOperationCompletion).toHaveBeenCalledWith(
      "op-1",
      "company-1",
    );
  });

  it("createOperationObservation обогащает payload полевым контекстом операции", async () => {
    fieldObservationService.createObservation.mockResolvedValue({
      id: "obs-1",
    });

    await service.createOperationObservation(
      {
        operationId: "op-1",
        type: "PHOTO" as any,
        intent: "MONITORING" as any,
        integrityStatus: "WEAK_EVIDENCE" as any,
        content: "Осмотр культуры перед закрытием control point",
        photoUrl: "https://example.com/photo.jpg",
      },
      {
        companyId: "company-1",
        userId: "user-1",
      },
    );

    expect(fieldObservationService.createObservation).toHaveBeenCalledWith({
      type: "PHOTO",
      intent: "MONITORING",
      integrityStatus: "WEAK_EVIDENCE",
      content: "Осмотр культуры перед закрытием control point",
      photoUrl: "https://example.com/photo.jpg",
      voiceUrl: undefined,
      coordinates: undefined,
      telemetryJson: undefined,
      companyId: "company-1",
      authorId: "user-1",
      fieldId: "field-1",
      seasonId: "season-1",
    });
  });

  it("getActiveOperations добавляет recentObservations по fieldId и seasonId", async () => {
    const result = (await service.getActiveOperations({
      companyId: "company-1",
      userId: "user-1",
    })) as any[];

    expect(prisma.fieldObservation.findMany).toHaveBeenCalledWith({
      where: {
        companyId: "company-1",
        fieldId: "field-1",
        seasonId: "season-1",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        type: true,
        intent: true,
        integrityStatus: true,
        content: true,
        photoUrl: true,
        voiceUrl: true,
        createdAt: true,
        authorId: true,
      },
    });
    expect(result[0].recentObservations).toHaveLength(1);
    expect(result[0].recentObservations[0].id).toBe("obs-1");
    expect(result[0].evidenceSummary).toEqual({
      isComplete: false,
      requiredEvidenceTypes: ["PHOTO", "LAB_REPORT"],
      presentEvidenceTypes: ["PHOTO"],
      missingEvidenceTypes: ["LAB_REPORT"],
      sourceAudit: {
        artifactEvidenceCount: 0,
        intermediateRouteEvidenceCount: 1,
        unresolvedRouteEvidenceTypes: ["PHOTO"],
      },
    });
    expect(result[0].evidence[0].sourceAudit).toEqual({
      urlKind: "intermediate_route",
      sourceScheme: "camera",
      isIntermediateRoute: true,
      isArtifactUrl: false,
    });
    expect(result[0].governanceSummary.decisionGates).toHaveLength(1);
    expect(result[0].governanceSummary.changeOrders[0].approvalSummary).toEqual({
      total: 2,
      approved: 1,
      rejected: 0,
      pending: 1,
    });
    expect(result[0].governanceSummary.deviationReviews[0].id).toBe("dev-1");
  });
});
