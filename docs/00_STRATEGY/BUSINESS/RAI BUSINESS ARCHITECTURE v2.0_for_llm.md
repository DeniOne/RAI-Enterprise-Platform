# RAI BUSINESS ARCHITECTURE v2.0 (LLM Structured)

Статус: структурированная версия для внешних LLM
Источник: фактическая реализация `RAI_EP` (код + структура)
Дата: 2026-02-23

## 1. System Snapshot

| Поле | Значение |
|---|---|
| System Name | `RAI_EP` |
| Core Type | Multi-tenant, event-driven agro-operations platform |
| Main Runtime | `NestJS` (`apps/api`) |
| Data Model | `Prisma` (`packages/prisma-client/schema.prisma`) |
| Field Interface | `apps/telegram-bot` |
| Web Interface | `apps/web` |
| AI Mode | Advisory only (human final decision) |

## 2. Domain Contours (Relative Mapping)

| Контур | Основные модули | Ключевые сущности | Выход контура |
|---|---|---|---|
| Production | `season`, `agro-orchestrator`, `tech-map`, `task` | `Season`, `TechMap`, `Task` | Управляемое исполнение операций |
| Evidence & Integrity | `field-observation`, `integrity`, `cmr` | `FieldObservation`, `DeviationReview`, `CmrRisk`, `SoilMetric` | Доказанные/эскалированные факты |
| Risk & Decision | `risk`, `consulting`, `strategic` | `RiskSignal`, `RiskAssessment`, `DecisionRecord` | Разрешение/блокировка действий |
| Finance & Economy | `finance-economy` | `EconomicEvent`, `LedgerEntry`, `Budget*`, `Cash*` | Финансовое признание и контроль |
| AI Advisory | `advisory`, `shared/memory/shadow-advisory` | Audit-log traces, recommendations | Рекомендации + human feedback |
| Governance & Safety | `tenant-context`, `audit`, `outbox`, invariant services | `AuditLog`, `OutboxMessage`, tenant state | Изоляция, трассировка, отказоустойчивость |

## 3. End-to-End Business Flow (Executable Semantics)

| Шаг | Input | Processing | Output | Blocking Conditions |
|---|---|---|---|---|
| 1. Harvest plan creation | Client context + plan DTO | `ConsultingService.createPlan` | `HarvestPlan(DRAFT)` | Tenant mismatch / auth failure |
| 2. Plan transition | Plan ID + target status | FSM + role guards + domain rules | Updated plan status | Invalid transition / role forbidden |
| 3. TechMap generation | `harvestPlanId`, `seasonId` | `TechMapService.generateMap` + versioning | `TechMap(DRAFT)` | Plan-season tenant mismatch |
| 4. TechMap activation | Map ID + `ACTIVE` target | Admission checks (`IntegrityGate`) | Active map linked to plan | Missing machinery/stock, quorum/risk block |
| 5. Task generation | `seasonId` | Idempotent mapping op->task | Set of `Task(PENDING)` | Season locked/completed |
| 6. Task execution | Task event (`START/COMPLETE/...`) | `TaskStateMachine` + optimistic update | Updated task + outbox event | Invalid state, concurrent conflict |
| 7. Observation ingestion | Text/photo/voice/geo/metrics | `FieldObservationService` + async integrity processing | Stored observation + side-effects | Invalid payload/context |
| 8. Integrity causal loops | Observation intent/evidence | Incident/confirmation/delay/measurement handlers | Deviation/risk/asset state updates | Policy violation |
| 9. Economy ingest | Task/HR/etc finance event | Idempotency + contract validation + ledger posting | `EconomicEvent` + `LedgerEntry` + outbox | Balance/integrity failure, tenant panic mode |
| 10. Advisory cycle | Shadow recommendation trace | Human accept/reject/feedback | Decision log + tuning signal | Pilot off / rollout stage S0 / kill-switch |

## 4. Relative Module Contracts

| Module | Primary Responsibility | Upstream Dependencies | Downstream Dependencies |
|---|---|---|---|
| `consulting` | Harvest plan lifecycle, strategic/management endpoints | auth, prisma, cmr decisions | tech-map, budget/execution, KPI |
| `tech-map` | Tech map versioning and activation | consulting entities, integrity gate | task generation/execution |
| `task` | Execution state machine + completion events | tech-map/season, fsm policy | outbox, finance integration |
| `field-observation` | Observation intake | auth + prisma | integrity gate + shadow advisory |
| `integrity` | Admission, causal loops, evidence policy | observations, cmr, quorum | risks, deviation threads, asset activation |
| `risk` | Risk assessment aggregation | risk engine collectors | orchestrator/action gates |
| `finance-economy` | Economic ingest, ledger, budgets, liquidity | integration contracts | OFS dashboard, management analytics |
| `advisory` | Human-supervised recommendation lifecycle | shadow logs/audit | decisions, feedback learning signals |
| `tenant-context` | company scope propagation | auth user context | prisma query filtering |
| `audit` | tamper-evident action log | all critical services | compliance, advisory metrics |
| `outbox` | event contractized emission | transactional services | async consumers/integration workflows |

## 5. Entity Relation Table (High-Signal)

