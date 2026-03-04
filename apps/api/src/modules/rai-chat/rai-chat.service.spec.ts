import { Test, TestingModule } from "@nestjs/testing";
import { RaiChatService } from "./rai-chat.service";
import { SupervisorAgent } from "./supervisor-agent.service";
import { RaiToolsRegistry } from "./tools/rai-tools.registry";
import { AgroToolsRegistry } from "./tools/agro-tools.registry";
import { FinanceToolsRegistry } from "./tools/finance-tools.registry";
import { RiskToolsRegistry } from "./tools/risk-tools.registry";
import { KnowledgeToolsRegistry } from "./tools/knowledge-tools.registry";
import { AgronomAgent } from "./agents/agronom-agent.service";
import { AgroDeterministicEngineFacade } from "./deterministic/agro-deterministic.facade";
import { IntentRouterService } from "./intent-router/intent-router.service";
import { RaiToolName } from "./tools/rai-tools.types";
import {
  RAI_CHAT_WIDGETS_SCHEMA_VERSION,
  RaiChatWidgetType,
} from "./widgets/rai-chat-widgets.types";
import { ExternalSignalsService } from "./external-signals.service";
import { RaiChatWidgetBuilder } from "./rai-chat-widget-builder";
import { TechMapService } from "../tech-map/tech-map.service";
import { DeviationService } from "../consulting/deviation.service";
import { KpiService } from "../consulting/kpi.service";
import { PrismaService } from "../../shared/prisma/prisma.service";

