import { Test, TestingModule } from "@nestjs/testing";
import { SupervisorAgent } from "./supervisor-agent.service";
import { RaiToolsRegistry } from "./tools/rai-tools.registry";
import { AgroToolsRegistry } from "./tools/agro-tools.registry";
import { FinanceToolsRegistry } from "./tools/finance-tools.registry";
import { RiskToolsRegistry } from "./tools/risk-tools.registry";
import { KnowledgeToolsRegistry } from "./tools/knowledge-tools.registry";
import { AgronomAgent } from "./agents/agronom-agent.service";
import { EconomistAgent } from "./agents/economist-agent.service";
import { KnowledgeAgent } from "./agents/knowledge-agent.service";
import { AgroDeterministicEngineFacade } from "./deterministic/agro-deterministic.facade";
import { IntentRouterService } from "./intent-router/intent-router.service";
import { ExternalSignalsService } from "./external-signals.service";
import { RaiChatWidgetBuilder } from "./rai-chat-widget-builder";
import { RiskPolicyEngineService } from "./security/risk-policy-engine.service";
import { PendingActionService } from "./security/pending-action.service";
import { MemoryCoordinatorService } from "./memory/memory-coordinator.service";
import { AgentRuntimeService } from "./runtime/agent-runtime.service";
import { ResponseComposerService } from "./composer/response-composer.service";
import { SensitiveDataFilterService } from "./security/sensitive-data-filter.service";
import { RaiToolName } from "./tools/rai-tools.types";
import { TechMapService } from "../tech-map/tech-map.service";
import { DeviationService } from "../consulting/deviation.service";
import { KpiService } from "../consulting/kpi.service";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { TraceSummaryService } from "./trace-summary.service";
import { AutonomyPolicyService } from "./autonomy-policy.service";
import { WorkspaceEntityKind } from "./dto/rai-chat.dto";
import {
  RAI_CHAT_WIDGETS_SCHEMA_VERSION,
  RaiChatWidgetType,
} from "./widgets/rai-chat-widgets.types";

