import { Test, TestingModule } from "@nestjs/testing";
import { RaiChatService } from "./rai-chat.service";
import { RaiToolsRegistry } from "./tools/rai-tools.registry";
import { MemoryManager } from "../../shared/memory/memory-manager.service";
import { EpisodicRetrievalService } from "../../shared/memory/episodic-retrieval.service";
import { RaiToolName } from "./tools/rai-tools.types";
import {
  RAI_CHAT_WIDGETS_SCHEMA_VERSION,
  RaiChatWidgetType,
} from "./widgets/rai-chat-widgets.types";
import { RaiChatMemoryPolicy } from "../../shared/memory/rai-chat-memory.policy";
import { ExternalSignalsService } from "./external-signals.service";

describe("RaiChatService", () => {
  let service: RaiChatService;
  const memoryManagerMock = {
    store: jest.fn().mockResolvedValue(undefined),
  };
  const episodicRetrievalMock = {
    retrieve: jest.fn().mockResolvedValue({ items: [] }),
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
        RaiToolsRegistry,
        { provide: MemoryManager, useValue: memoryManagerMock },
        { provide: EpisodicRetrievalService, useValue: episodicRetrievalMock },
        { provide: ExternalSignalsService, useValue: externalSignalsServiceMock },
      ],
    }).compile();

    service = module.get(RaiChatService);
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
    episodicRetrievalMock.retrieve.mockResolvedValue({
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
    expect(episodicRetrievalMock.retrieve).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "company-1",
      }),
    );

    // Проверяем вызов store
    expect(memoryManagerMock.store).toHaveBeenCalledWith(
      "Что мы обсуждали?",
      expect.any(Array),
      expect.objectContaining({
        companyId: "company-1",
        source: "rai-chat",
        sessionId: "thread-123",
      }),
      RaiChatMemoryPolicy,
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
    expect(memoryManagerMock.store).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      expect.objectContaining({
        companyId: "trusted-company-id",
      }),
      RaiChatMemoryPolicy,
    );

    // И в поиск тоже
    expect(episodicRetrievalMock.retrieve).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "trusted-company-id",
      }),
    );
  });

  it("fail-open: таймаут retrieval не ломает чат", async () => {
    process.env.RAI_CHAT_MEMORY_RECALL_TIMEOUT_MS = "1";
    episodicRetrievalMock.retrieve.mockImplementation(
      () => new Promise(() => {}),
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

    expect(memoryManagerMock.store).not.toHaveBeenCalled();
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
});
