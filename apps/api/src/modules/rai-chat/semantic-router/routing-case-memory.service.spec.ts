import "reflect-metadata";
import { Test } from "@nestjs/testing";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { RoutingCaseMemoryService } from "./routing-case-memory.service";

describe("RoutingCaseMemoryService", () => {
  const mockAuditLogFindMany = jest.fn();
  const mockAuditLogCreate = jest.fn();

  let service: RoutingCaseMemoryService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        RoutingCaseMemoryService,
        {
          provide: PrismaService,
          useValue: {
            auditLog: {
              findMany: mockAuditLogFindMany,
              create: mockAuditLogCreate,
            },
          },
        },
      ],
    }).compile();

    service = moduleRef.get(RoutingCaseMemoryService);
  });

  it("читает captured candidate, активирует его и возвращает active lifecycle", async () => {
    mockAuditLogFindMany
      .mockResolvedValueOnce([
        {
          id: "capture-1",
          createdAt: new Date("2026-03-20T10:00:00Z"),
          metadata: {
            candidateKey:
              "agro.techmaps.list-open-create::agronomist::navigate::legacy_write_vs_semantic_read::semantic-router-v1::semantic-router-prompt-v1::toolset",
            sliceId: "agro.techmaps.list-open-create",
            targetRole: "agronomist",
            decisionType: "navigate",
            mismatchKinds: ["legacy_write_vs_semantic_read"],
            routerVersion: "semantic-router-v1",
            promptVersion: "semantic-router-prompt-v1",
            toolsetVersion: "toolset",
            traceCount: 3,
            semanticPrimaryCount: 2,
            firstSeenAt: "2026-03-20T09:00:00.000Z",
            lastSeenAt: "2026-03-20T10:00:00.000Z",
            ttlExpiresAt: "2026-04-27T10:00:00.000Z",
            sampleTraceId: "tr-1",
            sampleQueryRedacted: "покажи все созданные техкарты",
            semanticIntent: {
              domain: "agro",
              entity: "techmap",
              action: "list",
              interactionMode: "navigation",
              mutationRisk: "safe_read",
              filters: {},
              requiredContext: [],
              focusObject: null,
              dialogState: {
                activeFlow: null,
                pendingClarificationKeys: [],
                lastUserAction: null,
              },
              resolvability: "partial",
              ambiguityType: "none",
              confidenceBand: "high",
              reason: "captured_case",
            },
            routeDecision: {
              decisionType: "navigate",
              recommendedExecutionMode: "open_route",
              eligibleTools: [],
              eligibleFlows: ["techmaps_registry"],
              requiredContextMissing: [],
              policyChecksRequired: [],
              needsConfirmation: false,
              needsClarification: false,
              abstainReason: null,
              policyBlockReason: null,
            },
          },
        },
      ])
      .mockResolvedValueOnce([]);
    mockAuditLogCreate.mockResolvedValue({ id: "activation-1" });

    const result = await service.retrieveRelevantCases({
      companyId: "c1",
      message: "покажи все созданные техкарты",
      workspaceContext: {
        route: "/consulting/techmaps",
      } as any,
      legacyClassification: {
        targetRole: "agronomist",
        intent: "tech_map_draft",
        toolName: "generate_tech_map_draft" as any,
        confidence: 0.5,
        method: "regex",
        reason: "legacy",
      },
      semanticIntent: {
        domain: "agro" as any,
        entity: "techmap" as any,
        action: "list" as any,
        interactionMode: "navigation" as any,
        mutationRisk: "safe_read" as any,
        filters: {},
        requiredContext: [],
        focusObject: null,
        dialogState: {
          activeFlow: null,
          pendingClarificationKeys: [],
          lastUserAction: null,
        },
        resolvability: "partial" as any,
        ambiguityType: "none" as any,
        confidenceBand: "medium" as any,
        reason: "deterministic",
      },
      routeDecision: {
        decisionType: "navigate" as any,
        recommendedExecutionMode: "open_route" as any,
        eligibleTools: [],
        eligibleFlows: ["techmaps_registry"],
        requiredContextMissing: [],
        policyChecksRequired: [],
        needsConfirmation: false,
        needsClarification: false,
        abstainReason: null,
        policyBlockReason: null,
      },
      sliceId: "agro.techmaps.list-open-create",
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      key: "agro.techmaps.list-open-create::agronomist::navigate::legacy_write_vs_semantic_read::semantic-router-v1::semantic-router-prompt-v1::toolset",
      lifecycleStatus: "active",
      activationAuditLogId: "activation-1",
    });
    expect(result[0].similarityScore).toBeGreaterThanOrEqual(0.7);
    expect(mockAuditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "ROUTING_CASE_MEMORY_CASE_ACTIVATED",
        companyId: "c1",
        metadata: expect.objectContaining({
          candidateKey:
            "agro.techmaps.list-open-create::agronomist::navigate::legacy_write_vs_semantic_read::semantic-router-v1::semantic-router-prompt-v1::toolset",
        }),
      }),
      select: { id: true },
    });
  });
});
