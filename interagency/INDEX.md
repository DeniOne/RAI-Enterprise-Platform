# Interagency Index
Актуальные документы (обновлять по мере работы).

## Активные промты (в работе)

- `interagency/prompts/2026-03-04_a_rai-f1-1_intent-router-agro-registry.md` [DONE]
  - Decision-ID: AG-ARAI-F1-001 [зарегистрирован в DECISIONS.log]
  - Отчёт: `interagency/reports/2026-03-04_a_rai-f1-1_intent-router-agro-registry.md` [APPROVED]
  - Статус: DONE. `IntentRouterService` (regex+LLM-ready), `AgroToolsRegistry` (изоляция agro-инструментов), `AiAuditEntry` (TraceId в БД). tsc PASS, 26/26 тестов PASS.

- `interagency/prompts/2026-03-04_a_rai-f1-2_domain-registries-agronom-stub.md` [DONE]
  - Decision-ID: AG-ARAI-F1-002 [зарегистрирован в DECISIONS.log]
  - Отчёт: `interagency/reports/2026-03-04_a_rai-f1-2_domain-registries-agronom-stub.md` [APPROVED]
  - Статус: DONE. `FinanceToolsRegistry`, `RiskToolsRegistry`, `KnowledgeToolsRegistry`, `AgronomAgent` stub. tsc PASS, 50/50 тестов PASS.

- `interagency/prompts/2026-03-04_a_rai-f1-3_budget-deterministic-bridge.md` [DONE]
  - Decision-ID: AG-ARAI-F1-003 [зарегистрирован в DECISIONS.log]
  - Отчёт: `interagency/reports/2026-03-04_a_rai-f1-3_budget-deterministic-bridge.md` [APPROVED]
  - Статус: DONE. `AgroDeterministicEngineFacade` (ExplainableResult, 3 метода), `BudgetControllerService` (validateTransaction + BudgetExceededError). tsc PASS, 12/12 тестов PASS.

- `interagency/prompts/2026-03-04_a_rai-f1-4_supervisor-decomposition.md` [DONE]
  - Decision-ID: AG-ARAI-F1-004 [зарегистрирован в DECISIONS.log]
  - Отчёт: `interagency/reports/2026-03-04_a_rai-f1-4_supervisor-decomposition.md` [APPROVED]
  - Статус: DONE. Декомпозиция выполнена. `MemoryCoordinator`, `ResponseComposer`, `AgentRuntime` вынесены; `SupervisorAgent` ~120 строк. tsc PASS, 64/64 тестов rai-chat PASS.

- `interagency/prompts/2026-03-04_a_rai-f2-1_parallel-fan-out.md` [DONE]
  - Decision-ID: AG-ARAI-F2-001 [зарегистрирован в DECISIONS.log]
  - Отчёт: `interagency/reports/2026-03-04_a_rai-f2-1_parallel-fan-out.md` [APPROVED]
  - Статус: DONE. ToolCallPlanner, Parallel Fan-Out (Promise.allSettled + 30s timeout + partial), EconomistAgent stub. tsc PASS, 16/16 тестов PASS (+1 skip на timeout).

- `interagency/prompts/2026-03-04_a_rai-f2-2_economist-knowledge-agents.md` [DONE]
  - Decision-ID: AG-ARAI-F2-002 [зарегистрирован в DECISIONS.log]
  - Отчёт: `interagency/reports/2026-03-04_a_rai-f2-2_economist-knowledge-agents.md` [APPROVED]
  - Статус: DONE. EconomistAgent (rule-based explain по ответам FinanceToolsRegistry), KnowledgeAgent (с вызовом QueryKnowledge), интеграция Fan-Out. tsc PASS, целевые тесты PASS.

- `interagency/prompts/2026-03-04_a_rai-f2-3_eval-quality.md` [DONE]
  - Decision-ID: AG-ARAI-F2-003 [зарегистрирован в DECISIONS.log]
  - Отчёт: `interagency/reports/2026-03-04_a_rai-f2-3_eval-quality.md` [APPROVED]
  - Статус: DONE. AgentScoreCard (Prisma + Service), GoldenTestSet + GoldenTestRunnerService, PROMPT_CHANGE_RFC.md. tsc PASS, eval-тесты 5/5 PASS.

- `interagency/prompts/2026-03-05_a_rai-f3-1_monitoring-agent.md` [DONE]
  - Decision-ID: AG-ARAI-F3-001 [зарегистрирован в DECISIONS.log]
  - Отчёт: `interagency/reports/2026-03-05_a_rai-f3-1_monitoring-agent.md` [APPROVED]
  - Статус: DONE. AutonomousExecutionContext (isAutonomous + SecurityViolationError), RiskToolsRegistry riskLevel READ + блокировка WRITE/CRITICAL, MonitoringAgent (emit_alerts, дедуп, rate limit 10/ч, signals snapshot), MonitoringTriggerService (triggerMonitoringCycle + Cron). tsc PASS, 8/8 целевых тестов PASS.

