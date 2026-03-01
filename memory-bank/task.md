# Task: RAI_EP

## Sprint Gamma 1 (Infrastructure) ✅
- [x] K8s Setup
- [x] Secrets Management
- [x] Trace ID Propagation

## Sprint Gamma 2 (Baseline II) ✅
- [x] Knowledge Graph MVP
- [x] Vision AI Baseline
- [x] Satellite Ingestion

## Consulting Expansion (Phase Gamma) ✅

### Track 1: TechMap Integration & Integrity ✅
- [x] [DB] Enforced PostgreSQL Partial Unique Index for ACTIVE TechMaps.

### Track 2: Budget Vertical Slice (Financial Control) ✅
- [x] **Backend**: BudgetPlan/BudgetItem CRUD with versioning.
- [x] **Financial Gate**: HarvestPlan activation lock.

### Track 3: Advisory Engine (Executive Intelligence) ✅
- [x] **Analytics**: Health/Volatility Index.
- [x] **Trend Analysis**: 30-day window metrics.

### Track 5: Yield & KPI Engineering ✅
- [x] **Backend Hardening**: implementation of `YieldOrchestrator` and `HarvestResultRepository`.
- [x] **Deterministic KPI**: added financial snapshotting (actual costs, budget version) to `HarvestResult`.
- [x] **API Integration**: created `ConsultingController` endpoints for yield recording and KPI retrieval.
- [x] **Frontend (Yield)**: developed `yield/page.tsx` with production form and active plan selection.
- [x] **Frontend (KPI)**: integrated `KpiCard` into `plans/page.tsx` for real-time ROI/Yield visualization.
- [x] **Verification**: implemented unit tests for orchestration logic and fixed type stability issues.

## UI Refactoring & Design System Consolidation (Milestone 43) ✅
- [x] **View/Edit Engine**: `EditModeProvider` + `DataField`.
- [x] **Tabular Scaling**: CRUD via Drawers/SidePanel.
- [x] **Completeness Scoring**: Visual indicators for audit readiness.
- [x] **Design System v2.0**: Unified master doc.

## Sprint Gamma 3: Cognitive Memory ✅
- [x] Episodic Retrieval Service
- [x] Positive/Negative Engrams
- [x] Shadow Advisory Logic

## Sprint Gamma 4: Explainability & UX ✅
- [x] Explainability v2
- [x] Telegram Recommendation Cards
- [x] Web Recommendation Panel

## Sprint Gamma 5: Pilot & Tuning ✅
- [x] Incident Runbook
- [x] Pilot Activation (Cohort 1)
- [x] Ranking Tuning

## Sprint Gamma 6: Hardening & Go-Live ✅
- [x] Canary Rollout Protocol
- [x] Load & Stress Campaign
- [x] Go-Live (S3 50%)

## Level E: Contract-Driven Regenerative Engine ✅ <!-- id: 12 -->
- [x] **Governance (I41)**: Seasonal/Multi-Year/Managed contract mapping <!-- id: 12.1 -->
- [x] **MOS Evolution**: Dynamic weights gated to MANAGED mode <!-- id: 12.2 -->
- [x] **Risk Matrix (R1-R4)**: P05 Tail Risk calculation for Soil/Bio <!-- id: 12.3 -->
- [x] **Escalation (I34)**: Delegated Authority locks + Committee alerts <!-- id: 12.4 -->
- [x] **Audit Trait**: Liability tagging (CONSULTANT_ONLY for Managed) <!-- id: 12.5 -->
- [x] **Safety Audit**: Strictly gated optimization logic <!-- id: 12.6 -->
- [x] **Walkthrough**: Final proof-of-work delivered <!-- id: 12.7 -->

## Sprint Gamma 7: Stabilization & Exit (Complete) 🚀
- [x] S7.PLAN1 Sprint 7 checklist created
- [x] S7.PLAN2 Sprint index updated
- [x] **Phase 5 (Cash Flow Engine) Hardening & Integration** ✅
- [x] S7.WP1 S4 Observability Sweep
- [x] S7.WP6 Gamma Exit Packet Drafting

