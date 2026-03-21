import { Test, TestingModule } from "@nestjs/testing";
import { ResponseComposerService } from "./response-composer.service";
import { RaiChatWidgetBuilder } from "../rai-chat-widget-builder";
import { SensitiveDataFilterService } from "../security/sensitive-data-filter.service";
import { RaiToolName } from "../tools/rai-tools.types";
import { InvariantMetrics } from "../../../shared/invariants/invariant-metrics";

describe("ResponseComposerService", () => {
  let service: ResponseComposerService;
  const widgetBuilderMock = { build: jest.fn().mockReturnValue([]) };
  const sensitiveDataFilterMock = { mask: jest.fn((s: string) => s) };

  beforeEach(async () => {
    jest.clearAllMocks();
    InvariantMetrics.resetForTests();
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
    const first = actions[0];
    if ("toolName" in first) {
      expect(first.toolName).toBe("echo_message");
      return;
    }
    expect(first.kind).toBe("route");
  });

  it("для read-only запроса по техкартам предлагает открыть реестр и не отдаёт общий fallback", async () => {
    const response = await service.buildResponse({
      request: {
        message: "покажи все созданные техкарты",
        threadId: "th-techmaps-ro",
        workspaceContext: { route: "/parties" },
      },
      executionResult: {
        executedTools: [],
      } as any,
      recallResult: {
        recall: { items: [] },
        profile: {},
      } as any,
      externalSignalResult: { feedbackStored: false },
      traceId: "tr-techmaps-ro",
      threadId: "th-techmaps-ro",
      companyId: "company-1",
    });

    expect(response.text).toContain("Понял запрос: показать список техкарт");
    expect(response.text).not.toContain("Я не совсем понял ваш запрос");
    expect(response.suggestedActions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "route",
          title: "Открыть реестр техкарт",
          href: "/consulting/techmaps/active",
        }),
      ]),
    );
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

    expect(response.text).toContain("Контрагент: ООО Ромашка, карточка party-1");
    expect(response.text).toContain("Учтён предыдущий контекст");
    expect(response.text).not.toContain("route:");
    expect(response.text).not.toContain("Инструментов выполнено");
    expect(response.text).not.toContain("Профиль:");
    expect(response.memoryUsed).toEqual([
      expect.objectContaining({
        kind: "episode",
      }),
      expect.objectContaining({
        kind: "profile",
      }),
    ]);
    expect(response.memorySummary).toEqual({
      primaryHint: "Учтён похожий кейс прошлого сезона",
      primaryKind: "episode",
      detailsAvailable: true,
    });
    expect(InvariantMetrics.snapshot().ai_memory_hint_shown_total).toBe(1);
  });

  it("собирает память из episode, engram, hot engram и active alert", async () => {
    const response = await service.buildResponse({
      request: {
        message: "что по рискам",
        threadId: "th-4",
        workspaceContext: { route: "/consulting/deviations" },
      },
      executionResult: {
        executedTools: [],
      } as any,
      recallResult: {
        recall: {
          items: [
            {
              content: "В прошлом сезоне похожий кейс закончился корректировкой плана",
              confidence: 0.87,
              metadata: { source: "episode" },
            },
          ],
        },
        profile: {
          lastRoute: "/consulting/deviations",
          confidence: 0.72,
        },
        engrams: [
          {
            id: "eng-1",
            category: "DEVIATION_OUTCOME",
            content: "Негативный паттерн по отклонениям",
            compositeScore: 0.91,
            similarity: 0.85,
          },
        ],
        hotEngrams: [
          {
            engramId: "hot-1",
            compositeScore: 0.94,
            category: "DEVIATION_OUTCOME",
            contentPreview: "Горячий кейс по отклонениям",
            activationCount: 3,
            promotedAt: "2026-03-11T00:00:00.000Z",
          },
        ],
        activeAlerts: [
          {
            id: "alert-1",
            severity: "HIGH",
            type: "deviation",
            message: "Критическое отклонение по полю",
            timestamp: "2026-03-11T00:00:00.000Z",
          },
        ],
      } as any,
      externalSignalResult: { feedbackStored: false },
      traceId: "tr-4",
      threadId: "th-4",
      companyId: "company-1",
    });

    expect(response.memoryUsed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "active_alert" }),
        expect.objectContaining({ kind: "hot_engram" }),
        expect.objectContaining({ kind: "engram" }),
        expect.objectContaining({ kind: "episode" }),
        expect.objectContaining({ kind: "profile" }),
      ]),
    );
    expect(response.memorySummary).toEqual({
      primaryHint: "Учтены активные отклонения и сигналы риска",
      primaryKind: "active_alert",
      detailsAvailable: true,
    });
    expect(InvariantMetrics.snapshot().ai_memory_hint_shown_total).toBe(1);
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
    expect(response.widgets).toEqual([]);
  });

  it("не подмешивает route-based widgets в обычный ответ агента", async () => {
    widgetBuilderMock.build.mockReturnValueOnce([
      {
        schemaVersion: "1.0",
        type: "DeviationList",
        version: 1,
        payload: {
          title: "Отклонения по маршруту consulting / execution",
          items: [],
        },
      },
    ]);

    const response = await service.buildResponse({
      request: {
        message: "открой карточку Сысои",
        threadId: "th-crm-1",
        workspaceContext: { route: "/consulting/techmaps/new" },
      },
      executionResult: {
        executedTools: [],
        agentExecution: {
          role: "crm_agent",
          text: "Открываю карточку контрагента ООО \"СЫСОИ\".",
          fallbackUsed: false,
          validation: { actionAllowed: true, explain: "" },
          outputContractVersion: "v1",
          toolCalls: [],
          confidence: 0.91,
          evidence: [],
          structuredOutput: null,
          status: "COMPLETED",
        },
      } as any,
      recallResult: {
        recall: { items: [] },
        profile: {},
      } as any,
      externalSignalResult: { feedbackStored: false },
      traceId: "tr-crm-1",
      threadId: "th-crm-1",
      companyId: "company-1",
    });

    expect(widgetBuilderMock.build).not.toHaveBeenCalled();
    expect(response.widgets).toEqual([]);
    expect(response.text).toContain("Открываю карточку");
  });

  it("не рисует route fallback widgets, когда инструмент завершился ошибкой", async () => {
    widgetBuilderMock.build.mockReturnValueOnce([
      {
        schemaVersion: "1.0",
        type: "DeviationList",
        version: 1,
        payload: {
          title: "Отклонения по маршруту consulting / dashboard",
          items: [],
        },
      },
    ]);

    const response = await service.buildResponse({
      request: {
        message: "открой карточку Сысои",
        threadId: "th-crm-err-1",
        workspaceContext: { route: "/consulting/dashboard" },
      },
      executionResult: {
        executedTools: [
              {
                name: RaiToolName.GetCrmAccountWorkspace,
                result: {
                  toolExecutionError: true,
                  code: "NotFoundException",
                  message: "ACCOUNT_AND_PARTY_NOT_FOUND:Сысои",
                },
              },
            ],
      } as any,
      recallResult: {
        recall: { items: [] },
        profile: {},
      } as any,
      externalSignalResult: { feedbackStored: false },
      traceId: "tr-crm-err-1",
      threadId: "th-crm-err-1",
      companyId: "company-1",
    });

    expect(response.widgets).toEqual([]);
    expect(response.text).toContain("не найден операционный аккаунт");
  });

  it("для review_account_workspace ведет в карточку контрагента, а не в общий CRM-дашборд", async () => {
    const response = await service.buildResponse({
      request: {
        message: "открой карточку Сысои",
        threadId: "th-crm-route-1",
        workspaceContext: { route: "/consulting/dashboard" },
      },
      executionResult: {
        executedTools: [
          {
            name: RaiToolName.GetCrmAccountWorkspace,
            result: {
              account: {
                id: "acc-1",
                name: 'ООО "СЫСОИ"',
              },
              linkedParty: {
                id: "party-1",
                legalName: 'ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "СЫСОИ"',
              },
              contacts: [],
              interactions: [],
              obligations: [],
              risks: [],
              documents: [],
              legalEntities: [],
            },
          },
        ],
      } as any,
      recallResult: {
        recall: { items: [] },
        profile: {},
      } as any,
      externalSignalResult: { feedbackStored: false },
      traceId: "tr-crm-route-1",
      threadId: "th-crm-route-1",
      companyId: "company-1",
    });

    const structuredWindow = response.workWindows?.find((window) => window.type === "structured_result");
    const structuredRouteAction = structuredWindow?.actions?.find((action) => action.kind === "open_route");
    expect(structuredRouteAction?.targetRoute).toBe("/parties/party-1");
    expect(structuredRouteAction?.label).toBe("Открыть карточку контрагента");

    const signalWindow = response.workWindows?.find((window) => window.type === "related_signals");
    const signalRouteAction = signalWindow?.actions?.find((action) => action.kind === "open_route");
    expect(signalRouteAction?.targetRoute).toBe("/parties/party-1");
    expect(signalRouteAction?.label).toBe("Открыть карточку контрагента");
  });

  it("для вопроса про директора отвечает прямо в чате и показывает директора в окне результата", async () => {
    const response = await service.buildResponse({
      request: {
        message: "Как зовут директора Сысои?",
        threadId: "th-crm-director-1",
        workspaceContext: { route: "/consulting/crm" },
      },
      executionResult: {
        executedTools: [
          {
            name: RaiToolName.GetCrmAccountWorkspace,
            result: {
              account: {
                id: "acc-1",
                name: 'ООО "СЫСОИ"',
                inn: "6217003600",
              },
              linkedParty: {
                id: "party-1",
                legalName: 'ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "СЫСОИ"',
                shortName: 'ООО "СЫСОИ"',
                inn: "6217003600",
                managerName: "Евдокушин Петр Михайлович",
              },
              contacts: [
                {
                  id: "contact-1",
                  firstName: "Евдокушин Петр Михайлович",
                  lastName: null,
                  role: "DECISION_MAKER",
                  email: "director@sysoi.ru",
                  phone: "+7 900 123-45-67",
                  source: "PARTY_SYNC:party-1:meta_manager",
                },
              ],
              interactions: [],
              obligations: [],
              risks: [],
              documents: [],
              legalEntities: [],
            },
          },
        ],
      } as any,
      recallResult: {
        recall: { items: [] },
        profile: {},
      } as any,
      externalSignalResult: { feedbackStored: false },
      traceId: "tr-crm-director-1",
      threadId: "th-crm-director-1",
      companyId: "company-1",
    });

    expect(response.text).toContain('Директор ООО "СЫСОИ" — Евдокушин Петр Михайлович.');
    expect(response.text).not.toContain("В CRM-контактах этот человек пока не заведен.");

    const structuredWindow = response.workWindows?.find((window) => window.type === "structured_result");
    expect(structuredWindow?.payload.summary).toContain("Евдокушин Петр Михайлович");
    expect(structuredWindow?.payload.sections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "crm_workspace_director_identity",
          items: expect.arrayContaining([
            expect.objectContaining({
              label: "ФИО",
              value: "Евдокушин Петр Михайлович",
            }),
          ]),
        }),
        expect.objectContaining({
          id: "crm_workspace_director_contacts",
          items: expect.arrayContaining([
            expect.objectContaining({
              label: "Телефон",
              value: "+7 900 123-45-67",
            }),
            expect.objectContaining({
              label: "Email",
              value: "director@sysoi.ru",
            }),
          ]),
        }),
      ]),
    );
    expect(structuredWindow?.payload.sections?.flatMap((section) => section.items)).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "ИНН",
        }),
      ]),
    );
  });

  it("добавляет синтез по structuredOutputs при multi-agent делегации", async () => {
    const response = await service.buildResponse({
      request: {
        message: "сверь агро и экономику",
        threadId: "th-synth",
        workspaceContext: { route: "/consulting/dashboard" },
      },
      executionResult: {
        executedTools: [],
        agentExecution: {
          role: "agronomist",
          status: "COMPLETED",
          executionPath: "tool_call_primary",
          text: "Первичный ответ агронома.",
          structuredOutput: {
            summary: "Агрономическая оценка собрана.",
          },
          structuredOutputs: [
            { summary: "Агрономическая оценка собрана." },
            { summary: "Экономический cross-check подтверждает расчёт." },
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
      traceId: "tr-synth",
      threadId: "th-synth",
      companyId: "company-1",
    });

    expect(response.text).toContain("Синтез делегированной цепочки:");
    expect(response.text).toContain("1. Агрономическая оценка собрана.");
    expect(response.text).toContain(
      "2. Экономический cross-check подтверждает расчёт.",
    );
  });

  it("строит conflict disclosure по branch verdict и не оставляет гладкий base text", async () => {
    const response = await service.buildResponse({
      request: {
        message: "сверь агро и экономику",
        threadId: "th-conflict",
        workspaceContext: { route: "/consulting/dashboard" },
      },
      executionResult: {
        executedTools: [],
        agentExecution: {
          role: "agronomist",
          status: "COMPLETED",
          executionPath: "tool_call_primary",
          text: "Гладкий ответ, который нельзя показывать как факт.",
          structuredOutput: {
            summary: "Агрономическая ветка",
          },
          branchResults: [
            {
              branch_id: "agro:primary",
              source_agent: "agronomist",
              domain: "agro",
              summary: "Агро-ветка утверждает один результат.",
              scope: { domain: "agro" },
              derived_from: [],
              evidence_refs: [],
              assumptions: [],
              data_gaps: [],
              freshness: { status: "UNKNOWN" },
              confidence: 0.8,
            },
          ],
          branchTrustAssessments: [
            {
              branch_id: "agro:primary",
              source_agent: "agronomist",
              verdict: "CONFLICTED",
              score: 0.2,
              reasons: ["conflict_detected", "mixed_evidence_quality"],
              checks: [],
              requires_cross_check: true,
            },
          ],
          branchCompositions: [
            {
              branch_id: "agro:primary",
              verdict: "CONFLICTED",
              include_in_response: false,
              summary: "Агро-ветка утверждает один результат.",
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
      traceId: "tr-conflict",
      threadId: "th-conflict",
      companyId: "company-1",
    });

    expect(response.text).toContain("Обнаружено расхождение между ветками");
    expect(response.text).toContain("Я не буду выдавать это как подтверждённый факт");
    expect(response.text).toContain("Агро-ветка утверждает один результат.");
    expect(response.text).not.toContain("Гладкий ответ, который нельзя показывать как факт.");
  });

  it("для PARTIAL всегда добавляет ограничения", async () => {
    const response = await service.buildResponse({
      request: {
        message: "собери частично подтверждённый ответ",
        threadId: "th-partial",
        workspaceContext: { route: "/consulting/dashboard" },
      },
      executionResult: {
        executedTools: [],
        agentExecution: {
          role: "economist",
          status: "COMPLETED",
          executionPath: "tool_call_primary",
          text: "Первичный ответ экономиста.",
          structuredOutput: {
            summary: "Экономическая ветка.",
          },
          branchResults: [
            {
              branch_id: "finance:primary",
              source_agent: "economist",
              domain: "finance",
              summary: "Стоимость подтверждена частично.",
              scope: { domain: "finance" },
              derived_from: [],
              evidence_refs: [],
              assumptions: [],
              data_gaps: ["нет части первичных документов"],
              freshness: { status: "UNKNOWN" },
              confidence: 0.6,
            },
          ],
          branchTrustAssessments: [
            {
              branch_id: "finance:primary",
              source_agent: "economist",
              verdict: "PARTIAL",
              score: 0.55,
              reasons: ["partial_evidence_coverage"],
              checks: [],
              requires_cross_check: false,
            },
          ],
          branchCompositions: [
            {
              branch_id: "finance:primary",
              verdict: "PARTIAL",
              include_in_response: true,
              summary: "Стоимость подтверждена частично.",
              disclosure: ["нет части первичных документов"],
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
            outputContractId: "economist-v1",
          },
        },
      } as any,
      recallResult: {
        recall: { items: [] },
        profile: {},
      } as any,
      externalSignalResult: { feedbackStored: false },
      traceId: "tr-partial",
      threadId: "th-partial",
      companyId: "company-1",
    });

    expect(response.text).toContain("Частично подтверждено:");
    expect(response.text).toContain("Стоимость подтверждена частично.");
    expect(response.text).toContain("Ограничения:");
    expect(response.text).toContain("нет части первичных документов");
  });

  it("собирает подтверждённый факт только из разрешённых веток", async () => {
    const response = await service.buildResponse({
      request: {
        message: "собери подтверждённый факт",
        threadId: "th-verified-only",
        workspaceContext: { route: "/consulting/dashboard" },
      },
      executionResult: {
        executedTools: [],
        agentExecution: {
          role: "agronomist",
          status: "COMPLETED",
          executionPath: "tool_call_primary",
          text: "Базовый текст.",
          structuredOutput: {
            summary: "Базовый текст.",
          },
          branchResults: [
            {
              branch_id: "agro:primary",
              source_agent: "agronomist",
              domain: "agro",
              summary: "Подтверждён факт внесения 120 кг/га.",
              scope: { domain: "agro" },
              derived_from: [],
              evidence_refs: [],
              assumptions: [],
              data_gaps: [],
              freshness: { status: "UNKNOWN" },
              confidence: 0.9,
            },
            {
              branch_id: "finance:advisory",
              source_agent: "economist",
              domain: "finance",
              summary: "Неподтверждённая стоимость 999999 руб.",
              scope: { domain: "finance" },
              derived_from: [],
              evidence_refs: [],
              assumptions: [],
              data_gaps: [],
              freshness: { status: "UNKNOWN" },
              confidence: 0.2,
            },
          ],
          branchTrustAssessments: [
            {
              branch_id: "agro:primary",
              source_agent: "agronomist",
              verdict: "VERIFIED",
              score: 0.95,
              reasons: [],
              checks: [],
              requires_cross_check: false,
            },
            {
              branch_id: "finance:advisory",
              source_agent: "economist",
              verdict: "UNVERIFIED",
              score: 0.2,
              reasons: ["no_evidence_refs"],
              checks: [],
              requires_cross_check: true,
            },
          ],
          branchCompositions: [
            {
              branch_id: "agro:primary",
              verdict: "VERIFIED",
              include_in_response: true,
              summary: "Подтверждён факт внесения 120 кг/га.",
              disclosure: [],
            },
            {
              branch_id: "finance:advisory",
              verdict: "UNVERIFIED",
              include_in_response: false,
              summary: "Неподтверждённая стоимость 999999 руб.",
              disclosure: ["no_evidence_refs"],
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
      traceId: "tr-verified-only",
      threadId: "th-verified-only",
      companyId: "company-1",
    });

    expect(response.text).toContain("Подтверждённый факт:");
    expect(response.text).toContain("Подтверждён факт внесения 120 кг/га.");
    expect(response.text).toContain("Часть веток не включена в подтверждённые факты: UNVERIFIED.");
    expect(response.text).not.toContain("Неподтверждённая стоимость 999999 руб.");
    expect(response.branchTrustAssessments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          branch_id: "agro:primary",
          verdict: "VERIFIED",
        }),
      ]),
    );
    expect(response.trustSummary).toEqual(
      expect.objectContaining({
        verdict: "PARTIAL",
        label: "Частично подтверждено",
        branchCount: 2,
        verifiedCount: 1,
        unverifiedCount: 1,
        crossCheckCount: 1,
      }),
    );
    const trustWindow = response.workWindows?.find(
      (window) =>
        window.type === "structured_result" &&
        window.payload.intentId === "branch_trust_summary",
    );
    const trustSignalsWindow = response.workWindows?.find(
      (window) =>
        window.type === "related_signals" &&
        window.payload.intentId === "branch_trust_summary",
    );
    expect(trustWindow).toEqual(
      expect.objectContaining({
        title: "Статус подтверждения ответа",
        payload: expect.objectContaining({
          summary: expect.stringContaining("Подтверждённые ветки есть"),
        }),
      }),
    );
    expect(trustSignalsWindow?.payload.signalItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: expect.stringContaining("economist"),
        }),
      ]),
    );
    expect(response.activeWindowId).toBe(trustWindow?.windowId);
  });
});