- `interagency/prompts/2026-03-05_a_rai-f3-2_risk-policy.md` [DONE]
  - Decision-ID: AG-ARAI-F3-002 [зарегистрирован в DECISIONS.log]
  - Отчёт: `interagency/reports/2026-03-05_a_rai-f3-2_risk-policy.md` [APPROVED]
  - Статус: DONE. PendingAction (Prisma), RiskPolicyEngineService, PendingActionService, интеграция в RaiToolsRegistry, Two-Person Rule (approveFirst/approveFinal). tsc PASS, все 112 тестов PASS (включая фикс `supervisor-agent.service.spec.ts` и `rai-chat.service.spec.ts`).

- `interagency/prompts/2026-03-05_a_rai-f3-3_privacy-red-team.md` [DONE]
  - Decision-ID: AG-ARAI-F3-003 [зарегистрирован в DECISIONS.log]
  - Отчёт: `interagency/reports/2026-03-05_a_rai-f3-3_privacy-red-team.md` [APPROVED]
  - Статус: DONE. SensitiveDataFilterService (маскировка PII), Red-Team Suite (инъекции, bypass), интеграция фильтра в ResponseComposer. tsc PASS. 115 тестов PASS.

- `interagency/prompts/2026-03-05_a_rai-f4-1_explainability-panel.md` [DONE]
  - Отчёт: `interagency/reports/2026-03-05_a_rai-f4-1_explainability-panel.md` [APPROVED]
  - Статус: DONE. ExplainabilityPanelService + DTO + API endpoint `/rai/explainability/trace/:traceId`, tenant isolation (Forbidden на чужой traceId), PII-маскирование через SensitiveDataFilterService, targeted jest PASS.

- `interagency/prompts/2026-03-05_a_rai-f4-2_tracesummary-contract.md` [DONE]
  - Описание: Реализация TraceSummary Data Contract v1 (Prisma, DTO, сбор метрик токенов/времени/версий).
  - Статус: DONE. Модель Prisma `TraceSummary` (tenant-изолированная), Zod DTO `TraceSummaryDto`, сервис `TraceSummaryService`, интеграция в `SupervisorAgent`. tsc PASS, jest PASS. [APPROVED]

- `interagency/prompts/2026-03-05_a_rai-f4-3_evidence-tagging.md` [DONE]
  - Описание: Реализация MVP Evidence Tagging (привязка claim -> source).
  - Статус: DONE. Тип `EvidenceReference` добавлен, агенты Economist/Knowledge расширены полем `evidence`, ResponseComposer агрегирует evidenceRefs. tsc PASS, jest PASS. [APPROVED]

- `interagency/prompts/2026-03-05_a_rai-f4-4_truthfulness-engine.md` [DONE]
  - Описание: Реализация Truthfulness Engine (Расчёт метрики BS% по таксономии и весам утверждений).
  - Статус: DONE. В `rai-chat` реализован `TruthfulnessEngineService.calculateTraceTruthfulness(traceId, companyId)`, который читает evidenceRefs из `AiAuditEntry.metadata`, классифицирует их по доменам (AGRO/FINANCE/LEGAL/SAFETY/GENERAL) и статусу (VERIFIED/UNVERIFIED/INVALID) с весами (3/3/3/3/1), считает BS% по формуле и обновляет `bsScorePct` в `TraceSummary` (fallback 100% для пустых/без-evidence трейсов). tsc PASS, целевые unit-тесты PASS. [APPROVED]

- `interagency/prompts/2026-03-05_a_rai-f4-5_truthfulness-panel-api.md` [DONE]
  - Отчёт: `interagency/reports/2026-03-05_a_rai-f4-5_truthfulness-panel-api.md` [APPROVED]
  - Статус: DONE. Реализован Truthfulness/Quality Panel API: эндпоинт `GET /rai/explainability/dashboard` с tenant isolation, агрегацией avg/p95 BS% и avg EvidenceCoverage по `TraceSummary`, топ-10 худших трейсов; tsc PASS, целевые jest-тесты PASS.

- `interagency/prompts/2026-03-05_a_rai-f4-6_drift-alerts.md` [DONE]
  - Отчёт: `interagency/reports/2026-03-05_a_rai-f4-6_drift-alerts.md` [APPROVED]
  - Статус: DONE. Реализован `QualityAlert` (Prisma + tenant isolation), сервис `QualityAlertingService` с окнами 24ч/7дней и cooldown, интеграция в `RaiChatModule`; tsc (apps/api) PASS, целевые jest-тесты PASS.

- `interagency/prompts/2026-03-05_a_rai-f4-7_autonomy-policies.md` [DONE]
  - Отчёт: `interagency/reports/2026-03-05_a_rai-f4-7_autonomy-policies.md` [APPROVED]
  - Статус: DONE. `AutonomyLevel` (AUTONOMOUS/TOOL_FIRST/QUARANTINE), `AutonomyPolicyService.getCompanyAutonomyLevel(companyId)` по окну 24ч BS%; интеграция в `RaiToolsRegistry`: QUARANTINE блокирует мутации, TOOL_FIRST форсирует PendingAction; tsc PASS, jest 13/13 PASS. [APPROVED]