---
**ИТОГ:** Основные функциональные треки Фаз 1-5 успешно завершены и архитектурно закреплены.

## Экстренное исправление: Ошибка запуска Telegram Bot (P0) ✅ <!-- id: 9 -->
- [x] **Изоляция бота от Prisma**: Полное удаление прямой зависимости бота от БД <!-- id: 9.1 -->
  - [x] Исправление backend API (опциональный companyId для рассылок) <!-- id: 9.1.1 -->
  - [x] Рефакторинг `BotInternalController` на использование `ApiClient` <!-- id: 9.1.2 -->
  - [x] Удаление `PrismaModule` и `PrismaService` из кода бота <!-- id: 9.1.3 -->
  - [x] Верификация успешного запуска бота в watch mode <!-- id: 9.1.4 -->

## Экстренное исправление: Ошибка сверки леджера (MISSING_LEDGER_ENTRIES) ✅ <!-- id: 10 -->
- [x] **Settlement Guard**: Запрет создания расчетных событий без проводок <!-- id: 10.1 -->
- [x] **Idempotency Recovery**: Автоматическое восстановление проводок при повторе события-фантома <!-- id: 10.2 -->
- [x] **Reconciliation Telemetry**: Добавление метаданных (`replayKey`) в алерты сверки <!-- id: 10.3 -->
- [x] **Verification**: Проверка правил аттрибуции и стресс-тест под нагрузкой <!-- id: 10.4 -->

## Level C: Industrial-Grade Contradiction Engine ✅ <!-- id: 11 -->
- [x] **Persistence (I31)**: GovernanceConfig, DivergenceRecord, OVERRIDE_ANALYSIS enum <!-- id: 11.1 -->
- [x] **DivergenceTracker (I31)**: SHA256 idempotencyKey, RFC 8785, Prisma.$transaction <!-- id: 11.2 -->
- [x] **OverrideRiskAnalyzer (I29)**: ΔRisk, defensive fallback, Hash Pipeline <!-- id: 11.3 -->
- [x] **CounterfactualEngine (I30)**: Deterministic simulation, roundHalfToEven(8) <!-- id: 11.4 -->
- [x] **ConflictMatrix (I29)**: DIS formula, Zero-Denominator Safeguard <!-- id: 11.5 -->
- [x] **Explainability (I32)**: ACCEPT/REVIEW/REJECT recommendations <!-- id: 11.6 -->
- [x] **FSM Governance Guard (I33)**: DivergenceRecord gate + DIS > 0.7 justification <!-- id: 11.7 -->
- [x] **Industrial Guardrails**: 1000-run determinism, policy chaos, drift detection <!-- id: 11.8 -->
- [x] **E2E Override Pipeline**: Full cycle verified (7 тестов) <!-- id: 11.9 -->
- [x] **Total: 50 тестов PASS** <!-- id: 11.10 -->

## Level F: Industry Cognitive Standard (Trust Infrastructure) 🚀 <!-- id: 13 -->
- [x] **01_ARCHITECTURE** <!-- id: 13.1 -->
  - [x] `LEVEL_F_CONCEPT.md` (Hardened v2)
  - [x] `LEVEL_F_COMPOSITION.md`
  - [x] `LEVEL_F_INVARIANTS.md` (Hardened v2)
  - [x] `LEVEL_F_DATA_MODEL.md` (Hardened v2)
  - [x] `LEVEL_F_TRUST_MODEL.md`
- [x] **02_DOMAINS** <!-- id: 13.2 -->
  - [x] `F_CERTIFICATION_MODEL.md` (Hardened v2)
  - [x] `F_FARM_RATING_MODEL.md` (Hardened v2)
  - [x] `F_INSURANCE_INTERFACE.md`
  - [x] `F_FINANCIAL_SIGNAL_MODEL.md`
