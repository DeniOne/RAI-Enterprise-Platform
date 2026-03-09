import { Test, TestingModule } from "@nestjs/testing";
import { ResponseComposerService } from "./response-composer.service";
import { RaiChatWidgetBuilder } from "../rai-chat-widget-builder";
import { SensitiveDataFilterService } from "../security/sensitive-data-filter.service";
import { RaiToolName } from "../tools/rai-tools.types";

describe("ResponseComposerService", () => {
  let service: ResponseComposerService;
  const widgetBuilderMock = { build: jest.fn().mockReturnValue([]) };
  const sensitiveDataFilterMock = { mask: jest.fn((s: string) => s) };

  beforeEach(async () => {
    jest.clearAllMocks();
    sensitiveDataFilterMock.mask.mockImplementation((s: string) => s);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResponseComposerService,
        { provide: RaiChatWidgetBuilder, useValue: widgetBuilderMock },
        { provide: SensitiveDataFilterService, useValue: sensitiveDataFilterMock },
      ],
    }).compile();
    service = module.get(ResponseComposerService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("buildSuggestedActions returns echo and workspace snapshot when route present", () => {
    const actions = service.buildSuggestedActions({
      message: "hi",
      workspaceContext: { route: "/dashboard" },
    });
    expect(actions.length).toBeGreaterThanOrEqual(1);
    expect(actions[0].toolName).toBe("echo_message");
  });

  it("не показывает ложный успех CRM, если действие заблокировано RiskPolicy", async () => {
    const response = await service.buildResponse({
      request: {
        message: "зарегистрируй контрагента по ИНН 2610000615",
        threadId: "th-1",
        workspaceContext: { route: "/consulting/crm" },
      },
      executionResult: {
        executedTools: [
          {
            name: RaiToolName.RegisterCounterparty,
            result: {
              riskPolicyBlocked: true,
              actionId: "pa-77",
              message: "Создан PendingAction #pa-77. Ожидается подтверждение человека.",
            },
          },
        ],
      },
      recallResult: {
        recall: { items: [] },
        profile: {},
      } as any,
      externalSignalResult: { feedbackStored: false },
      traceId: "tr-1",
      threadId: "th-1",
      companyId: "company-1",
    });

    expect(response.text).toContain("ожидает подтверждения");
    expect(response.text).not.toContain("undefined");
    expect(response.workWindows?.[0]?.title).toBe("Требуется подтверждение");
    expect(response.workWindows?.[0]?.payload).toEqual(
      expect.objectContaining({
        summary: expect.stringContaining("PendingAction"),
      }),
    );
  });

  it("не добавляет в пользовательский текст технические подписи маршрута и профиля", async () => {
    const response = await service.buildResponse({
      request: {
        message: "покажи статус",
        threadId: "th-2",
        workspaceContext: { route: "/consulting/dashboard" },
      },
      executionResult: {
        executedTools: [
          {
            name: RaiToolName.RegisterCounterparty,
            result: {
              partyId: "party-1",
              legalName: "ООО Ромашка",
              inn: "1234567890",
            },
          },
        ],
      } as any,
      recallResult: {
        recall: {
          items: [
            {
              content: "Пользователь недавно работал с карточкой клиента",
              similarity: 0.92,
              confidence: 0.88,
              metadata: { source: "episode" },
            },
          ],
        },
        profile: {
          lastRoute: "/consulting/dashboard",
          lastMessagePreview: "покажи статус",
          confidence: 0.8,
        },
      } as any,
      externalSignalResult: { feedbackStored: false },
      traceId: "tr-2",
      threadId: "th-2",
      companyId: "company-1",
    });

    expect(response.text).toContain("Принял: покажи статус");
    expect(response.text).toContain("Учтён предыдущий контекст");
    expect(response.text).not.toContain("route:");
    expect(response.text).not.toContain("Инструментов выполнено");
    expect(response.text).not.toContain("Профиль:");
    expect(response.memoryUsed).toEqual([
      expect.objectContaining({
        kind: "episode",
      }),
    ]);
  });

  it("строит rich output для contracts_agent без fallback backlog", async () => {
    const response = await service.buildResponse({
      request: {
        message: "заключим договор",
        threadId: "th-3",
        workspaceContext: { route: "/commerce/contracts" },
      },
      executionResult: {
        executedTools: [
          {
            name: RaiToolName.CreateCommerceContract,
            result: {
              id: "contract-1",
              number: "DOG-001",
              type: "SUPPLY",
              status: "DRAFT",
              validFrom: "2026-03-09T00:00:00.000Z",
              validTo: null,
              jurisdictionId: "jur-1",
              regulatoryProfileId: null,
              roles: [],
            },
          },
        ],
        agentExecution: {
          role: "contracts_agent",
          text: "Договор DOG-001 создан.",
          fallbackUsed: false,
          validation: { actionAllowed: true, explain: "" },
          outputContractVersion: "v1",
          toolCalls: [{ name: RaiToolName.CreateCommerceContract, result: {} }],
          confidence: 0.92,
          evidence: [],
          structuredOutput: {
            intent: "create_commerce_contract",
            data: {
              id: "contract-1",
              number: "DOG-001",
              type: "SUPPLY",
              status: "DRAFT",
              validFrom: "2026-03-09T00:00:00.000Z",
              validTo: null,
              jurisdictionId: "jur-1",
              regulatoryProfileId: null,
              roles: [],
            },
          },
          status: "COMPLETED",
        },
      } as any,
      recallResult: {
        recall: { items: [] },
        profile: {},
      } as any,
      externalSignalResult: { feedbackStored: false },
      traceId: "tr-3",
      threadId: "th-3",
      companyId: "company-1",
    });

    expect(response.workWindows?.[0]?.agentRole).toBe("contracts_agent");
    expect(response.workWindows?.[0]?.title).toContain("Договор");
    expect(response.workWindows?.[0]?.payload).toEqual(
      expect.objectContaining({
        summary: expect.stringContaining("DOG-001"),
      }),
    );
  });
});
