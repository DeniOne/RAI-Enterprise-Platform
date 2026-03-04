# Interagency Index
Актуальные документы (обновлять по мере работы).

## Активные промты (в работе)

- `interagency/prompts/2026-03-04_a_rai-f1-1_intent-router-agro-registry.md` [IN_PROGRESS]
  - Decision-ID: AG-ARAI-F1-001
  - Статус: Промт создан, ожидает исполнения. Задачи: IntentRouter (выделение из SupervisorAgent), AgroToolsRegistry (доменный реестр агро-инструментов), TraceId Binding в AiAuditEntry.


- `interagency/prompts/2026-03-04_tm-post-b_season-cropzone-cropvariety.md` [DONE]
  - План: `interagency/plans/2026-03-04_tm-post-b_season-cropzone-cropvariety.md` [ACCEPTED]
  - Отчёт: `interagency/reports/2026-03-04_tm-post-b_season-cropzone-cropvariety.md` [APPROVED]
  - Decision-ID: AG-TM-POST-B-006 [зарегистрирован в DECISIONS.log]
  - Статус: DONE. Реализация и миграции выполнены успешно. Схема БД синхронизирована, тесты (34 + 95) PASS. Данные `Rapeseed` перенесены в `CropVariety`, `Season` стал глобальным, `TechMap` привязан к `CropZone`.
  - Задачи: Season→глобальный, CropZone→primary для TechMap, Rapeseed→CropVariety (новый модуль), data-migration скрипт.

- `interagency/prompts/2026-03-04_tm-post-c_ui-workbench-v2.md` [DONE]
  - План: `interagency/plans/2026-03-04_tm-post-c_ui-workbench-v2.md` [ACCEPTED]
  - Отчёт: `interagency/reports/2026-03-04_tm-post-c_ui-workbench-v2.md` [APPROVED]
  - Decision-ID: AG-TM-POST-C-007 [зарегистрирован в DECISIONS.log]
  - Статус: DONE. Конструирование UI Workbench v2 успешно завершено. Тесты пройдены, DAG, Evidence и ChangeOrder реализованы.
  - Задачи: UI Workbench v2 (DAG visualization, Evidence upload, ChangeOrder UI).

- `interagency/prompts/2026-03-03_tm-1_data-foundation.md` [DONE]
  - План: `interagency/plans/2026-03-03_tm-1_data-foundation.md` [ACCEPTED]
  - Отчёт: `interagency/reports/2026-03-03_tm-1_data-foundation.md` [APPROVED]
  - Decision-ID: AG-TM-DATA-001
  - Статус: DONE. prisma validate/db push/tsc/8 DTO-тестов PASS. 4 новые модели (SoilProfile, RegionProfile, InputCatalog, CropZone) + расширение Field/TechMap/MapOperation/MapResource + 5 enums. Pre-existing failures в 8 модулях — не scope TM-1.

- `interagency/prompts/2026-03-03_tm-2_dag-validation.md` [READY_FOR_REVIEW]
  - План: `interagency/plans/2026-03-03_tm-2_dag-validation.md` [ACCEPTED]
  - Отчёт: `interagency/reports/2026-03-03_tm-2_dag-validation.md`
  - Decision-ID: AG-TM-DAG-002
  - Мастер-чеклист: `docs/00_STRATEGY/TECHMAP/TECHMAP_IMPLEMENTATION_CHECKLIST.md`
  - Технический базис: `docs/00_STRATEGY/TECHMAP/GRAND_SYNTHESIS.md` §3
  - Статус: `DAGValidationService`, `TechMapValidationEngine`, `TankMixCompatibilityService` и 3 калькулятора реализованы; `tsc` PASS, validation/ 15/15 PASS, calculators/ 9/9 PASS, tech-map/ 17/17 суит PASS (56 тестов).