describe("RaiChatService", () => {
  let service: RaiChatService;
  const memoryAdapterMock = {
    store: jest.fn().mockResolvedValue(undefined),
    retrieve: jest.fn().mockResolvedValue({ items: [] }),
    appendInteraction: jest.fn().mockResolvedValue(undefined),
    getProfile: jest.fn().mockResolvedValue({}),
    updateProfile: jest.fn().mockResolvedValue(undefined),
  };
  const externalSignalsServiceMock = {
    process: jest
      .fn()
      .mockResolvedValue({ advisory: undefined, feedbackStored: false }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    delete process.env.RAI_CHAT_MEMORY_RECALL_TIMEOUT_MS;
    delete process.env.RAI_CHAT_MEMORY_TOP_K;
    delete process.env.RAI_CHAT_MEMORY_MIN_SIMILARITY;
    delete process.env.RAI_CHAT_MEMORY_APPEND_MAX_CHARS;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RaiChatService,
        SupervisorAgent,
        AgroToolsRegistry,
        FinanceToolsRegistry,
        RiskToolsRegistry,
        KnowledgeToolsRegistry,
        AgroDeterministicEngineFacade,
        AgronomAgent,
        IntentRouterService,
        RaiToolsRegistry,
        RaiChatWidgetBuilder,
        { provide: "MEMORY_ADAPTER", useValue: memoryAdapterMock },
        { provide: ExternalSignalsService, useValue: externalSignalsServiceMock },
        { provide: TechMapService, useValue: { createDraftStub: jest.fn() } },
        { provide: DeviationService, useValue: { getActiveDeviations: jest.fn().mockResolvedValue([]) } },
        { provide: KpiService, useValue: { calculatePlanKPI: jest.fn() } },
        { provide: PrismaService, useValue: { harvestPlan: { findFirst: jest.fn() }, agroEscalation: { findMany: jest.fn().mockResolvedValue([]) }, aiAuditEntry: { create: jest.fn().mockResolvedValue({}) } } },
      ],
    }).compile();

    service = module.get(RaiChatService);
    module.get(AgroToolsRegistry).onModuleInit();
    module.get(FinanceToolsRegistry).onModuleInit();
    module.get(RiskToolsRegistry).onModuleInit();
    module.get(KnowledgeToolsRegistry).onModuleInit();
    module.get(RaiToolsRegistry).onModuleInit();
  });

  it("returns typed suggested actions and canonical widgets", async () => {
    const result = await service.handleChat(
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
    );

    expect(result.suggestedActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          toolName: RaiToolName.EchoMessage,
        }),
        expect.objectContaining({
          toolName: RaiToolName.WorkspaceSnapshot,
        }),
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
    expect(result.widgets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          payload: expect.objectContaining({
            title: "Отклонения по маршруту registry / fields",
          }),
        }),
        expect.objectContaining({
          payload: expect.objectContaining({
            title: "Бэклог NY-1 для registry / fields",
          }),
        }),
      ]),
    );

    expect(result.toolCalls).toEqual([
      {
        name: RaiToolName.WorkspaceSnapshot,
        payload: {
          route: "/registry/fields",
          lastUserAction: "open-field",
          hasSelection: true,
        },
      },
    ]);
    expect(result.traceId).toEqual(expect.stringMatching(/^tr_/));
    expect(result.threadId).toEqual(expect.stringMatching(/^th_/));
    expect(result.openUiToken).toBeUndefined();
  });

  it("интегрируется с памятью: вызывает retrieve и store", async () => {
    memoryAdapterMock.retrieve.mockResolvedValue({
      items: [
        {
          id: "m1",
          content: "Вчера мы обсуждали урожай редьки",
          similarity: 0.88,
          outcome: "POSITIVE",
          confidence: 0.9,
          metadata: {},
        },
      ],
    });

    const result = await service.handleChat(
      {
        message: "Что мы обсуждали?",
        threadId: "thread-123",
      },
      "company-1",
    );

    // Проверяем вызов retrieve
    expect(memoryAdapterMock.retrieve).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "company-1",
      }),
      expect.any(Array),
      expect.any(Object),
    );

    // Проверяем вызов appendInteraction
    expect(memoryAdapterMock.appendInteraction).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "company-1",
        sessionId: "thread-123",
      }),
      expect.objectContaining({
        userMessage: "Что мы обсуждали?",
      }),
    );

    // Проверяем, что контекст попал в текст ответа
    expect(result.text).toContain(
      '(Контекст из памяти: "Вчера мы обсуждали урожай редьки...", sim: 0.88)',
    );
  });

  it("строго соблюдает изоляцию по companyId", async () => {
    const maliciousRequest = {
      message: "Дай чужие данные",
      // Допустим, злоумышленник пытается подменить компанию в метаданных (если бы мы их брали оттуда)
      metadata: { companyId: "other-company" },
    };

    await service.handleChat(maliciousRequest as any, "trusted-company-id");

    // Проверяем, что в память ушло правильное ID
    expect(memoryAdapterMock.appendInteraction).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "trusted-company-id",
      }),
      expect.any(Object),
    );

    // И в поиск тоже
    expect(memoryAdapterMock.retrieve).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "trusted-company-id",
      }),
      expect.any(Array),
      expect.any(Object),
    );
  });

  it("fail-open: таймаут retrieval не ломает чат", async () => {
    process.env.RAI_CHAT_MEMORY_RECALL_TIMEOUT_MS = "1";
    memoryAdapterMock.retrieve.mockImplementation(
      () => new Promise(() => { }),
    );

    const result = await service.handleChat(
      {
        message: "привет",
      },
      "company-1",
    );

    expect(result.text).toContain("Принял: привет");
    expect(result.text).not.toContain("Контекст из памяти:");
  });

  it("не пишет секреты в память (denylist)", async () => {
    await service.handleChat(
      {
        message: "my password=12345 please store",
      },
      "company-1",
    );

    expect(memoryAdapterMock.appendInteraction).not.toHaveBeenCalled();
  });

  it("прогоняет путь signal -> advisory -> feedback -> memory append", async () => {
    externalSignalsServiceMock.process.mockResolvedValue({
      advisory: {
        traceId: "trace-ext-1",
        recommendation: "REVIEW",
        confidence: 0.81,
        summary: "Нужна ручная проверка",
        explainability: {
          traceId: "trace-ext-1",
          why: "score=-0.4000; NDVI указывает на просадку; погода добавляет риск",
          factors: [{ name: "ndvi", value: 0.31, direction: "NEGATIVE" }],
          sources: [
            {
              kind: "ndvi",
              source: "sentinel2",
              observedAt: "2026-03-02T10:00:00.000Z",
              entityRef: "field-1",
              provenance: "sentinel-pass",
            },
          ],
        },
      },
      feedbackStored: true,
    });

    const result = await service.handleChat(
      {
        message: "Проверь внешние сигналы",
        threadId: "thread-ext-1",
        externalSignals: [
          {
            id: "sig-1",
            kind: "ndvi" as any,
            source: "sentinel2" as any,
            observedAt: "2026-03-02T10:00:00.000Z",
            entityRef: "field-1",
            value: 0.31,
            confidence: 0.82,
            provenance: "sentinel-pass",
          },
        ],
        advisoryFeedback: {
          decision: "accept",
          reason: "Подтверждаю ручную проверку",
        },
      },
      "company-1",
    );

    expect(externalSignalsServiceMock.process).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "company-1",
        threadId: "thread-ext-1",
      }),
    );
    expect(result.advisory).toEqual(
      expect.objectContaining({
        recommendation: "REVIEW",
      }),
    );
    expect(result.text).toContain("Advisory: REVIEW");
    expect(result.text).toContain("Feedback по advisory записан в память.");
  });

  it("динамически меняет виджеты при смене route и companyId", async () => {
    const executionResult = await service.handleChat(
      {
        message: "Проверь исполнение",
        workspaceContext: {
          route: "/consulting/execution/manager",
          lastUserAction: "open-manager",
          selectedRowSummary: {
            kind: "operation",
            id: "op-1",
            title: "Опрыскивание 12",
          },
        },
      },
      "company-AB12",
    );

    const dashboardResult = await service.handleChat(
      {
        message: "Покажи дашборд",
        workspaceContext: {
          route: "/consulting/dashboard",
        },
      },
      "company-ZX99",
    );

    expect(executionResult.widgets[0]).toEqual(
      expect.objectContaining({
        payload: expect.objectContaining({
          title: "Отклонения по маршруту consulting / execution / manager",
          items: expect.arrayContaining([
            expect.objectContaining({
              id: expect.stringContaining("AB12-manager"),
              severity: "high",
              fieldLabel: "Контекст: Опрыскивание 12",
            }),
          ]),
        }),
      }),
    );

    expect(dashboardResult.widgets[1]).toEqual(
      expect.objectContaining({
        payload: expect.objectContaining({
          title: "Бэклог ZX99 для consulting / dashboard",
          items: expect.arrayContaining([
            expect.objectContaining({
              id: expect.stringContaining("ZX99-dashboard"),
              ownerLabel: "Компания ZX99",
            }),
          ]),
        }),
      }),
    );
  });
});