- `interagency/prompts/2026-03-05_a_rai-f4-8_agent-points.md` [DONE]
  - Отчёт: `interagency/reports/2026-03-05_a_rai-f4-8_agent-points.md` [APPROVED]
  - Статус: DONE. Модель `AgentReputation`, enum `ReputationLevel` (STABLE/TRUSTED/AUTONOMOUS), `AgentReputationService` (award/deduct, пороги 100/500); tenant isolation; tsc PASS, jest 4/4 PASS. [APPROVED]

- `interagency/prompts/2026-03-05_a_rai-f4-9_feedback-credibility.md` [DONE]
  - Отчёт: `interagency/reports/2026-03-05_a_rai-f4-9_feedback-credibility.md` [APPROVED]
  - Статус: DONE. Модель `UserCredibilityProfile`, сервис `FeedbackCredibilityService` (мультипликатор 0.1–1.0, invalidateFeedback), tenant isolation; tsc (apps/api) PASS, целевые jest-тесты PASS. [APPROVED]

- `interagency/prompts/2026-03-05_a_rai-f4-10_explainability-explorer.md` [DONE]
  - Отчёт: `interagency/reports/2026-03-05_a_rai-f4-10_explainability-explorer.md` [APPROVED]
  - Статус: DONE. AiAuditEntry.metadata (Json); getTraceForensics (summary + timeline с evidenceRefs + qualityAlerts); GET /rai/explainability/trace/:traceId/forensics; tenant 403; tsc PASS, jest 8/8 PASS. [APPROVED]

- `interagency/prompts/2026-03-05_a_rai-f4-11_incident-ops.md` [DONE]
  - Отчёт: `interagency/reports/2026-03-05_a_rai-f4-11_incident-ops.md` [APPROVED]
  - Статус: DONE. SystemIncident (Prisma), IncidentOpsService (logIncident, getIncidentsFeed), PII_LEAK в SensitiveDataFilterService при mask(..., context); jest 12/12 PASS. [APPROVED]

- `interagency/prompts/2026-03-05_a_rai-f4-12_performance-metrics.md` [DONE]
  - Отчёт: `interagency/reports/2026-03-05_a_rai-f4-12_performance-metrics.md` [APPROVED]
  - Статус: DONE. PerformanceMetric (Prisma), PerformanceMetricsService (recordLatency, recordError, getAggregatedMetrics), QueueMetricsService (recordQueueSize, getQueueMetrics stub); tsc PASS, jest 150/150 rai-chat PASS.

- `interagency/prompts/2026-03-05_a_rai-f4-13_cost-workload-hotspots.md` [DONE]
  - Отчёт: `interagency/reports/2026-03-05_a_rai-f4-13_cost-workload-hotspots.md` [APPROVED]
  - Статус: DONE. CostAnalyticsService (getTenantCost, getHotspots по TraceSummary), рейты $2.5/1M input, $10/1M output; GET /rai/explainability/cost-hotspots; tenant isolation; tsc PASS, jest 3/3 cost-analytics + explainability-panel PASS.

- `interagency/prompts/2026-03-05_a_rai-f4-14_connection-map-critical-path.md` [DONE]
  - Отчёт: `interagency/reports/2026-03-05_a_rai-f4-14_connection-map-critical-path.md` [APPROVED]
  - Статус: DONE. TraceTopologyService (граф из AiAuditEntry + TraceSummary, critical path = самая длинная ветка), GET /rai/explainability/trace/:traceId/topology, tenant isolation; tsc PASS, jest PASS.

- `interagency/prompts/2026-03-05_a_rai-f4-15_safe-replay-trace.md` [READY_FOR_REVIEW]
  - Отчёт: `interagency/reports/2026-03-05_a_rai-f4-15_safe-replay-trace.md` [READY_FOR_REVIEW]
  - Статус: DONE. replayMode в RaiToolActorContext; RaiToolsRegistry мокает WRITE при replayMode; SupervisorAgent options.replayMode, сохранение replayInput в AiAuditEntry; SafeReplayService + POST /rai/explainability/trace/:traceId/replay (ADMIN); tsc PASS, jest 16 (registry+safe-replay) PASS.

- `interagency/prompts/2026-03-05_a_rai-f4-16_agent-configurator.md` [ACTIVE]
  - Описание: Agent Configurator API (создание, настройка и привязка Capabilities к агентам через БД).

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

- `interagency/prompts/2026-03-03_tm-2_dag-validation.md` [DONE]
  - План: `interagency/plans/2026-03-03_tm-2_dag-validation.md` [ACCEPTED]
  - Отчёт: `interagency/reports/2026-03-03_tm-2_dag-validation.md` [APPROVED]
  - Decision-ID: AG-TM-DAG-002 [зарегистрирован в DECISIONS.log]
  - Мастер-чеклист: `docs/00_STRATEGY/TECHMAP/TECHMAP_IMPLEMENTATION_CHECKLIST.md`
  - Технический базис: `docs/00_STRATEGY/TECHMAP/GRAND_SYNTHESIS.md` §3
  - Статус: DONE. `DAGValidationService`, `TechMapValidationEngine`, `TankMixCompatibilityService` и 3 калькулятора реализованы; `tsc` PASS, 24/24 тестов PASS.

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