- `interagency/prompts/2026-03-03_tm-3_evidence-changeorder.md` [DONE]
  - План: `interagency/plans/2026-03-03_tm-3_evidence-changeorder.md` [ACCEPTED]
  - Отчёт: `interagency/reports/2026-03-03_tm-3_evidence-changeorder.md` [APPROVED]
  - Decision-ID: AG-TM-EV-003
  - Статус: DONE. prisma validate/db push/tsc/16 тестов PASS. Evidence + ChangeOrder + Approval + 5 enums. Pre-existing failures не в scope TM-3.

- `interagency/prompts/2026-03-04_tm-4_adaptive-rules.md` [DONE]
  - План: `interagency/plans/2026-03-04_tm-4_adaptive-rules.md` [ACCEPTED]
  - Отчёт: `interagency/reports/2026-03-04_tm-4_adaptive-rules.md` [APPROVED]
  - Decision-ID: AG-TM-AR-004
  - Статус: DONE. prisma validate/db push/tsc/17 тестов PASS. AdaptiveRule, HybridPhenologyModel, TriggerEvaluationService, RegionProfileService, HybridPhenologyService. concurrency.spec.ts typo fixed.

- `interagency/prompts/2026-03-04_tm-5_economics-contract.md` [DONE]
  - План: `interagency/plans/2026-03-04_tm-5_economics-contract.md` [ACCEPTED]
  - Отчёт: `interagency/reports/2026-03-04_tm-5_economics-contract.md` [APPROVED]
  - Decision-ID: AG-TM-EC-005
  - Статус: DONE. tsc/validate/db push PASS. 20/20 адресных тестов PASS, регрессия 28 suites / 95 tests PASS. TechMapBudgetService, TechMapKPIService, ContractCoreService (SHA-256 stableStringify), RecalculationEngine.

- `interagency/prompts/2026-03-04_tm-post-a_consolidation.md` [DONE]
  - План: `interagency/plans/2026-03-04_tm-post-a_consolidation.md` [ACCEPTED]
  - Отчёт: `interagency/reports/2026-03-04_tm-post-a_consolidation_review.md` [APPROVED]
  - Decision-ID: AG-TM-POST-A-001
  - Статус: DONE. tsc PASS, jest tech-map/ 28 suites / 95 tests PASS. UnitNormal+TechMapValidator → tech-map/, tenant-check в activate [ADR-013], consulting.module.ts очищен.

- `interagency/prompts/2026-03-03_sprint1-p2_tests-smoke-telegram.md` [DONE]
  - Отчёт: `interagency/reports/2026-03-03_sprint1-p2_tests-smoke-telegram.md`
  - Статус: DONE. Unit 14/14 PASS. Smoke 4/4 PASS. TechMap DRAFT в БД подтверждён. Telegram→chat bridge отсутствует — зафиксировано в backlog.

- `interagency/prompts/2026-03-03_sprint1-p1_tools-registry-domain-bridge.md` [DONE]
  - Отчёт: `interagency/reports/2026-03-03_sprint1-p1_tools-registry-domain-bridge.md`
  - Статус: DONE. 4 тула в `RaiToolsRegistry`, intent routing в `SupervisorAgent`. tsc PASS, unit PASS, smoke curl PASS.

- `interagency/prompts/2026-03-03_s1-3_topnav-role-switch-hotfix.md` [DONE]
  - План: `interagency/plans/2026-03-03_s1-3_topnav-role-switch-hotfix.md` [ACCEPTED]
  - Отчёт: `interagency/reports/2026-03-03_s1-3_topnav-role-switch-hotfix.md`
  - Статус: hotfix завершён. `TopNav` и `GovernanceBar` канонически оформлены, `tsc` PASS, manual check PASS.

- `interagency/prompts/2026-03-03_s2-2_workspace-context-load-rule.md` [DONE]
  - План: `interagency/plans/2026-03-03_s2-2_workspace-context-load-rule.md` [ACCEPTED]
  - Отчёт: `interagency/reports/2026-03-03_s2-2_workspace-context-load-rule.md`
  - Статус: РЕАЛИЗАЦИЯ ЗАВЕРШЕНА. Gatekeeper-слой (truncation, flat filters validation) внедрен в store и верифицирован unit-тестами.