- [x] **03_PRODUCT** <!-- id: 13.3 -->
  - [x] `LEVEL_F_PRODUCT_OVERVIEW.md`
  - [x] `LEVEL_F_API_SPEC.md`
  - [x] `LEVEL_F_EXPLAINABILITY.md`
- [x] **04_ENGINEERING** <!-- id: 13.4 -->
  - [x] `F_SNAPSHOTTER_ARCH.md`
  - [x] `F_RATING_ENGINE_ARCH.md`
  - [x] `F_CERT_ENGINE_ARCH.md`
  - [x] `F_INSURANCE_API_ARCH.md`
  - [x] `F_SECURITY_MODEL.md` (Hardened v2)
- [x] **06_METRICS** <!-- id: 13.5 -->
  - [x] `F_SUCCESS_METRICS.md`
  - [x] `F_RISK_MONITORING.md`
- [x] **07_EXECUTION** <!-- id: 13.6 -->
  - [x] `DELTA_ROADMAP.md`
  - [x] `DELTA_ROLLOUT_PLAN.md`
  - [x] `DELTA_GOVERNANCE_APPROVAL.md`

## Institutional Frontend Phase 4: Deterministic Impact Engine ✅ <!-- id: 14 -->
- [x] **Snapshot Hashing (I30)**: RFC8785 Canonical Serialization + SHA-256 <!-- id: 14.1 -->
- [x] **Deterministic Graph**: Lexicographical BFS for escalation paths (Invariant-4.3) <!-- id: 14.2 -->
- [x] **FSM Hardening**: Mandatory re-analysis cycle after conflict resolution <!-- id: 14.3 -->
- [x] **UI Verification**: Evidence of hardening (hash display) in `GovernanceTestButton` <!-- id: 14.4 -->
- [x] **Replay Integrity**: `InstitutionalReplay.test.ts` verified (10/10 Grade) <!-- id: 14.5 -->

## Frontend Menu Workstream: Управление Урожаем - COMPLETE (MVP)
- [x] Documented button behavior and UX contract in docs/10_FRONTEND_MENU_IMPLEMENTATION/01_MENU_Управление_Урожаем.md
- [x] Implemented live dashboard interactions and deep-link navigation
- [x] Implemented smart routing with entity highlighting on target pages
- [x] Added reusable hook useEntityFocus for cross-page consistency
- [ ] Production-ready debt remains per checklist: real API metrics, text encoding cleanup, E2E route test

## Frontend Menu Workstream: CRM Counterparties Button - COMPLETE (MVP)
- [x] Created and filled doc by template (PROMPT_BUTTON_SCREEN_TEMPLATE)
- [x] Implemented click routes on CRM dashboard and target sub-pages
- [x] Implemented loading/empty/error/permission states
- [x] Implemented smart routing ?entity=... with highlight + auto-scroll
- [x] Added executive block: latest 5 added counterparties
- [ ] Production-ready debt: e2e route scenario, encoding cleanup, full API metrics

## Frontend Menu Workstream: CRM Counterparties Button - PRODUCTION CLOSURE COMPLETE
- [x] Upgraded to full CRM management screen (not informational only)
- [x] Implemented hierarchy actions for `Holding` and `Legal Entity`
- [x] Added backend APIs `GET /crm/accounts/:id/workspace` and `PATCH /crm/accounts/:id`
- [x] Added registry filters (`type`, `status`, `risk`, `responsible`)
- [x] Added card tabs + CRUD for contacts/interactions/obligations
- [x] Added responsible picker from company users directory
- [x] Added backend freeze-guard validation and API test coverage
- [x] Synced production docs/checklists to DONE status