describe("SupervisorAgent", () => {
  let agent: SupervisorAgent;
  const memoryAdapterMock = {
    retrieve: jest.fn().mockResolvedValue({
      traceId: undefined,
      total: 0,
      positive: 0,
      negative: 0,
      unknown: 0,
      items: [],
    }),
    appendInteraction: jest.fn().mockResolvedValue(undefined),
    getProfile: jest.fn().mockResolvedValue({}),
    updateProfile: jest.fn().mockResolvedValue(undefined),
  };
  const externalSignalsServiceMock = {
    process: jest
      .fn()
      .mockResolvedValue({ advisory: undefined, feedbackStored: false }),
  };
  const techMapServiceMock = {
    createDraftStub: jest.fn(),
  };
  const deviationServiceMock = {
    getActiveDeviations: jest.fn().mockResolvedValue([]),
  };
  const kpiServiceMock = {
    calculatePlanKPI: jest.fn(),
  };
  const prismaServiceMock = {
    harvestPlan: { findFirst: jest.fn() },
    agroEscalation: { findMany: jest.fn().mockResolvedValue([]) },
    aiAuditEntry: { create: jest.fn().mockResolvedValue({}) },
    pendingAction: { create: jest.fn().mockResolvedValue({ id: "pa-1" }) },
  };
  const intentRouterMock = {
    classify: jest.fn().mockReturnValue({
      toolName: null,
      confidence: 0,
      method: "regex" as const,
      reason: "no_match",
    }),
    buildAutoToolCall: jest.fn().mockReturnValue(null),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    intentRouterMock.buildAutoToolCall.mockReturnValue(null);
    intentRouterMock.classify.mockReturnValue({
      toolName: null,
      confidence: 0,
      method: "regex",
      reason: "no_match",
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupervisorAgent,
        MemoryCoordinatorService,
        AgentRuntimeService,
        ResponseComposerService,
        AgroToolsRegistry,
        FinanceToolsRegistry,
        RiskToolsRegistry,
        KnowledgeToolsRegistry,
        AgroDeterministicEngineFacade,
        AgronomAgent,
        EconomistAgent,
        KnowledgeAgent,
        RaiToolsRegistry,
        RiskPolicyEngineService,
        PendingActionService,
        RaiChatWidgetBuilder,
        { provide: IntentRouterService, useValue: intentRouterMock },
        { provide: "MEMORY_ADAPTER", useValue: memoryAdapterMock },
        { provide: ExternalSignalsService, useValue: externalSignalsServiceMock },
        { provide: TechMapService, useValue: techMapServiceMock },
        { provide: DeviationService, useValue: deviationServiceMock },
        { provide: KpiService, useValue: kpiServiceMock },
        { provide: PrismaService, useValue: prismaServiceMock },
        { provide: SensitiveDataFilterService, useValue: { mask: (s: string) => s } },
        { provide: TraceSummaryService, useValue: { record: jest.fn().mockResolvedValue(undefined) } },
        { provide: AutonomyPolicyService, useValue: { getCompanyAutonomyLevel: jest.fn().mockResolvedValue("AUTONOMOUS") } },
      ],
    }).compile();

    agent = module.get(SupervisorAgent);
    module.get(AgroToolsRegistry).onModuleInit();
    module.get(FinanceToolsRegistry).onModuleInit();
    module.get(RiskToolsRegistry).onModuleInit();
    module.get(KnowledgeToolsRegistry).onModuleInit();
    module.get(RaiToolsRegistry).onModuleInit();
  });

  it("orchestrates response contract through the supervisor layer", async () => {
    memoryAdapterMock.getProfile.mockResolvedValueOnce({
      lastRoute: "/registry/fields",
      lastMessagePreview: "Покажи контекст",
      confidence: 0.82,
      provenance: "profile",
    });

    const result = await agent.orchestrate(
      {
        message: "Покажи контекст",
        workspaceContext: {
          route: "/registry/fields",
          lastUserAction: "open-field",
        },
        toolCalls: [
          {
            name: RaiToolName.WorkspaceSnapshot,
            payload: {
              route: "/registry/fields",
              lastUserAction: "open-field",
            },
          },
        ],
      },
      "company-1",
      "user-1",
    );

    expect(result.suggestedActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ toolName: RaiToolName.EchoMessage }),
        expect.objectContaining({ toolName: RaiToolName.WorkspaceSnapshot }),
      ]),
    );
    expect(result.widgets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          schemaVersion: RAI_CHAT_WIDGETS_SCHEMA_VERSION,
          type: RaiChatWidgetType.DeviationList,
        }),
        expect.objectContaining({
          schemaVersion: RAI_CHAT_WIDGETS_SCHEMA_VERSION,
          type: RaiChatWidgetType.TaskBacklog,
        }),
      ]),
    );
    expect(result.traceId).toEqual(expect.stringMatching(/^tr_/));
    expect(result.threadId).toEqual(expect.stringMatching(/^th_/));
    expect(result.memoryUsed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "profile",
          confidence: 0.82,
        }),
      ]),
    );
    expect(memoryAdapterMock.getProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "company-1",
        userId: "user-1",
      }),
    );
    expect(memoryAdapterMock.appendInteraction).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "company-1",
        userId: "user-1",
      }),
      expect.objectContaining({
        userMessage: "Покажи контекст",
      }),
    );
    expect(memoryAdapterMock.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "company-1",
        userId: "user-1",
      }),
      expect.objectContaining({
        lastRoute: "/registry/fields",
      }),
    );
  });

  it("includes profile summary in response when profile exists", async () => {
    memoryAdapterMock.getProfile.mockResolvedValueOnce({
      lastRoute: "/consulting/dashboard",
      lastMessagePreview: "Покажи KPI",
    });

    const result = await agent.orchestrate(
      {
        message: "Что дальше?",
      },
      "company-2",
      "user-2",
    );

    expect(result.text).toContain(
      "(Профиль: lastRoute=/consulting/dashboard; lastMessage=Покажи KPI)",
    );
    expect(result.memoryUsed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "profile",
          label: "lastRoute=/consulting/dashboard; lastMessage=Покажи KPI",
        }),
      ]),
    );
  });

  it("auto-runs deviation tool when intent is detected from the message", async () => {
    intentRouterMock.classify.mockReturnValueOnce({
      toolName: RaiToolName.ComputeDeviations,
      confidence: 0.7,
      method: "regex",
      reason: "match",
    });
    intentRouterMock.buildAutoToolCall.mockReturnValueOnce({
      name: RaiToolName.ComputeDeviations,
      payload: {
        scope: { seasonId: "season-1", fieldId: "field-1" },
      },
    });
    deviationServiceMock.getActiveDeviations.mockResolvedValueOnce([
      {
        id: "dev-1",
        status: "OPEN",
        harvestPlanId: "plan-1",
        budgetPlanId: "budget-1",
        harvestPlan: {
          seasonId: "season-1",
          techMaps: [{ fieldId: "field-1" }],
        },
      },
    ]);

    const result = await agent.orchestrate(
      {
        message: "покажи отклонения по полю",
        workspaceContext: {
          route: "/consulting/fields",
          activeEntityRefs: [
            { kind: WorkspaceEntityKind.field, id: "field-1" },
          ],
          filters: { seasonId: "season-1" },
        },
      },
      "company-1",
      "user-1",
    );

    expect(result.toolCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: RaiToolName.ComputeDeviations,
          payload: expect.objectContaining({
            count: 1,
            seasonId: "season-1",
            fieldId: "field-1",
          }),
        }),
      ]),
    );
    expect(result.text).toContain("Отклонений найдено: 1");
  });

  it("auto-runs plan fact tool when KPI intent is detected", async () => {
    intentRouterMock.classify.mockReturnValueOnce({
      toolName: RaiToolName.ComputePlanFact,
      confidence: 0.7,
      method: "regex",
      reason: "match",
    });
    intentRouterMock.buildAutoToolCall.mockReturnValueOnce({
      name: RaiToolName.ComputePlanFact,
      payload: { scope: { seasonId: "season-9" } },
    });
    prismaServiceMock.harvestPlan.findFirst
      .mockResolvedValueOnce({
        id: "plan-9",
        status: "ACTIVE",
        seasonId: "season-9",
        companyId: "company-1",
      })
      .mockResolvedValueOnce({
        id: "plan-9",
        status: "ACTIVE",
        seasonId: "season-9",
        companyId: "company-1",
      });
    kpiServiceMock.calculatePlanKPI.mockResolvedValueOnce({
      hasData: true,
      roi: 16.5,
      ebitda: 2200,
      revenue: 4100,
      totalActualCost: 1800,
      totalPlannedCost: 1900,
    });

    const result = await agent.orchestrate(
      {
        message: "kpi план факт по сезону",
        workspaceContext: {
          route: "/consulting",
          filters: { seasonId: "season-9" },
        },
      },
      "company-1",
      "user-1",
    );

    expect(result.toolCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: RaiToolName.ComputePlanFact,
          payload: expect.objectContaining({
            planId: "plan-9",
            seasonId: "season-9",
            roi: 16.5,
          }),
        }),
      ]),
    );
    expect(result.text).toContain("План-факт по плану plan-9");
  });

  it("auto-runs alerts tool when alert intent is detected — RiskPolicy blocks WRITE, returns PendingAction", async () => {
    intentRouterMock.classify.mockReturnValueOnce({
      toolName: RaiToolName.EmitAlerts,
      confidence: 0.7,
      method: "regex",
      reason: "match",
    });
    intentRouterMock.buildAutoToolCall.mockReturnValueOnce({
      name: RaiToolName.EmitAlerts,
      payload: { severity: "S3" },
    });

    const result = await agent.orchestrate(
      {
        message: "есть ли алерт эскалация",
        workspaceContext: {
          route: "/consulting",
        },
      },
      "company-1",
      "user-1",
    );

    expect(result.toolCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: RaiToolName.EmitAlerts,
          payload: expect.objectContaining({
            riskPolicyBlocked: true,
            actionId: "pa-1",
          }),
        }),
      ]),
    );
    expect(prismaServiceMock.agroEscalation.findMany).not.toHaveBeenCalled();
  });

  it("auto-runs tech map draft — RiskPolicy blocks WRITE, creates PendingAction", async () => {
    intentRouterMock.classify.mockReturnValueOnce({
      toolName: RaiToolName.GenerateTechMapDraft,
      confidence: 0.7,
      method: "regex",
      reason: "match",
    });
    intentRouterMock.buildAutoToolCall.mockReturnValueOnce({
      name: RaiToolName.GenerateTechMapDraft,
      payload: {
        fieldRef: "field-42",
        seasonRef: "season-42",
        crop: "rapeseed",
      },
    });

    const result = await agent.orchestrate(
      {
        message: "сделай техкарту рапс",
        workspaceContext: {
          route: "/consulting/techmaps",
          activeEntityRefs: [
            { kind: WorkspaceEntityKind.field, id: "field-42" },
          ],
          filters: { seasonId: "season-42" },
        },
      },
      "company-1",
      "user-1",
    );

    expect(techMapServiceMock.createDraftStub).not.toHaveBeenCalled();
    expect(result.toolCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: RaiToolName.GenerateTechMapDraft,
          payload: expect.objectContaining({
            riskPolicyBlocked: true,
            actionId: "pa-1",
          }),
        }),
      ]),
    );
  });
});