- `interagency/prompts/2026-03-03_s5-4_adapter-write-routing.md` [DONE]
  - План: `interagency/plans/2026-03-03_s5-4_adapter-write-routing.md` [ACCEPTED]
  - Отчёт: `interagency/reports/2026-03-03_s5-4_adapter-write-routing.md`
  - Статус: `appendInteraction` пишет в `MemoryInteraction`, `userId` прокинут сквозь chat/external-signals, JSON payload санитизируется рекурсивно, embedding пишется транзакционно; `tsc` PASS, targeted jest PASS.
- `interagency/prompts/2026-03-03_s2-b_phase-b-truth-sync.md` [DONE]
  - План: `interagency/plans/2026-03-03_s2-b_phase-b-truth-sync.md` [ACCEPTED]
  - Отчёт: `interagency/reports/2026-03-03_s2-b_phase-b-truth-sync.md`
  - Статус: truth-sync по `Phase B` завершён; widgets rail подтвержден как реализованный, единственный pending-хвост `Phase B` — интеграция `SupervisorAgent` в API.
- `interagency/prompts/2026-03-03_s2-c_supervisor-agent-api-integration.md` [DONE]
  - План: `interagency/plans/2026-03-03_s2-c_supervisor-agent-api-integration.md` [ACCEPTED]
  - Отчёт: `interagency/reports/2026-03-03_s2-c_supervisor-agent-api-integration.md`
  - Статус: `SupervisorAgent` внедрён как orchestration layer для `rai-chat`; `RaiChatService` стал thin facade; `tsc` PASS, targeted jest PASS.
- `interagency/prompts/2026-03-03_s5-5_episodes-profile-integration.md` [DONE]
  - План: `interagency/plans/2026-03-03_s5-5_episodes-profile-integration.md` [ACCEPTED]
  - Отчёт: `interagency/reports/2026-03-03_s5-5_episodes-profile-integration.md`
  - Статус: `MemoryEpisode` и `MemoryProfile` подключены в runtime-path; `SupervisorAgent` использует profile context; `tsc` PASS, targeted jest PASS.
- `interagency/prompts/2026-03-03_s5-6_memory-observability-debug-panel.md` [DONE]
  - План: `interagency/plans/2026-03-03_s5-6_memory-observability-debug-panel.md` [ACCEPTED]
  - Отчёт: `interagency/reports/2026-03-03_s5-6_memory-observability-debug-panel.md`
  - Статус: `memoryUsed` добавлен в chat contract, debug-плашка `Memory Used` доступна в привилегированном режиме; backend/web tests PASS.
- `interagency/prompts/2026-03-03_s5-3_memory-schema-implementation.md` [DONE]
  - План: `interagency/plans/2026-03-03_s5-3_memory-schema-implementation.md` [ACCEPTED]
  - Отчёт: `interagency/reports/2026-03-03_s5-3_memory-schema-implementation.md` [APPROVED] Физическая схема памяти (Prisma) создана.
- `interagency/prompts/2026-03-03_s5-2_memory-storage-canon.md` [DONE]
  - План: `interagency/plans/2026-03-03_s5-2_memory-storage-canon.md` [ACCEPTED]
  - Отчёт: `interagency/reports/2026-03-03_s5-2_memory-storage-canon.md` [APPROVED] Формализован канон памяти (3-Tiers, Carcass+Flex).
- `interagency/prompts/2026-03-03_s5-1_memory-adapter-contract.md` [DONE]
  - План: `interagency/plans/2026-03-03_s5-1_memory-adapter-contract.md` [ACCEPTED]
  - Отчёт: `interagency/reports/2026-03-03_s5-1_memory-adapter-contract.md`
- `interagency/prompts/2026-03-03_s4-1_chat-widget-logic.md` [DONE]
  - План: `interagency/plans/2026-03-03_s4-1_chat-widget-logic.md` [ACCEPTED]
  - Отчёт: `interagency/reports/2026-03-03_s4-1_chat-widget-logic.md`
  - Статус: widget logic вынесена в `RaiChatWidgetBuilder`; виджеты динамически зависят от `companyId` и `workspaceContext`; `jest` PASS, `tsc` PASS.

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
