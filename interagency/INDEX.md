# Interagency Index
Актуальные документы (обновлять по мере работы).

## Активные промты (в работе)
- `interagency/prompts/2026-03-03_s1-3_topnav-role-switch-hotfix.md` [DONE]
  - План: `interagency/plans/2026-03-03_s1-3_topnav-role-switch-hotfix.md` [ACCEPTED]
  - Отчёт: `interagency/reports/2026-03-03_s1-3_topnav-role-switch-hotfix.md`
  - Статус: hotfix завершён. `TopNav` и `GovernanceBar` канонически оформлены, `tsc` PASS, manual check PASS.

- `interagency/prompts/2026-03-03_s2-2_workspace-context-load-rule.md` [DONE]
  - План: `interagency/plans/2026-03-03_s2-2_workspace-context-load-rule.md` [ACCEPTED]
  - Отчёт: `interagency/reports/2026-03-03_s2-2_workspace-context-load-rule.md`
  - Статус: РЕАЛИЗАЦИЯ ЗАВЕРШЕНА. Gatekeeper-слой (truncation, flat filters validation) внедрен в store и верифицирован unit-тестами.

- `interagency/prompts/2026-03-03_s4-1_chat-widget-logic.md` [READY]
  - План: еще не создан
  - Статус: промт создан. Требует динамизации виджетов на основе контекста.

- `interagency/prompts/2026-03-03_s3-2_typed-tool-calls.md` [DONE]
  - План: `interagency/plans/2026-03-03_s3-2_typed-tool-calls.md` [ACCEPTED]
  - Отчёт: `interagency/reports/2026-03-03_s3-2_typed-tool-calls.md`
  - Статус: РЕАЛИЗАЦИЯ ЗАВЕРШЕНА. Forensic-логирование пэйлоадов внедрено. Типизированный шлюз закреплен как единственный законный путь к домену.

- `interagency/prompts/2026-03-03_s3-1_chat-api-v1.md` [DONE]
  - План: `interagency/plans/2026-03-03_s3-1_chat-api-v1.md` [ACCEPTED]
  - Отчёт: `interagency/reports/2026-03-03_s3-1_chat-api-v1.md`
  - Статус: РЕАЛИЗАЦИЯ ЗАВЕРШЕНА. Контракт V1 формализован, поддержка toolCalls и openUiToken внедрена и протестирована.

- `interagency/prompts/2026-03-03_s2-1_workspace-context-contract.md` [DONE]
  - План: `interagency/plans/2026-03-03_s2-1_workspace-context-contract.md` [ACCEPTED]
  - Отчёт: `interagency/reports/2026-03-03_s2-1_workspace-context-contract.md`
  - Статус: РЕАЛИЗАЦИЯ ЗАВЕРШЕНА. WorkspaceContext lifecycle, yield coverage и backend observability верифицированы.

- `interagency/prompts/2026-03-02_s1-2_topnav-navigation.md` [DONE]
  - План: `interagency/plans/2026-03-02_s1-2_topnav-navigation.md`
  - Отчёт: `interagency/reports/2026-03-02_s1-2_topnav-navigation.md`
  - Статус: РЕАЛИЗАЦИЯ ЗАВЕРШЕНА. TopNav внедрен, Sidebar удален, интеграция с RaiOutputOverlay верифицирована.

- `interagency/prompts/2026-03-02_s1-1_app-shell-persistent-rai-chat.md` [DONE]
  - План: `interagency/plans/2026-03-02_s1-1_app-shell-persistent-rai-chat.md`
  - Отчёт: `interagency/reports/2026-03-02_s1-1_app-shell-persistent-rai-chat.md`
  - Результат: AppShell + LeftRaiChatDock, чат не размонтируется при навигации; tsc + unit PASS; manual smoke pending.

- `interagency/prompts/2026-03-01_p0-1_api-rai-chat.md` [DONE]
  - План: `interagency/plans/2026-03-01_p0-1_api-rai-chat.md`
  - Отчёт: `interagency/reports/2026-03-01_p0-1_api-rai-chat.md`

- `interagency/prompts/2026-03-01_p0-2_workspace-context.md` [DONE]
  - Результат: канонический WorkspaceContext (contract + store + publishers CRM/TechMap), API DTO без companyId из payload, передача в POST /api/rai/chat.
  - Отчёт: `interagency/reports/2026-03-01_p0-2_workspace-context-report.md`