## Institutional Commerce Core (Execution) ✅
- [x] Prisma models introduced with `Commerce*` side-by-side isolation from legacy CRM `Contract`/`Obligation`.
- [x] Tenant isolation enforced for new models via Prisma tenant middleware.
- [x] Services implemented: intercompany check, contract orchestration, fulfillment processing, billing/posting/payment confirmation.
- [x] DTOs and controller endpoints implemented for operational workflow.
- [x] Runtime E2E test implemented and passing.
- [x] Migration status aligned and deployed on dev environment.
- [x] **Remote UI Access (2026-02-28): CANCELLED**
    - [x] Анализ вариантов (ngrok, pinggy, localhost.run, cloudflared)
    - [x] Попытки настройки (заблокировано сетевыми фильтрами клиента)
    - [x] Остановка процессов туннелирования

## Sprint Gamma 8: Agro Domain Controller MVP (Institutional Lock-In) 🚀
- [x] **Data Model & Invariants** <!-- id: 15.1 -->
    - [x] Внедрить `status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED'` в `FieldOperationPayload` <!-- id: 15.1.1 -->
    - [x] Запретить альтернативные флаги (completed=true и т.д.) <!-- id: 15.1.2 -->
- [x] **Controller Integration** <!-- id: 15.2 -->
    - [x] Расширить `ControllerMetricsService.handleCommittedEvent` <!-- id: 15.2.1 -->
    - [x] Реализовать фильтрацию: `FIELD_OPERATION` + `COMPLETED` + `taskRef` <!-- id: 15.2.2 -->
    - [x] Реализовать получение `plannedEnd` из `MapOperation` (TechMapTask) через Prisma <!-- id: 15.2.3 -->
    - [x] Вычислить `delayDays` (floor diff) <!-- id: 15.2.4 -->
- [x] **Metric Result & Severity** <!-- id: 15.3 -->
    - [x] Создать тип `MetricResult` согласно канону <!-- id: 15.3.1 -->
    - [x] Интегрировать `DeviationPolicy` (без хардкода) <!-- id: 15.3.2 -->
    - [x] Определить `severity` (S1-S4) <!-- id: 15.3.3 -->
- [x] **Escalation Layer** <!-- id: 15.4 -->
    - [x] Добавить модель `AgroEscalation` в Prisma schema <!-- id: 15.4.1 -->
    - [x] Реализовать сервис эскалации <!-- id: 15.4.2 -->
    - [x] Реализовать авто-эскалацию при `severity >= policy.escalateAt` (S3/S4) <!-- id: 15.4.3 -->
- [x] **Bot Feedback** <!-- id: 15.5 -->
    - [x] Добавить в Telegram logic уведомление о срывах сроков при подтверждении (`confirm`) <!-- id: 15.5.1 -->
- [x] **Test Suite** <!-- id: 15.6 -->
    - [x] Test 1: Confirm -> CommittedEvent <!-- id: 15.6.1 -->
    - [x] Test 2: Controller COMPLETED -> delay calculation <!-- id: 15.6.2 -->
    - [x] Test 3: Delay = 4 -> severity S3 <!-- id: 15.6.3 -->
    - [x] Test 4: S3 -> AgroEscalation entry <!-- id: 15.6.4 -->
    - [x] Test 5: Delay = 1 -> severity S2 (no escalation) <!-- id: 15.6.5 -->

## Экстренное исправление: Изоляция инфраструктурных сервисов (P0) [x] <!-- id: 16 -->
- [x] Ограничение привязки портов Redis (6379) до localhost <!-- id: 16.1 -->
- [x] Ограничение привязки портов PostgreSQL (5432) до localhost <!-- id: 16.2 -->
- [x] Ограничение привязки портов Minio (9000, 9001) до localhost <!-- id: 16.3 -->
- [x] Ограничение привязки портов pgAdmin (8081) до localhost <!-- id: 16.4 -->
- [x] Перезапуск контейнеров и верификация сетевых слушателей (ss -tlnp) <!-- id: 16.5 -->
