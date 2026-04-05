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

  it("строит текст из structuredOutput, даже если agentExecution.text отсутствует", async () => {
    const response = await service.buildResponse({
      request: {
        message: "дай итог",
        threadId: "th-structured-only",
        workspaceContext: { route: "/consulting/dashboard" },
      },
      executionResult: {
        executedTools: [],
        agentExecution: {
          role: "agronomist",
          status: "COMPLETED",
          structuredOutput: {
            summary: "Итог собран из structured payload.",
            confidence: 0.9,
          },
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
      traceId: "tr-structured-only",
      threadId: "th-structured-only",
      companyId: "company-1",
    });

    expect(response.text).toContain("Итог собран из structured payload.");
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

  it("показывает clarify audit trail в summary техкарты", async () => {
    const response = await service.buildResponse({
      request: {
        message: "собери черновик техкарты",
        threadId: "th-techmaps-audit",
        workspaceContext: { route: "/consulting/techmaps" },
      },
      executionResult: {
        executedTools: [
          {
            name: RaiToolName.GenerateTechMapDraft,
            result: {
              draftId: "draft-1",
              readiness: "S1_SCOPED",
              workflowVerdict: "PARTIAL",
              clarifyBatch: {
                mode: "MULTI_STEP",
                status: "OPEN",
                resume_token: "resume:tech-map:draft-1:clarify:draft-1:soil_profile",
              },
              workflowResumeState: {
                resume_from_phase: "MISSING_CONTEXT_TRIAGE",
                external_recheck_required: false,
              },
              clarifyAuditTrail: [
                { event_type: "clarify_batch_opened" },
                { event_type: "workflow_resume_requested" },
                { event_type: "workflow_resume_ready" },
              ],
            },
          },
        ],
      } as any,
      recallResult: {
        recall: { items: [] },
        profile: {},
      } as any,
      externalSignalResult: { feedbackStored: false },
      traceId: "tr-techmaps-audit",
      threadId: "th-techmaps-audit",
      companyId: "company-1",
    });

    expect(response.text).toContain(
      "Audit 3 event(s), last workflow_resume_ready.",
    );
    expect(response.text).toContain("Batch MULTI_STEP/OPEN");
  });

  it("показывает workflow composition gate в summary техкарты", async () => {
    const response = await service.buildResponse({
      request: {
        message: "собери черновик техкарты",
        threadId: "th-techmaps-composition",
        workspaceContext: { route: "/consulting/techmaps" },
      },
      executionResult: {
        executedTools: [
          {
            name: RaiToolName.GenerateTechMapDraft,
            result: {
              draftId: "draft-2",
              readiness: "S4_REVIEW_READY",
              workflowVerdict: "VERIFIED",
              workflowOrchestration: {
                summary: "Workflow spine TRUST -> COMPOSITION.",
                composition_gate: {
                  can_compose: true,
                  reason: "trust_gate_passed",
                },
              },
              trustSpecialization: {
                composition_gate: {
                  can_compose: true,
                  reason: "trust_gate_passed",
                  disclosure: ["trust_gate_passed"],
                },
                blocked_disclosure: [],
              },
              variantComparisonReport: {
                comparison_available: false,
              },
            },
          },
        ],
      } as any,
      recallResult: {
        recall: { items: [] },
        profile: {},
      } as any,
      externalSignalResult: { feedbackStored: false },
      traceId: "tr-techmaps-composition",
      threadId: "th-techmaps-composition",
      companyId: "company-1",
    });

    expect(response.text).toContain("Workflow spine TRUST -> COMPOSITION.");
    expect(response.text).toContain("Композиция готова: trust_gate_passed.");
    expect(response.text).toContain("Trust specialization: composition-allowed.");
    expect(response.text).toContain("Variant comparison single-variant.");
  });

  it("читает workflow_snapshot и execution_loop_summary как fallback контракт", async () => {
    const response = await service.buildResponse({
      request: {
        message: "собери черновик техкарты",
        threadId: "th-techmaps-snapshot-fallback",
        workspaceContext: { route: "/consulting/techmaps" },
      },
      executionResult: {
        executedTools: [
          {
            name: RaiToolName.GenerateTechMapDraft,
            result: {
              workflow_snapshot: {
                workflow_id: "tech-map:draft-snake",
                draft_id: "draft-snake",
                readiness: "S2_CONTEXTUALIZED",
                workflow_verdict: "PARTIAL",
                publication_state: "WORKING_DRAFT",
                missing_must: ["soil_profile"],
                clarify_batch: {
                  mode: "MULTI_STEP",
                  status: "OPEN",
                  resume_token:
                    "resume:tech-map:draft-snake:clarify:draft-snake:soil_profile",
                },
                workflow_resume_state: {
                  resume_from_phase: "MISSING_CONTEXT_TRIAGE",
                  external_recheck_required: true,
                },
                workflow_orchestration: {
                  summary: "Workflow spine INTAKE -> TRIAGE.",
                  composition_gate: {
                    can_compose: false,
                    reason: "trust_gate_pending",
                  },
                },
                trust_specialization: {
                  composition_gate: {
                    can_compose: false,
                    reason: "trust_gate_pending",
                    disclosure: ["trust_gate_pending"],
                  },
                  blocked_disclosure: ["soil_profile_missing"],
                },
                next_actions: ["Закрыть soil_profile"],
              },
              execution_loop_summary: {
                scope: {
                  company_id: "company-1",
                  field_id: "field-1",
                  season_id: "season-1",
                  crop_code: "rapeseed",
                  workflow_id: "tech-map:draft-snake",
                },
                tech_map_ref: {
                  draft_id: "draft-snake",
                  workflow_id: "tech-map:draft-snake",
                },
                execution_state: {
                  status: "PARTIAL_HISTORY",
                  has_execution_history: true,
                  has_past_outcomes: false,
                  has_materialized_operations: true,
                },
                deviation_state: {
                  status: "SCOPED",
                  scope_consistent: true,
                  blocking_gaps: [],
                },
                result_state: {
                  status: "PARTIAL",
                  relation_to_targets: "BASELINE_ONLY",
                  summary: "Result stage частичный",
                },
                blocking_gaps: [],
                evidence_refs: ["audit:1"],
              },
            },
          },
        ],
      } as any,
      recallResult: {
        recall: { items: [] },
        profile: {},
      } as any,
      externalSignalResult: { feedbackStored: false },
      traceId: "tr-techmaps-snapshot-fallback",
      threadId: "th-techmaps-snapshot-fallback",
      companyId: "company-1",
    });

    expect(response.text).toContain("Черновик техкарты создан: draft-snake.");
    expect(response.text).toContain("Готовность S2_CONTEXTUALIZED, verdict PARTIAL.");
    expect(response.text).toContain("Batch MULTI_STEP/OPEN");
    expect(response.text).toContain(
      "Resume phase MISSING_CONTEXT_TRIAGE, recheck required.",
    );
    expect(response.text).toContain("Workflow spine INTAKE -> TRIAGE.");
    expect(response.text).toContain(
      "Композиция заблокирована: trust_gate_pending.",
    );
    expect(response.text).toContain(
      "Trust specialization: composition-blocked.",
    );
    expect(response.text).toContain(
      "Execution loop PARTIAL_HISTORY/SCOPED/PARTIAL.",
    );
  });

  it("показывает explainability window и причины из workflow_explainability", async () => {
    const response = await service.buildResponse({
      request: {
        message: "собери черновик техкарты",
        threadId: "th-techmaps-explainability",
        workspaceContext: { route: "/consulting/techmaps" },
      },
      executionResult: {
        executedTools: [
          {
            name: RaiToolName.GenerateTechMapDraft,
            result: {
              draftId: "draft-explain-1",
              readiness: "S2_MINIMUM_COMPUTABLE",
              workflowVerdict: "PARTIAL",
              workflow_explainability: {
                readiness: "S2_MINIMUM_COMPUTABLE",
                workflow_verdict: "PARTIAL",
                publication_state: "WORKING_DRAFT",
                explainability_window: "analysis",
                why: {
                  blocked_reasons: ["missing_must:soil_profile"],
                  partial_reasons: ["workflow_verdict_partial", "result_stage_partial"],
                  composable_reasons: [],
                },
                source_slots: {
                  missing_must: ["soil_profile"],
                  clarify_items: ["soil_profile"],
                  gaps: ["soil_profile"],
                },
                trust_gate: null,
                deviation_summary: {
                  status: "BLOCKED_BY_CONTEXT",
                  scope_consistent: true,
                  blocking_gaps: ["soil_profile"],
                },
                next_actions: ["Закрыть soil_profile"],
              },
            },
          },
        ],
      } as any,
      recallResult: {
        recall: { items: [] },
        profile: {},
      } as any,
      externalSignalResult: { feedbackStored: false },
      traceId: "tr-techmaps-explainability",
      threadId: "th-techmaps-explainability",
      companyId: "company-1",
    });

    expect(response.text).toContain("Explainability window analysis.");
    expect(response.text).toContain("Blocked reasons 1, partial reasons 2.");
  });

  it("показывает expert review publication chain в summary техкарты", async () => {
    const response = await service.buildResponse({
      request: {
        message: "собери черновик техкарты",
        threadId: "th-techmaps-expert",
        workspaceContext: { route: "/consulting/techmaps" },
      },
      executionResult: {
        executedTools: [
          {
            name: RaiToolName.GenerateTechMapDraft,
            result: {
              draftId: "draft-3",
              readiness: "S4_REVIEW_READY",
              workflowVerdict: "PARTIAL",
              expertReview: {
                verdict: "REVISE",
                trigger: "trust_trigger",
                publication_packet_ref: "techmap:techmap-1:publication-packet:techmap-1:variant:primary",
                human_authority_chain: [
                  {
                    role: "chief_agronomist",
                    required: true,
                    status: "needs_revision",
                    reason: "needs revision",
                  },
                  {
                    role: "human_agronomist",
                    required: true,
                    status: "pending",
                    reason: "Human agronomy review remains mandatory before publication.",
                  },
                ],
              },
            },
          },
        ],
      } as any,
      recallResult: {
        recall: { items: [] },
        profile: {},
      } as any,
      externalSignalResult: { feedbackStored: false },
      traceId: "tr-techmaps-expert",
      threadId: "th-techmaps-expert",
      companyId: "company-1",
    });

    expect(response.text).toContain("Expert review REVISE (trust_trigger).");
    expect(response.text).toContain("Publication packet techmap:techmap-1:publication-packet:techmap-1:variant:primary.");
    expect(response.text).toContain("Human agronomy pending.");
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
          fallbackUsed: false,
          validation: { actionAllowed: true, explain: "" },
          outputContractVersion: "v1",
          toolCalls: [],
          confidence: 0.91,
          evidence: [],
          structuredOutput: {
            summary: "Открываю карточку контрагента ООО \"СЫСОИ\".",
          },
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

  it("рисует отдельный work window для CRM composite flow", async () => {
    const response = await service.buildResponse({
      request: {
        message:
          "Давай зарегим контрагента, потом создай аккаунт и открой карточку.",
        threadId: "th-crm-composite-1",
        workspaceContext: { route: "/consulting/crm" },
      },
      executionResult: {
        executedTools: [
          {
            name: RaiToolName.RegisterCounterparty,
            result: {
              created: true,
              source: "DADATA",
              partyId: "party-1",
              legalName: "ООО Ромашка",
              inn: "2636041493",
              jurisdictionCode: "RU",
              lookupStatus: "FOUND",
              alreadyExisted: false,
            },
          },
          {
            name: RaiToolName.CreateCrmAccount,
            result: {
              accountId: "acc-1",
              name: "ООО Ромашка",
              inn: "2636041493",
              status: "ACTIVE",
              partyId: "party-1",
            },
          },
          {
            name: RaiToolName.GetCrmAccountWorkspace,
            result: {
              account: { id: "acc-1", name: "ООО Ромашка" },
              linkedParty: { id: "party-1", legalName: "ООО Ромашка" },
              legalEntities: [],
              contacts: [],
              interactions: [],
              obligations: [],
              documents: [],
              risks: [],
            },
          },
        ],
        agentExecution: {
          role: "crm_agent",
          status: "COMPLETED",
          executionPath: "explicit_tool_path",
          text: "Составной CRM-сценарий выполнен.",
          structuredOutput: {
            compositePlan: {
              planId:
                "crm.register_counterparty.create_account.open_workspace:th-crm-composite-1",
              workflowId: "crm.register_counterparty.create_account.open_workspace",
              leadOwnerAgent: "crm_agent",
              executionStrategy: "sequential",
              summary:
                "регистрация контрагента, создание CRM-аккаунта и открытие карточки",
              stages: [
                {
                  stageId: "register_counterparty",
                  order: 1,
                  agentRole: "crm_agent",
                  intent: "register_counterparty",
                  toolName: "register_counterparty",
                  label: "Регистрация контрагента",
                  dependsOn: [],
                  status: "completed",
                  summary: "Контрагент зарегистрирован.",
                },
                {
                  stageId: "create_crm_account",
                  order: 2,
                  agentRole: "crm_agent",
                  intent: "create_crm_account",
                  toolName: "create_crm_account",
                  label: "Создание CRM-аккаунта",
                  dependsOn: ["register_counterparty"],
                  status: "completed",
                  summary: "CRM-аккаунт создан.",
                },
                {
                  stageId: "review_account_workspace",
                  order: 3,
                  agentRole: "crm_agent",
                  intent: "review_account_workspace",
                  toolName: "get_crm_account_workspace",
                  label: "Открытие карточки/рабочего пространства",
                  dependsOn: ["create_crm_account"],
                  status: "completed",
                  summary: "Карточка открыта.",
                },
              ],
            },
            compositeStages: [
              {
                stageId: "register_counterparty",
                order: 1,
                agentRole: "crm_agent",
                intent: "register_counterparty",
                toolName: "register_counterparty",
                status: "completed",
                summary: "Контрагент зарегистрирован.",
              },
              {
                stageId: "create_crm_account",
                order: 2,
                agentRole: "crm_agent",
                intent: "create_crm_account",
                toolName: "create_crm_account",
                status: "completed",
                summary: "CRM-аккаунт создан.",
              },
              {
                stageId: "review_account_workspace",
                order: 3,
                agentRole: "crm_agent",
                intent: "review_account_workspace",
                toolName: "get_crm_account_workspace",
                status: "completed",
                summary: "Карточка открыта.",
              },
            ],
          },
          toolCalls: [],
          connectorCalls: [],
          evidence: [],
          validation: { passed: true, reasons: [] },
          fallbackUsed: false,
          outputContractVersion: "v1",
        },
      } as any,
      recallResult: {
        recall: { items: [] },
        profile: {},
      } as any,
      externalSignalResult: { feedbackStored: false },
      traceId: "tr-crm-composite-1",
      threadId: "th-crm-composite-1",
      companyId: "company-1",
    });

    const compositeWindow = response.workWindows?.find(
      (window) =>
        window.type === "structured_result" &&
        window.payload.intentId === "crm_composite_flow",
    );
    const compositeSignals = response.workWindows?.find(
      (window) =>
        window.type === "related_signals" &&
        window.payload.intentId === "crm_composite_flow",
    );

    expect(compositeWindow).toEqual(
      expect.objectContaining({
        title: "CRM составной сценарий",
        status: "completed",
        payload: expect.objectContaining({
          summary: expect.stringContaining("регистрация контрагента"),
        }),
      }),
    );
    expect(compositeSignals?.payload.signalItems).toHaveLength(3);
  });

  it("рисует отдельный work window для analytical multi-source aggregation", async () => {
    const response = await service.buildResponse({
      request: {
        message: "Собери agro execution fact -> finance cost aggregation.",
        threadId: "th-analytics-composite-1",
        workspaceContext: { route: "/consulting/dashboard" },
      },
      executionResult: {
        executedTools: [],
        agentExecution: {
          role: "agronomist",
          status: "COMPLETED",
          executionPath: "explicit_tool_path",
          text: "Аналитический композит выполнен.",
          structuredOutput: {
            compositePlan: {
              planId:
                "agro.execution_fact.finance.cost_aggregation:th-analytics-composite-1",
              workflowId: "agro.execution_fact.finance.cost_aggregation",
              leadOwnerAgent: "agronomist",
              executionStrategy: "sequential",
              summary: "агро-факт исполнения и агрегация финансовых затрат",
              stages: [
                {
                  stageId: "agro_execution_fact",
                  order: 1,
                  agentRole: "agronomist",
                  intent: "compute_deviations",
                  toolName: "compute_deviations",
                  label: "Факт исполнения по агро-контексту",
                  dependsOn: [],
                  status: "completed",
                  summary: "Агро execution fact подтвержден.",
                },
                {
                  stageId: "finance_cost_aggregation",
                  order: 2,
                  agentRole: "economist",
                  intent: "compute_plan_fact",
                  toolName: "compute_plan_fact",
                  label: "Агрегация финансовых затрат",
                  dependsOn: ["agro_execution_fact"],
                  status: "completed",
                  summary: "Финансовая стоимость агрегирована.",
                },
              ],
            },
            compositeStages: [
              {
                stageId: "agro_execution_fact",
                order: 1,
                agentRole: "agronomist",
                intent: "compute_deviations",
                toolName: "compute_deviations",
                status: "completed",
                summary: "Агро execution fact подтвержден.",
              },
              {
                stageId: "finance_cost_aggregation",
                order: 2,
                agentRole: "economist",
                intent: "compute_plan_fact",
                toolName: "compute_plan_fact",
                status: "completed",
                summary: "Финансовая стоимость агрегирована.",
              },
            ],
          },
          toolCalls: [],
          connectorCalls: [],
          evidence: [],
          validation: { passed: true, reasons: [] },
          fallbackUsed: false,
          outputContractVersion: "v1",
        },
      } as any,
      recallResult: {
        recall: { items: [] },
        profile: {},
      } as any,
      externalSignalResult: { feedbackStored: false },
      traceId: "tr-analytics-composite-1",
      threadId: "th-analytics-composite-1",
      companyId: "company-1",
    });

    const compositeWindow = response.workWindows?.find(
      (window) =>
        window.type === "structured_result" &&
        window.payload.intentId === "multi_source_aggregation",
    );
    const compositeSignals = response.workWindows?.find(
      (window) =>
        window.type === "related_signals" &&
        window.payload.intentId === "multi_source_aggregation",
    );

    expect(compositeWindow).toEqual(
      expect.objectContaining({
        title: "Аналитическая агрегация",
        status: "completed",
        payload: expect.objectContaining({
          summary: expect.stringContaining("агро-факт исполнения"),
        }),
      }),
    );
    expect(compositeWindow?.payload.sections?.[0]?.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Владелец",
          value: "agronomist",
        }),
      ]),
    );
    expect(compositeSignals?.payload.signalItems).toHaveLength(2);
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
          executionPath: "explicit_tool_path",
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
          executionPath: "explicit_tool_path",
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
          executionPath: "explicit_tool_path",
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
          executionPath: "explicit_tool_path",
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