- `interagency/prompts/2026-03-01_p0-3_agro-telegram-draft-commit.md` [DONE]
  - Результат: боевой `AgroEventsModule` (`/api/agro-events/*`) + MUST-gate unit-test (изолированный jest config)
  - План: `interagency/plans/2026-03-01_p0-3_agro-telegram-draft-commit.md`
  - Отчёт: `interagency/reports/2026-03-01_p0-3_agro-telegram-draft-commit.md`

- `interagency/prompts/2026-03-01_p0-4_telegram-bot-draft-commit.md` [DONE]
  - Результат: бот создаёт draft (text/photo/voice), кнопки ✅✏️🔗, вызовы fix/link/confirm к API; callback `ag:<action>:<draftId>`; unit + smoke-прогон.
  - План: `interagency/plans/2026-03-01_p0-4_telegram-bot-draft-commit.md`
  - Отчёт: `interagency/reports/2026-03-01_p0-4_telegram-bot-draft-commit.md`

- `interagency/prompts/2026-03-01_p0-5_agro-escalation-controller-loop.md` [DONE]
  - Результат: AgroEscalationLoopService после commit; пороги S3/S4; unit 7/7; tenant из committed, не из payload.
  - План: `interagency/plans/2026-03-01_p0-5_agro-escalation-controller-loop.md`
  - Отчёт: `interagency/reports/2026-03-01_p0-5_agro-escalation-controller-loop.md`

- `interagency/prompts/2026-03-01_p1-1_typed-tools-registry.md` [DONE]
  - Результат: RaiToolsRegistry (joi, register/execute), 2 инструмента (echo_message, workspace_snapshot), типизированные DTO, unit 4/4 (jest direct).
  - План: `interagency/plans/2026-03-01_p1-1_typed-tools-registry.md`
  - Отчёт: `interagency/reports/2026-03-01_p1-1_typed-tools-registry.md`

- `interagency/prompts/2026-03-01_p1-2_widgets-schema-renderer.md` [DONE]
  - План: `interagency/plans/2026-03-01_p1-2_widgets-schema-renderer.md`
  - Отчёт: `interagency/reports/2026-03-01_p1-2_widgets-schema-renderer.md`
  - Результат: Каноническая схема `widgets[]` и renderer (2 виджета) в web-чате.

- `interagency/prompts/2026-03-02_p1-3_agent-chat-memory.md` [DONE]
  - План: `interagency/plans/2026-03-02_p1-3_agent-chat-memory.md`
  - Отчёт: `interagency/reports/2026-03-02_p1-3_agent-chat-memory.md`
  - Результат: Retrieve+append в RAI Chat, tenant isolation, лимиты/timeout/fail-open, denylist секретов, unit 5/5.

- `interagency/prompts/2026-03-02_p1-4_status-truth-sync.md` [DONE]
  - План: `interagency/plans/2026-03-02_p1-4_status-truth-sync.md`
  - Отчёт: `interagency/reports/2026-03-02_p1-4_status-truth-sync.md`
  - Результат: truth-sync для execution-доков P0/P1; `VERIFIED`/`IN_PROGRESS` пометки, evidence и команды проверки; полный проход docs/07_EXECUTION/* — в backlog.

- `interagency/prompts/2026-03-02_p2-1_workspacecontext-expand.md` [DONE]
  - План: `interagency/plans/2026-03-02_p2-1_workspacecontext-expand.md`
  - Отчёт: `interagency/reports/2026-03-02_p2-1_workspacecontext-expand.md`
  - Результат: WorkspaceContext расширен на Commerce contracts и consulting/execution/manager; kind contract/operation, web-spec PASS; ревью APPROVED.

- `interagency/prompts/2026-03-02_p2-2_external-signals-advisory.md` [DONE]
  - План: `interagency/plans/2026-03-02_p2-2_external-signals-advisory.md` [ACCEPTED]
  - Отчёт: `interagency/reports/2026-03-02_p2-2_external-signals-advisory.md`
  - Результат: тонкий срез `signals -> advisory -> feedback -> memory append` в RAI Chat; tenant isolation, explainability, unit 8/8; ревью APPROVED.

- `interagency/prompts/2026-03-02_p2-3_ux-polish-dock-focus.md` [DONE]
  - План: `interagency/plans/2026-03-02_p2-3_ux-polish-dock-focus.md`
  - Отчёт: `interagency/reports/2026-03-02_p2-3_ux-polish-dock-focus.md`
  - Результат: Dock/Focus, хоткеи и сворачиваемый rail в AI-чате; tsc apps/web PASS; gap по web Draft→Commit честно зафиксирован.


## Шаблоны
- `interagency/templates/PROMPT_TEMPLATE.md`
- `interagency/templates/PLAN_TEMPLATE.md`
- `interagency/templates/REPORT_TEMPLATE.md`
