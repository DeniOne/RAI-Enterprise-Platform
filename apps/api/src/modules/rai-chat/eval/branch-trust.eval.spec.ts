import { ResponseComposerService } from "../composer/response-composer.service";
import { SemanticIngressService } from "../semantic-ingress.service";
import { SupervisorAgent } from "../supervisor-agent.service";
import { RaiToolName } from "../tools/rai-tools.types";

describe("Branch trust eval corpus", () => {
  const composerService = new ResponseComposerService(
    { build: jest.fn().mockReturnValue([]) } as any,
    { mask: (value: string) => value } as any,
  );

  it("corpus: conflict disclosure не маскируется гладким текстом", async () => {
    const response = await composerService.buildResponse({
      request: {
        message: "сверь агро и экономику",
        threadId: "th-eval-conflict",
        workspaceContext: { route: "/consulting/dashboard" },
      },
      executionResult: {
        executedTools: [],
        agentExecution: {
          role: "agronomist",
          status: "COMPLETED",
          executionPath: "tool_call_primary",
          text: "Сглаженный ответ, который нельзя показывать как истину.",
          structuredOutput: {
            summary: "Агро-ветка собрала первичный результат.",
          },
          branchResults: [
            {
              branch_id: "agro:primary",
              source_agent: "agronomist",
              domain: "agro",
              summary: "Агро-ветка утверждает одно значение.",
              scope: { domain: "agro" },
              derived_from: [],
              evidence_refs: [],
              assumptions: [],
              data_gaps: [],
              freshness: { status: "UNKNOWN" },
              confidence: 0.7,
            },
          ],
          branchTrustAssessments: [
            {
              branch_id: "agro:primary",
              source_agent: "agronomist",
              verdict: "CONFLICTED",
              score: 0.25,
              reasons: ["conflict_detected"],
              checks: [],
              requires_cross_check: true,
            },
          ],
          branchCompositions: [
            {
              branch_id: "agro:primary",
              verdict: "CONFLICTED",
              include_in_response: false,
              summary: "Агро-ветка утверждает одно значение.",
              disclosure: ["conflict_detected"],
            },
          ],
          toolCalls: [],
          connectorCalls: [],
          evidence: [],
          validation: { passed: true, reasons: [] },
          fallbackUsed: false,
          outputContractVersion: "v1",
          auditPayload: {
            runtimeMode: "agent-first-hybrid",
            autonomyMode: "advisory",
            allowedToolNames: [],
            blockedToolNames: [],
            connectorNames: [],
            outputContractId: "agronom-v1",
          },
        },
      } as any,
      recallResult: {
        recall: { items: [] },
        profile: {},
      } as any,
      externalSignalResult: { feedbackStored: false },
      traceId: "tr-eval-conflict",
      threadId: "th-eval-conflict",
      companyId: "company-1",
    });

    expect(response.text).toContain("Обнаружено расхождение между ветками");
    expect(response.text).toContain("Я не буду выдавать это как подтверждённый факт");
    expect(response.text).not.toContain(
      "Сглаженный ответ, который нельзя показывать как истину.",
    );
  });

  it("corpus: selective cross-check запускается только по trust signal", async () => {
    const agentRuntime = {
      executeAgent: jest
        .fn()
        .mockResolvedValueOnce({
          executedTools: [
            {
              name: RaiToolName.ComputeDeviations,
              result: { summary: "Первичный расчёт собран." },
            },
          ],
          agentExecution: {
            role: "agronomist",
            status: "COMPLETED",
            executionPath: "tool_call_primary",
            text: "Первичный агро-ответ.",
            structuredOutput: {
              summary: "Первичная ветка",
              confidence: 0.2,
            },
            toolCalls: [
              {
                name: RaiToolName.ComputeDeviations,
                result: { summary: "Первичный расчёт собран." },
              },
            ],
            connectorCalls: [],
            evidence: [],
            validation: { passed: true, reasons: [] },
            fallbackUsed: false,
            outputContractVersion: "v1",
            auditPayload: {
              runtimeMode: "agent-first-hybrid",
              autonomyMode: "advisory",
              allowedToolNames: [RaiToolName.ComputeDeviations],
              blockedToolNames: [],
              connectorNames: [],
              outputContractId: "agronom-v1",
            },
          },
        } as any)
        .mockResolvedValueOnce({
          executedTools: [
            {
              name: RaiToolName.QueryKnowledge,
              result: { summary: "Knowledge cross-check подтверждает ограниченно." },
            },
          ],
          agentExecution: {
            role: "knowledge",
            status: "COMPLETED",
            executionPath: "tool_call_primary",
            text: "Knowledge cross-check подтверждает ограниченно.",
            structuredOutput: {
              summary: "Knowledge cross-check",
              confidence: 0.9,
            },
            toolCalls: [
              {
                name: RaiToolName.QueryKnowledge,
                result: { summary: "Knowledge cross-check подтверждает ограниченно." },
              },
            ],
            connectorCalls: [],
            evidence: [
              {
                claim: "Найден вторичный источник",
                sourceType: "DOC",
                sourceId: "kb-1",
                confidenceScore: 0.9,
              },
            ],
            validation: { passed: true, reasons: [] },
            fallbackUsed: false,
            outputContractVersion: "v1",
            auditPayload: {
              runtimeMode: "agent-first-hybrid",
              autonomyMode: "advisory",
              allowedToolNames: [RaiToolName.QueryKnowledge],
              blockedToolNames: [],
              connectorNames: [],
              outputContractId: "knowledge-v1",
            },
          },
        } as any),
    };
    const responseComposer = {
      buildResponse: jest.fn().mockImplementation(async ({ executionResult }) => ({
        text: "ok",
        branchTrustAssessments:
          executionResult.agentExecution?.branchTrustAssessments,
        branchResults: executionResult.agentExecution?.branchResults,
        branchCompositions: executionResult.agentExecution?.branchCompositions,
        evidence: [],
      })),
    };
    const supervisor = new SupervisorAgent(
      {
        classify: jest.fn(),
        buildAutoToolCall: jest.fn(),
      } as any,
      {
        recallContext: jest.fn().mockResolvedValue({
          recall: { items: [] },
          profile: {},
          engrams: [],
          activeAlerts: [],
          hotEngrams: [],
        }),
        commitInteraction: jest.fn(),
      } as any,
      agentRuntime as any,
      responseComposer as any,
      {
        process: jest.fn().mockResolvedValue({ feedbackStored: false }),
      } as any,
      {
        writeAiAuditEntry: jest.fn().mockResolvedValue(null),
        appendForensicPhases: jest.fn().mockResolvedValue(undefined),
        buildMemoryLane: jest.fn().mockReturnValue({
          recalled: [],
          used: [],
          dropped: [],
        }),
      } as any,
      {
        evaluate: jest.fn().mockResolvedValue({
          promotedPrimary: false,
          classification: {
            targetRole: "agronomist",
            intent: "agro.deviations.review",
            toolName: RaiToolName.ComputeDeviations,
            confidence: 1,
            method: "tool_call_primary",
            reason: "explicit_tool_call",
          },
          requestedToolCalls: [
            {
              name: RaiToolName.ComputeDeviations,
              payload: { scope: { fieldId: "field-1" } },
            },
          ],
          versionInfo: {
            routerVersion: "eval-router",
            promptVersion: "eval-prompt",
            toolsetVersion: "eval-toolset",
            workspaceStateDigest: "eval-workspace",
          },
          semanticIntent: {
            domain: "agro",
            entity: "deviations",
            action: "review",
            interactionMode: "execute",
            mutationRisk: "low",
            filters: {},
            requiredContext: [],
            focusObject: null,
            dialogState: {
              activeFlow: null,
              pendingClarificationKeys: [],
              lastUserAction: null,
            },
            resolvability: "ready",
            ambiguityType: null,
            confidenceBand: "high",
            reason: "eval",
          },
          routeDecision: {
            decisionType: "execute",
            recommendedExecutionMode: "tool_call_primary",
            eligibleTools: [RaiToolName.ComputeDeviations],
            eligibleFlows: [],
            requiredContextMissing: [],
            policyChecksRequired: [],
            needsConfirmation: false,
            needsClarification: false,
            abstainReason: null,
            policyBlockReason: null,
          },
          candidateRoutes: [],
          divergence: null,
          executionPath: "tool_call_primary",
        }),
      } as any,
      new SemanticIngressService(),
      {
        getRolePolicy: jest.fn().mockReturnValue({
          trust: {
            maxTrackedBranches: 4,
            maxCrossCheckBranches: 1,
            latencyBudgetMs: {
              happyPathMs: 300,
              multiSourceReadMs: 800,
              crossCheckTriggeredMs: 1_500,
            },
          },
        }),
        resolveTrustLatencyBudgetMs: jest.fn().mockReturnValue(1_500),
      } as any,
      {
        record: jest.fn().mockResolvedValue(undefined),
        updateQuality: jest.fn().mockResolvedValue(undefined),
      } as any,
      {
        buildBranchTrustInputs: jest
          .fn()
          .mockReturnValueOnce({
            classifiedEvidence: [],
            accounting: {
              total: 1,
              evidenced: 0,
              verified: 0,
              unverified: 1,
              invalid: 0,
            },
            totalWeight: 0,
            weightedEvidence: {
              verified: 0,
              unverified: 1,
              invalid: 0,
            },
            bsScorePct: null,
            evidenceCoveragePct: null,
            invalidClaimsPct: null,
            qualityStatus: "PENDING_EVIDENCE",
            recommendedVerdict: "UNVERIFIED",
            requiresCrossCheck: true,
            reasons: ["missing_source"],
          })
          .mockReturnValueOnce({
            classifiedEvidence: [],
            accounting: {
              total: 1,
              evidenced: 1,
              verified: 1,
              unverified: 0,
              invalid: 0,
            },
            totalWeight: 1,
            weightedEvidence: {
              verified: 1,
              unverified: 0,
              invalid: 0,
            },
            bsScorePct: 0,
            evidenceCoveragePct: 100,
            invalidClaimsPct: 0,
            qualityStatus: "READY",
            recommendedVerdict: "VERIFIED",
            requiresCrossCheck: false,
            reasons: [],
          }),
        calculateTraceTruthfulness: jest.fn().mockResolvedValue({
          bsScorePct: 0,
          evidenceCoveragePct: 100,
          invalidClaimsPct: 0,
        }),
      } as any,
    );

    const response = await supervisor.orchestrate(
      {
        message: "Проверь отклонения и перепроверь источник",
        toolCalls: [
          {
            name: RaiToolName.ComputeDeviations,
            payload: { scope: { fieldId: "field-1" } },
          },
        ],
      },
      "company-1",
      "user-1",
    );

    expect(agentRuntime.executeAgent).toHaveBeenCalledTimes(2);
    expect(responseComposer.buildResponse).toHaveBeenCalledTimes(1);
    expect(response.branchTrustAssessments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ verdict: "UNVERIFIED" }),
        expect.objectContaining({ verdict: "VERIFIED" }),
      ]),
    );
  });

  it("corpus: agro execution fact -> finance cost aggregation собирает verified multi-source branches", async () => {
    const response = await composerService.buildResponse({
      request: {
        message: "Собери agro execution fact -> finance cost aggregation.",
        threadId: "th-eval-analytics",
        workspaceContext: { route: "/consulting/dashboard" },
      },
      executionResult: {
        executedTools: [],
        agentExecution: {
          role: "agronomist",
          status: "COMPLETED",
          executionPath: "tool_call_primary",
          text: "Составной аналитический сценарий выполнен по плану.",
          structuredOutput: {
            summary: "agro execution fact and finance cost aggregation",
          },
          branchResults: [
            {
              branch_id: "agro:fact",
              source_agent: "agronomist",
              domain: "agro",
              summary: "Агро execution fact подтвержден.",
              scope: { domain: "agro" },
              derived_from: [],
              evidence_refs: [],
              assumptions: [],
              data_gaps: [],
              freshness: { status: "FRESH" },
              confidence: 0.94,
            },
            {
              branch_id: "finance:aggregation",
              source_agent: "economist",
              domain: "finance",
              summary: "Финансовая стоимость агрегирована.",
              scope: { domain: "finance" },
              derived_from: [],
              evidence_refs: [],
              assumptions: [],
              data_gaps: [],
              freshness: { status: "FRESH" },
              confidence: 0.93,
            },
          ],
          branchTrustAssessments: [
            {
              branch_id: "agro:fact",
              source_agent: "agronomist",
              verdict: "VERIFIED",
              score: 0.94,
              reasons: [],
              checks: [],
              requires_cross_check: false,
            },
            {
              branch_id: "finance:aggregation",
              source_agent: "economist",
              verdict: "VERIFIED",
              score: 0.93,
              reasons: [],
              checks: [],
              requires_cross_check: false,
            },
          ],
          branchCompositions: [
            {
              branch_id: "agro:fact",
              verdict: "VERIFIED",
              include_in_response: true,
              summary: "Агро execution fact подтвержден.",
              disclosure: [],
            },
            {
              branch_id: "finance:aggregation",
              verdict: "VERIFIED",
              include_in_response: true,
              summary: "Финансовая стоимость агрегирована.",
              disclosure: [],
            },
          ],
          toolCalls: [],
          connectorCalls: [],
          evidence: [],
          validation: { passed: true, reasons: [] },
          fallbackUsed: false,
          outputContractVersion: "v1",
          auditPayload: {
            runtimeMode: "agent-first-hybrid",
            autonomyMode: "advisory",
            allowedToolNames: [],
            blockedToolNames: [],
            connectorNames: [],
            outputContractId: "agronom-v1",
          },
        },
      } as any,
      recallResult: {
        recall: { items: [] },
        profile: {},
      } as any,
      externalSignalResult: { feedbackStored: false },
      traceId: "tr-eval-analytics",
      threadId: "th-eval-analytics",
      companyId: "company-1",
    });

    expect(response.text).toContain("Подтверждённые факты:");
    expect(response.text).toContain("Агро execution fact подтвержден.");
    expect(response.text).toContain("Финансовая стоимость агрегирована.");
    expect(response.trustSummary).toEqual(
      expect.objectContaining({
        verdict: "VERIFIED",
        verifiedCount: 2,
        branchCount: 2,
      }),
    );
  });
});