| Entity | Parent/Context | Core Links | Functional Role |
|---|---|---|---|
| `HarvestPlan` | `Company` | `TechMap`, `HarvestResult`, `PerformanceContract` | План результата и верхний жизненный цикл |
| `TechMap` | `HarvestPlan`, `Season` | `MapStage`, `MapOperation`, `MapResource` | Эталон исполнения |
| `Task` | `Season`, `TechMap operation` | `TaskResourceActual`, `FieldObservation` | Исполнимая атомарная операция |
| `FieldObservation` | `Task/Field/Season` | `DeviationReview`, integrity handlers | Факт-доказательство с intent |
| `CmrRisk` | `Season/Observation/Task` | decisions/quorum | Регистр управленческих рисков |
| `EconomicEvent` | `Company` | `LedgerEntry`, outbox finance event | Финансовый факт ingest-уровня |
| `LedgerEntry` | `EconomicEvent` | account/balance projections | Бухгалтерская проекция |
| `AuditLog` | `Company + Actor` | advisory, governance, compliance | Неизменяемый след действий |
| `OutboxMessage` | Aggregate event | external handlers | Гарантированная публикация событий |

## 6. FSM Reference Table

| FSM | States (short) | Controlled by | Extra Guards |
|---|---|---|---|
| HarvestPlan FSM | `DRAFT -> REVIEW -> APPROVED -> ACTIVE -> DONE -> ARCHIVE` | `ConsultingService` | RBAC + domain activation/archive rules |
| TechMap FSM | `DRAFT/REVIEW/.../ACTIVE/ARCHIVED` | `TechMapService` | Integrity admission + active uniqueness |
| Task FSM | `PENDING -> IN_PROGRESS -> COMPLETED/CANCELLED` | `TaskService` | season lock checks + optimistic conflict handling |
| Season APL FSM | 16 agronomic stages | `AgroOrchestratorService` | risk gate before transition |

## 7. Integrity Causal Loop Table

| Trigger (Observation Intent) | Mandatory Action | Side Effects |
|---|---|---|
| `INCIDENT` / `CALL` | create `DeviationReview` | link observation, open consulting thread |
| `CONFIRMATION` | asset activation flow | machinery/stock switch `PENDING_CONFIRMATION -> ACTIVE` |
| `DELAY` | strategic loop placeholder | escalation path for management decisions |
| `MONITORING` + measurement | soil metric/trust flow | verification status, drift queue trigger |
| weak/no evidence | negative contour | create operational/regulatory `CmrRisk` |

## 8. Finance Reliability Table

| Mechanism | Implementation Signal | Purpose |
|---|---|---|
| Idempotency | `idempotencyKey`, `replayKey` in ingest | Prevent duplicate economic facts |
| Contract Compatibility | version checks in ingest metadata | Enforce cross-module event compatibility |
| Ledger Balance Control | journal policy + balanced postings assertion | Prevent inconsistent accounting projections |
| Tenant RLS context | session set_config for company in tx | Isolation at SQL/runtime level |
| Panic/Isolation Mode | tenant mode switch on integrity failure | Stop damage propagation |
| Outbox emission | `finance.economic_event.created` | Reliable downstream delivery |

## 9. AI Advisory Governance Table

| Feature | Current Behavior |
|---|---|
| Recommendation generation | Shadow mode evaluation with explainability |
| User-facing decision | Explicit `accept/reject` only |
| Feedback loop | `reason/outcome` recorded and queryable |
| Pilot scope | Company-level and user-level toggles |
| Rollout strategy | Stage-based (`S0..S4`) promotion/rollback |
| Safety override | `kill-switch` enable/disable |
| Final authority | Human role, not AI |

## 10. Security & Isolation Table

| Control | Layer | Practical Effect |
|---|---|---|
| JWT/Auth guards | API boundary | Only authenticated actors hit domain logic |
| TenantContext interceptor | Request context | Company scope attached per request |
| Prisma tenant extension | Data access | Automatic `companyId` injection/guarding |
| Audit signatures | Governance | Tamper-evident action log |
| Throttling | Platform | Baseline API abuse control |
| Outbox contract gate | Integration | No event without required tenant contract |

## 11. Gaps Table (v1.0 Theory vs Real Runtime)

| Gap Type | What Exists | What Is Missing / Immature |
|---|---|---|
| UI Depth | Multiple contour routes in web app | Many pages still placeholder-level |
| Trading/Production Holding Scope | Some related entities exist | Less operational depth than consulting/execution/finance |
| End-user Process Completeness | Strong backend invariants | Not all role journeys equally productized |

## 12. LLM Prompt Context Block (Ready to reuse)

Use this summary when starting analysis in another chat:

- `RAI_EP` is a multi-tenant event-driven agro-operations platform.
- Core execution chain: `HarvestPlan FSM -> TechMap Admission/FSM -> Task FSM -> FieldObservation + Integrity Causal Loops -> Economy Ingest + Ledger`.
- AI is advisory-only with human final decision, staged rollout, and kill-switch.
- Governance is first-class: tenant isolation, tamper-evident audit, outbox-based eventing, risk and integrity hard gates.
- Financial layer is reliability-focused (idempotency, replay protection, balanced entries, tenant panic isolation), not just BI reporting.

