import { Test, TestingModule } from "@nestjs/testing";
import { ResponseComposerService } from "./response-composer.service";
import { RaiChatWidgetBuilder } from "../rai-chat-widget-builder";
import { SensitiveDataFilterService } from "../security/sensitive-data-filter.service";
import type { SemanticIngressFrame } from "../../../shared/rai-chat/semantic-ingress.types";
import { DecisionType } from "../../../shared/rai-chat/semantic-routing.types";
import { ConfidenceBand } from "../../../shared/rai-chat/semantic-routing.types";

describe("execution surface → workWindows", () => {
  let service: ResponseComposerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResponseComposerService,
        { provide: RaiChatWidgetBuilder, useValue: { build: jest.fn().mockReturnValue([]) } },
        { provide: SensitiveDataFilterService, useValue: { mask: (s: string) => s } },
      ],
    }).compile();
    service = module.get(ResponseComposerService);
  });

  it("прокидывает executionSurface в ответ и в окно с русским заголовком", async () => {
    const semanticIngressFrame: SemanticIngressFrame = {
      version: "v1",
      interactionMode: "free_chat",
      requestShape: "single_intent",
      domainCandidates: [],
      goal: null,
      entities: [],
      requestedOperation: {
        ownerRole: "agronomist",
        intent: "x",
        toolName: null,
        decisionType: DecisionType.Execute,
        source: "fallback_normalization",
      },
      operationAuthority: "delegated_or_autonomous",
      missingSlots: [],
      riskClass: "safe_read",
      requiresConfirmation: false,
      confidenceBand: ConfidenceBand.Medium,
      explanation: "",
      writePolicy: { decision: "execute", reason: "" },
      executionSurface: {
        version: "v1",
        branches: [
          { branchId: "b1", lifecycle: "RUNNING", mutationState: "NOT_REQUIRED" },
        ],
      },
    };

    const res = await service.buildResponse({
      request: { message: "тест", workspaceContext: { route: "/x" } } as any,
      executionResult: {
        executedTools: [],
        agentExecution: {
          role: "agronomist",
          text: "ok",
          status: "COMPLETED",
          evidence: [],
          toolCalls: [],
        },
      } as any,
      recallResult: { recall: { items: [] }, profile: {} } as any,
      externalSignalResult: { feedbackStored: false },
      traceId: "tr-w",
      threadId: "th-w",
      companyId: "c1",
      semanticIngressFrame,
    });

    expect(res.executionSurface?.branches[0].lifecycle).toBe("RUNNING");
    expect(res.executionExplainability?.version).toBe("v1");
    expect(res.executionExplainability?.branches[0]).toEqual(
      expect.objectContaining({
        branchId: "b1",
        lifecycle: "RUNNING",
        mutationState: "NOT_REQUIRED",
        policyDecision: "execute",
      }),
    );
    const win = res.workWindows?.find((w) => w.windowId.startsWith("exec_surface_"));
    expect(win?.title).toBe("Состояние веток исполнения");
    expect(win?.payload.sections?.[0].items.some((i) => i.value === "RUNNING")).toBe(
      true,
    );
  });

  it("executionExplainability: branch_concurrency_cap и concurrencyDeferral при plannerAdvanceMeta", async () => {
    const semanticIngressFrame: SemanticIngressFrame = {
      version: "v1",
      interactionMode: "free_chat",
      requestShape: "composite",
      domainCandidates: [],
      goal: null,
      entities: [],
      requestedOperation: {
        ownerRole: "agronomist",
        intent: "x",
        toolName: null,
        decisionType: DecisionType.Execute,
        source: "fallback_normalization",
      },
      operationAuthority: "delegated_or_autonomous",
      missingSlots: [],
      riskClass: "safe_read",
      requiresConfirmation: false,
      confidenceBand: ConfidenceBand.Medium,
      explanation: "",
      writePolicy: { decision: "execute", reason: "" },
      executionSurface: {
        version: "v1",
        plannerAdvanceMeta: {
          concurrencyCap: 2,
          deferredRunnableBranchIds: ["b2"],
        },
        branches: [
          { branchId: "b0", lifecycle: "RUNNING", mutationState: "NOT_REQUIRED" },
          { branchId: "b1", lifecycle: "RUNNING", mutationState: "NOT_REQUIRED" },
          { branchId: "b2", lifecycle: "PLANNED", mutationState: "NOT_REQUIRED" },
        ],
      },
    };

    const res = await service.buildResponse({
      request: { message: "тест", workspaceContext: { route: "/x" } } as any,
      executionResult: {
        executedTools: [],
        agentExecution: {
          role: "agronomist",
          text: "ok",
          status: "COMPLETED",
          evidence: [],
          toolCalls: [],
        },
      } as any,
      recallResult: { recall: { items: [] }, profile: {} } as any,
      externalSignalResult: { feedbackStored: false },
      traceId: "tr-cap",
      threadId: "th-cap",
      companyId: "c1",
      semanticIngressFrame,
    });

    expect(res.executionExplainability?.concurrencyDeferral).toEqual({
      cap: 2,
      deferredBranchIds: ["b2"],
    });
    const b2 = res.executionExplainability?.branches.find((b) => b.branchId === "b2");
    expect(b2?.policyDecision).toBe("branch_concurrency_cap");
    const b0 = res.executionExplainability?.branches.find((b) => b.branchId === "b0");
    expect(b0?.policyDecision).toBe("execute");
  });
});
