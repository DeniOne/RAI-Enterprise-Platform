import "reflect-metadata";
import { Test, TestingModule } from "@nestjs/testing";
import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { SensitiveDataFilterService } from "../rai-chat/security/sensitive-data-filter.service";
import { ExplainabilityPanelService } from "./explainability-panel.service";
import { QueueMetricsService } from "../rai-chat/performance/queue-metrics.service";

describe("ExplainabilityPanelService", () => {
  let service: ExplainabilityPanelService;
  let prisma: PrismaService;

  const mockAiAuditFindMany = jest.fn();
  const mockPendingFindMany = jest.fn();
  const mockDecisionFindMany = jest.fn();
  const mockQuorumFindMany = jest.fn();
  const mockTraceSummaryFindMany = jest.fn();
  const mockTraceSummaryFindFirst = jest.fn();
  const mockQualityAlertFindMany = jest.fn();
  const mockAuditLogFindMany = jest.fn();
  const mockAuditLogCreate = jest.fn();
  const queueMetricsMock = {
    getQueuePressure: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExplainabilityPanelService,
        SensitiveDataFilterService,
        {
          provide: QueueMetricsService,
          useValue: queueMetricsMock,
        },
        {
          provide: PrismaService,
          useValue: {
            aiAuditEntry: {
              findMany: mockAiAuditFindMany,
            },
            pendingAction: {
              findMany: mockPendingFindMany,
            },
            decisionRecord: {
              findMany: mockDecisionFindMany,
            },
            quorumProcess: {
              findMany: mockQuorumFindMany,
            },
            traceSummary: {
              findMany: mockTraceSummaryFindMany,
              findFirst: mockTraceSummaryFindFirst,
            },
            auditLog: {
              findMany: mockAuditLogFindMany,
              create: mockAuditLogCreate,
            },
            qualityAlert: {
              findMany: mockQualityAlertFindMany,
            },
          },
        },
      ],
    }).compile();

    service = module.get(ExplainabilityPanelService);
    prisma = module.get(PrismaService);
    mockAuditLogFindMany.mockResolvedValue([]);
  });

  it("returns tenant-scoped queue pressure from live queue metrics source", async () => {
    queueMetricsMock.getQueuePressure.mockResolvedValue({
      pressureState: "PRESSURED",
      signalFresh: true,
      totalBacklog: 7,
      hottestQueue: "runtime_active_tool_calls",
      observedQueues: [
        {
          queueName: "runtime_active_tool_calls",
          lastSize: 5,
          avgSize: 3,
          peakSize: 5,
          samples: 2,
          lastObservedAt: new Date("2026-03-07T10:00:00Z").toISOString(),
        },
      ],
    });

    const result = await service.getQueuePressure("c1", 3600_000);

    expect(queueMetricsMock.getQueuePressure).toHaveBeenCalledWith("c1", 3600_000);
    expect(result).toMatchObject({
      companyId: "c1",
      pressureState: "PRESSURED",
      signalFresh: true,
      totalBacklog: 7,
      hottestQueue: "runtime_active_tool_calls",
    });
  });

  it("агрегирует routing divergence из audit metadata", async () => {
    mockAiAuditFindMany.mockResolvedValue([
      {
        traceId: "tr-1",
        createdAt: new Date("2026-03-20T10:00:00Z"),
        metadata: {
          routingTelemetry: {
            traceId: "tr-1",
            threadId: "th-1",
            routerVersion: "semantic-router-v1",
            promptVersion: "semantic-router-prompt-v1",
            toolsetVersion: "toolset",
            workspaceRoute: "/consulting/techmaps",
            workspaceStateDigest: "digest",
            activeFlow: null,
            userQueryRedacted: "покажи все созданные техкарты",
            legacyClassification: {
              targetRole: "agronomist",
              intent: "tech_map_draft",
              toolName: "generate_tech_map_draft",
              confidence: 0.7,
              method: "regex",
              reason: "legacy",
            },
            semanticIntent: {
              domain: "agro",
              entity: "techmap",
              action: "list",
              interactionMode: "navigation",
              mutationRisk: "safe_read",
              filters: {},
              requiredContext: [],
              focusObject: null,
              dialogState: { activeFlow: null, pendingClarificationKeys: [], lastUserAction: null },
              resolvability: "partial",
              ambiguityType: "none",
              confidenceBand: "high",
              reason: "semantic",
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
            candidateRoutes: [],
            divergence: {
              isMismatch: true,
              mismatchKinds: ["legacy_write_vs_semantic_read"],
              summary: "legacy_write_vs_semantic_read",
              legacyRouteKey: "agronomist:tech_map_draft:generate_tech_map_draft",
              semanticRouteKey: "agro:techmap:list:navigate:none",
            },
            executionPath: "semantic_router_primary",
            fallbackReason: null,
            abstainReason: null,
            policyBlockReason: null,
            requiredContextMissing: [],
            finalOutcome: "completed",
            userCorrection: null,
            latencyMs: 12,
            sliceId: "agro.techmaps.list-open-create",
            promotedPrimary: true,
          },
        },
      },
    ]);

    const result = await service.getRoutingDivergence({
      companyId: "c1",
      windowHours: 24,
      slice: "agro.techmaps.list-open-create",
      onlyMismatches: true,
    });

    expect(result.totalEvents).toBe(1);
    expect(result.mismatchedEvents).toBe(1);
    expect(result.divergenceRatePct).toBe(100);
    expect(result.semanticPrimaryCount).toBe(1);
    expect(result.topClusters[0]).toMatchObject({
      key: "legacy_write_vs_semantic_read",
      count: 1,
    });
    expect(result.agentBreakdown[0]).toMatchObject({
      targetRole: "agronomist",
      totalEvents: 1,
      mismatchedEvents: 1,
      divergenceRatePct: 100,
      semanticPrimaryCount: 1,
      decisionBreakdown: [{ decisionType: "navigate", count: 1 }],
      topMismatchKinds: [{ kind: "legacy_write_vs_semantic_read", count: 1 }],
    });
    expect(result.recentMismatches[0]).toMatchObject({
      targetRole: "agronomist",
    });
    expect(result.failureClusters[0]).toMatchObject({
      targetRole: "agronomist",
      decisionType: "navigate",
      count: 1,
      caseMemoryReadiness: "observe",
    });
    expect(result.caseMemoryCandidates[0]).toMatchObject({
      sliceId: "agro.techmaps.list-open-create",
      targetRole: "agronomist",
      decisionType: "navigate",
      routerVersion: "semantic-router-v1",
      promptVersion: "semantic-router-prompt-v1",
      toolsetVersion: "toolset",
      traceCount: 1,
      semanticPrimaryCount: 1,
      caseMemoryReadiness: "observe",
      captureStatus: "not_captured",
      capturedAt: null,
      captureAuditLogId: null,
    });
    expect(result.caseMemoryCandidates[0].ttlExpiresAt).toBeTruthy();
  });

  it("поднимает повторяющийся failure cluster до ready_for_case_memory", async () => {
    const baseTelemetry = {
      threadId: "th-1",
      routerVersion: "semantic-router-v1",
      promptVersion: "semantic-router-prompt-v1",
      toolsetVersion: "toolset",
      workspaceRoute: "/consulting/techmaps",
      workspaceStateDigest: "digest",
      activeFlow: null,
      legacyClassification: {
        targetRole: "agronomist",
        intent: "tech_map_draft",
        toolName: "generate_tech_map_draft",
        confidence: 0.7,
        method: "regex",
        reason: "legacy",
      },
      semanticIntent: {
        domain: "agro",
        entity: "techmap",
        action: "list",
        interactionMode: "navigation",
        mutationRisk: "safe_read",
        filters: {},
        requiredContext: [],
        focusObject: null,
        dialogState: { activeFlow: null, pendingClarificationKeys: [], lastUserAction: null },
        resolvability: "partial",
        ambiguityType: "none",
        confidenceBand: "high",
        reason: "semantic",
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
      candidateRoutes: [],
      divergence: {
        isMismatch: true,
        mismatchKinds: ["legacy_write_vs_semantic_read"],
        summary: "legacy_write_vs_semantic_read",
        legacyRouteKey: "agronomist:tech_map_draft:generate_tech_map_draft",
        semanticRouteKey: "agro:techmap:list:navigate:none",
      },
      executionPath: "semantic_router_primary",
      fallbackReason: null,
      abstainReason: null,
      policyBlockReason: null,
      requiredContextMissing: [],
      finalOutcome: "completed",
      userCorrection: null,
      latencyMs: 12,
      sliceId: "agro.techmaps.list-open-create",
    };

    mockAiAuditFindMany.mockResolvedValue([
      {
        traceId: "tr-1",
        createdAt: new Date("2026-03-20T10:00:00Z"),
        metadata: {
          routingTelemetry: {
            ...baseTelemetry,
            traceId: "tr-1",
            userQueryRedacted: "покажи все созданные техкарты",
            promotedPrimary: true,
          },
        },
      },
      {
        traceId: "tr-2",
        createdAt: new Date("2026-03-20T10:05:00Z"),
        metadata: {
          routingTelemetry: {
            ...baseTelemetry,
            traceId: "tr-2",
            userQueryRedacted: "где техкарты",
            promotedPrimary: true,
          },
        },
      },
      {
        traceId: "tr-3",
        createdAt: new Date("2026-03-20T10:10:00Z"),
        metadata: {
          routingTelemetry: {
            ...baseTelemetry,
            traceId: "tr-3",
            userQueryRedacted: "выведи активные техкарты",
            promotedPrimary: false,
          },
        },
      },
    ]);

    const result = await service.getRoutingDivergence({
      companyId: "c1",
      windowHours: 24,
      slice: "agro.techmaps.list-open-create",
      onlyMismatches: true,
    });

    expect(result.failureClusters[0]).toMatchObject({
      targetRole: "agronomist",
      decisionType: "navigate",
      mismatchKinds: ["legacy_write_vs_semantic_read"],
      count: 3,
      semanticPrimaryCount: 2,
      caseMemoryReadiness: "ready_for_case_memory",
    });
    expect(result.caseMemoryCandidates[0]).toMatchObject({
      sliceId: "agro.techmaps.list-open-create",
      targetRole: "agronomist",
      decisionType: "navigate",
      mismatchKinds: ["legacy_write_vs_semantic_read"],
      routerVersion: "semantic-router-v1",
      promptVersion: "semantic-router-prompt-v1",
      toolsetVersion: "toolset",
      traceCount: 3,
      semanticPrimaryCount: 2,
      caseMemoryReadiness: "ready_for_case_memory",
      captureStatus: "not_captured",
      capturedAt: null,
      captureAuditLogId: null,
    });
  });

  it("фиксирует ready candidate в audit log и возвращает capture result", async () => {
    const baseTelemetry = {
      threadId: "th-1",
      routerVersion: "semantic-router-v1",
      promptVersion: "semantic-router-prompt-v1",
      toolsetVersion: "toolset",
      workspaceRoute: "/consulting/techmaps",
      workspaceStateDigest: "digest",
      activeFlow: null,
      legacyClassification: {
        targetRole: "agronomist",
        intent: "tech_map_draft",
        toolName: "generate_tech_map_draft",
        confidence: 0.7,
        method: "regex",
        reason: "legacy",
      },
      semanticIntent: {
        domain: "agro",
        entity: "techmap",
        action: "list",
        interactionMode: "navigation",
        mutationRisk: "safe_read",
        filters: {},
        requiredContext: [],
        focusObject: null,
        dialogState: { activeFlow: null, pendingClarificationKeys: [], lastUserAction: null },
        resolvability: "partial",
        ambiguityType: "none",
        confidenceBand: "high",
        reason: "semantic",
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
      candidateRoutes: [],
      divergence: {
        isMismatch: true,
        mismatchKinds: ["legacy_write_vs_semantic_read"],
        summary: "legacy_write_vs_semantic_read",
        legacyRouteKey: "agronomist:tech_map_draft:generate_tech_map_draft",
        semanticRouteKey: "agro:techmap:list:navigate:none",
      },
      executionPath: "semantic_router_primary",
      fallbackReason: null,
      abstainReason: null,
      policyBlockReason: null,
      requiredContextMissing: [],
      finalOutcome: "completed",
      userCorrection: null,
      latencyMs: 12,
      sliceId: "agro.techmaps.list-open-create",
      promotedPrimary: true,
    };

    mockAiAuditFindMany.mockResolvedValue([
      {
        traceId: "tr-1",
        createdAt: new Date("2026-03-20T10:00:00Z"),
        metadata: {
          routingTelemetry: {
            ...baseTelemetry,
            traceId: "tr-1",
            userQueryRedacted: "покажи все созданные техкарты",
          },
        },
      },
      {
        traceId: "tr-2",
        createdAt: new Date("2026-03-20T10:05:00Z"),
        metadata: {
          routingTelemetry: {
            ...baseTelemetry,
            traceId: "tr-2",
            userQueryRedacted: "где техкарты",
          },
        },
      },
      {
        traceId: "tr-3",
        createdAt: new Date("2026-03-20T10:10:00Z"),
        metadata: {
          routingTelemetry: {
            ...baseTelemetry,
            traceId: "tr-3",
            userQueryRedacted: "выведи активные техкарты",
          },
        },
      },
    ]);
    mockAuditLogFindMany.mockResolvedValue([]);
    mockAuditLogCreate.mockResolvedValue({ id: "audit-1" });

    const divergence = await service.getRoutingDivergence({
      companyId: "c1",
      windowHours: 24,
      slice: "agro.techmaps.list-open-create",
      onlyMismatches: true,
    });

    const result = await service.captureRoutingCaseMemoryCandidate({
      companyId: "c1",
      userId: "u1",
      key: divergence.caseMemoryCandidates[0].key,
      windowHours: 24,
      slice: "agro.techmaps.list-open-create",
      targetRole: "agronomist",
      note: "операторский захват",
    });

    expect(mockAuditLogCreate).toHaveBeenCalledTimes(1);
    expect(mockAuditLogCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "ROUTING_CASE_MEMORY_CANDIDATE_CAPTURED",
        companyId: "c1",
        userId: "u1",
        metadata: expect.objectContaining({
          candidateKey: divergence.caseMemoryCandidates[0].key,
          targetRole: "agronomist",
          decisionType: "navigate",
          note: "операторский захват",
        }),
      }),
      select: {
        id: true,
      },
    });
    expect(result).toMatchObject({
      status: "captured",
      candidateKey: divergence.caseMemoryCandidates[0].key,
      auditLogId: "audit-1",
    });
  });

  it("aggregates timeline for own trace", async () => {
    const traceId = "tr_1";
    const companyId = "c1";

    mockAiAuditFindMany.mockResolvedValue([
      {
        id: "a1",
        traceId,
        companyId,
        toolNames: ["generate_tech_map_draft"],
        model: "deterministic",
        intentMethod: "regex",
        tokensUsed: 0,
        createdAt: new Date("2026-03-05T10:00:00.000Z"),
      },
    ]);
    mockPendingFindMany.mockResolvedValue([]);
    mockDecisionFindMany.mockResolvedValue([]);
    mockQuorumFindMany.mockResolvedValue([]);

    const result = await service.getTraceTimeline(traceId, companyId);

    expect(result.traceId).toBe(traceId);
    expect(result.companyId).toBe(companyId);
    expect(result.nodes.length).toBeGreaterThanOrEqual(3);
    expect(result.nodes[0].kind).toBe("router");
    expect(result.nodes[1].kind).toBe("tools");
  });

  it("restores causal timeline from metadata phases", async () => {
    const traceId = "tr_phases";
    const companyId = "c1";

    mockAiAuditFindMany.mockResolvedValue([
      {
        id: "a1",
        traceId,
        companyId,
        toolNames: ["tool1"],
        model: "deterministic",
        intentMethod: "regex",
        tokensUsed: 0,
        metadata: {
          phases: [
            { name: "router", timestamp: "2026-03-06T10:00:00Z", durationMs: 5 },
            { name: "tools", timestamp: "2026-03-06T10:00:01Z", durationMs: 100 },
            { name: "composer", timestamp: "2026-03-06T10:00:02Z", durationMs: 20 },
            { name: "truthfulness", timestamp: "2026-03-06T10:00:05Z", durationMs: 10 },
          ],
        },
        createdAt: new Date("2026-03-06T10:00:00Z"),
      },
    ]);
    mockPendingFindMany.mockResolvedValue([]);
    mockDecisionFindMany.mockResolvedValue([]);
    mockQuorumFindMany.mockResolvedValue([]);

    const result = await service.getTraceTimeline(traceId, companyId);

    // Должно быть 4 ноды из phases
    expect(result.nodes).toHaveLength(4);
    expect(result.nodes[0].kind).toBe("router");
    expect(result.nodes[1].kind).toBe("tools");
    expect(result.nodes[1].metadata?.toolNames).toContain("tool1");
    expect(result.nodes[3].kind).toBe("truthfulness");
    expect(result.nodes[3].label).toBe("Truthfulness Engine");
  });

  it("throws NotFoundException when trace is missing", async () => {
    mockAiAuditFindMany.mockResolvedValue([]);

    await expect(service.getTraceTimeline("missing", "c1")).rejects.toThrow(NotFoundException);
  });

  it("throws ForbiddenException on tenant mismatch", async () => {
    const traceId = "tr_2";
    mockAiAuditFindMany.mockResolvedValue([
      {
        id: "a2",
        traceId,
        companyId: "other-company",
        toolNames: [],
        model: "deterministic",
        intentMethod: "regex",
        tokensUsed: 0,
        createdAt: new Date(),
      },
    ]);

    await expect(service.getTraceTimeline(traceId, "c1")).rejects.toThrow(ForbiddenException);
  });

  it("masks PII in metadata", async () => {
    const traceId = "tr_3";
    const companyId = "c1";

    mockAiAuditFindMany.mockResolvedValue([
      {
        id: "a3",
        traceId,
        companyId,
        toolNames: [],
        model: "deterministic",
        intentMethod: "regex",
        tokensUsed: 0,
        createdAt: new Date("2026-03-05T10:00:00.000Z"),
      },
    ]);
    mockPendingFindMany.mockResolvedValue([]);
    mockDecisionFindMany.mockResolvedValue([
      {
        id: "d1",
        actionType: "TEST",
        targetId: "target-1",
        riskVerdict: "ALLOWED",
        riskState: "CLEAR",
        explanation: "email test@mail.ru",
        traceId,
        companyId,
        decidedAt: new Date("2026-03-05T10:01:00.000Z"),
      },
    ]);
    mockQuorumFindMany.mockResolvedValue([]);

    const result = await service.getTraceTimeline(traceId, companyId);

    const decisionNode = result.nodes.find((n) => n.kind === "decision");
    expect(decisionNode).toBeDefined();
    const metadata = decisionNode!.metadata as Record<string, unknown>;
    expect(String(metadata.explanation)).toContain("[HIDDEN_EMAIL]");
    expect(String(metadata.explanation)).not.toContain("test@mail.ru");

    expect(prisma.decisionRecord.findMany).toHaveBeenCalledWith({
      where: { traceId, companyId },
    });
  });

  it("calculates dashboard metrics for multiple trace summaries", async () => {
    const companyId = "c1";
    const now = new Date();

    mockTraceSummaryFindMany.mockResolvedValue([
      {
        traceId: "tr_1",
        companyId,
        bsScorePct: 10,
        evidenceCoveragePct: 80,
        invalidClaimsPct: 5,
        createdAt: new Date(now.getTime() - 1_000),
      },
      {
        traceId: "tr_2",
        companyId,
        bsScorePct: 30,
        evidenceCoveragePct: 60,
        invalidClaimsPct: 10,
        createdAt: new Date(now.getTime() - 2_000),
      },
      {
        traceId: "tr_3",
        companyId,
        bsScorePct: 50,
        evidenceCoveragePct: 40,
        invalidClaimsPct: 20,
        createdAt: new Date(now.getTime() - 3_000),
      },
    ]);
    mockAuditLogFindMany.mockResolvedValue([
      { action: "ADVISORY_ACCEPTED", metadata: { traceId: "adv-1" } },
      { action: "ADVISORY_ACCEPTED", metadata: { traceId: "adv-2" } },
      { action: "ADVISORY_REJECTED", metadata: { traceId: "adv-3" } },
      { action: "ADVISORY_FEEDBACK_RECORDED", metadata: { traceId: "adv-2", outcome: "corrected" } },
    ]);
    mockAiAuditFindMany.mockResolvedValue([
      {
        traceId: "tr_1",
        companyId,
        createdAt: new Date(now.getTime() - 1_000),
        metadata: {
          phases: [
            { name: "tools", timestamp: new Date(now.getTime() - 1_000).toISOString(), durationMs: 120 },
          ],
        },
      },
      {
        traceId: "tr_2",
        companyId,
        createdAt: new Date(now.getTime() - 2_000),
        metadata: {
          phases: [
            { name: "truthfulness", timestamp: new Date(now.getTime() - 2_000).toISOString(), durationMs: 220 },
          ],
        },
      },
    ]);

    const result = await service.getTruthfulnessDashboard(companyId, 24);

    expect(mockTraceSummaryFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          companyId,
        }),
      }),
    );

    expect(result.companyId).toBe(companyId);
    expect(result.worstTraces).toHaveLength(3);
    expect(result.worstTraces[0].traceId).toBe("tr_3");
    expect(result.worstTraces[1].traceId).toBe("tr_2");
    expect(result.worstTraces[2].traceId).toBe("tr_1");

    expect(result.avgBsScore).toBeCloseTo((10 + 30 + 50) / 3);
    expect(result.avgEvidenceCoverage).toBeCloseTo((80 + 60 + 40) / 3);
    expect(result.acceptanceRate).toBeCloseTo(66.7, 1);
    expect(result.correctionRate).toBeCloseTo(33.3, 1);
    expect(result.p95BsScore).toBeGreaterThanOrEqual(30);
    expect(result.p95BsScore).toBeLessThanOrEqual(50);
    expect(result.qualityKnownTraceCount).toBe(3);
    expect(result.qualityPendingTraceCount).toBe(0);
    expect(result.criticalPath[0]).toMatchObject({
      traceId: "tr_2",
      phase: "truthfulness",
      durationMs: 220,
    });
  });

  it("deduplicates corrected feedback by advisory traceId and never inflates correctionRate above 100%", async () => {
    const companyId = "c1";
    mockTraceSummaryFindMany.mockResolvedValue([
      {
        traceId: "tr_1",
        companyId,
        bsScorePct: 10,
        evidenceCoveragePct: 80,
        invalidClaimsPct: 0,
        createdAt: new Date(),
      },
    ]);
    mockAuditLogFindMany.mockResolvedValue([
      { action: "ADVISORY_ACCEPTED", metadata: { traceId: "adv-1" } },
      { action: "ADVISORY_REJECTED", metadata: { traceId: "adv-2" } },
      { action: "ADVISORY_FEEDBACK_RECORDED", metadata: { traceId: "adv-1", outcome: "corrected" } },
      { action: "ADVISORY_FEEDBACK_RECORDED", metadata: { traceId: "adv-1", outcome: "corrected" } },
      { action: "ADVISORY_FEEDBACK_RECORDED", metadata: { traceId: "adv-x", outcome: "corrected" } },
    ]);
    mockAiAuditFindMany.mockResolvedValue([]);

    const result = await service.getTruthfulnessDashboard(companyId, 24);

    expect(result.acceptanceRate).toBe(50);
    expect(result.correctionRate).toBe(50);
  });

  it("returns pending quality metrics and empty list when no trace summaries", async () => {
    const companyId = "c1";
    mockTraceSummaryFindMany.mockResolvedValue([]);
    mockAuditLogFindMany.mockResolvedValue([]);

    const result = await service.getTruthfulnessDashboard(companyId, 24);

    expect(result.companyId).toBe(companyId);
    expect(result.avgBsScore).toBeNull();
    expect(result.p95BsScore).toBeNull();
    expect(result.avgEvidenceCoverage).toBeNull();
    expect(result.acceptanceRate).toBeNull();
    expect(result.correctionRate).toBeNull();
    expect(result.worstTraces).toHaveLength(0);
    expect(result.qualityKnownTraceCount).toBe(0);
    expect(result.qualityPendingTraceCount).toBe(0);
    expect(result.criticalPath).toHaveLength(0);
  });

  it("keeps pending traces out of averaged quality metrics", async () => {
    const companyId = "c1";
    mockTraceSummaryFindMany.mockResolvedValue([
      {
        traceId: "tr_ready",
        companyId,
        bsScorePct: 20,
        evidenceCoveragePct: 80,
        invalidClaimsPct: 0,
        createdAt: new Date(),
      },
      {
        traceId: "tr_pending",
        companyId,
        bsScorePct: null,
        evidenceCoveragePct: null,
        invalidClaimsPct: null,
        createdAt: new Date(),
      },
    ]);
    mockAuditLogFindMany.mockResolvedValue([]);
    mockAiAuditFindMany.mockResolvedValue([]);

    const result = await service.getTruthfulnessDashboard(companyId, 24);

    expect(result.avgBsScore).toBe(20);
    expect(result.avgEvidenceCoverage).toBe(80);
    expect(result.qualityKnownTraceCount).toBe(1);
    expect(result.qualityPendingTraceCount).toBe(1);
  });

  describe("getTraceForensics", () => {
    it("returns summary, timeline with evidenceRefs, and qualityAlerts for own trace", async () => {
      const traceId = "tr_forensics";
      const companyId = "c1";

      mockAiAuditFindMany.mockResolvedValue([
        {
          id: "ae1",
          traceId,
          companyId,
          toolNames: ["compute_deviations"],
          model: "gpt-4",
          intentMethod: "regex",
          tokensUsed: 100,
          metadata: {
            evidence: [
              {
                claim: "Данные по отклонениям из детерминированного расчёта.",
                sourceType: "TOOL_RESULT",
                sourceId: "compute_deviations",
                confidenceScore: 0.9,
              },
            ],
          },
          createdAt: new Date("2026-03-05T10:00:00.000Z"),
        },
      ]);
      mockTraceSummaryFindFirst.mockResolvedValue({
        traceId,
        companyId,
        totalTokens: 150,
        promptTokens: 80,
        completionTokens: 70,
        durationMs: 1200,
        modelId: "gpt-4",
        promptVersion: "v1",
        toolsVersion: "v1",
        policyId: "default",
        bsScorePct: 10,
        evidenceCoveragePct: 85,
        invalidClaimsPct: 5,
        createdAt: new Date("2026-03-05T10:00:00.000Z"),
      });
      mockQualityAlertFindMany.mockResolvedValue([
        {
          id: "qa1",
          alertType: "BS_DRIFT",
          severity: "HIGH",
          message: "BS% вырос с 5 до 25.",
          createdAt: new Date("2026-03-05T09:30:00.000Z"),
        },
      ]);

      const result = await service.getTraceForensics(traceId, companyId);

      expect(result.traceId).toBe(traceId);
      expect(result.companyId).toBe(companyId);
      expect(result.summary).not.toBeNull();
      expect(result.summary?.bsScorePct).toBe(10);
      expect(result.timeline).toHaveLength(1);
      expect(result.timeline[0].evidenceRefs).toHaveLength(1);
      expect(result.timeline[0].evidenceRefs[0].claim).toContain("отклонениям");
      expect(result.qualityAlerts).toHaveLength(1);
      expect(result.qualityAlerts[0].alertType).toBe("BS_DRIFT");
    });

    it("returns 403 Forbidden for trace of another tenant", async () => {
      const traceId = "tr_other";
      mockAiAuditFindMany.mockResolvedValue([
        {
          id: "ae2",
          traceId,
          companyId: "other-company",
          toolNames: [],
          model: "deterministic",
          intentMethod: "regex",
          tokensUsed: 0,
          metadata: null,
          createdAt: new Date(),
        },
      ]);

      await expect(
        service.getTraceForensics(traceId, "c1"),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
