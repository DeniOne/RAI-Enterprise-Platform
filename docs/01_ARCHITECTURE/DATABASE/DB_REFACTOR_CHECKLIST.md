---
id: DOC-ARC-DATABASE-DB-REFACTOR-CHECKLIST-O6U4
layer: Architecture
type: HLD
status: draft
version: 0.1.0
---
# DB_REFACTOR_CHECKLIST

## Purpose

Это исполнимый checklist полного DB-refactoring program.
Он должен использоваться как operational control list, а не как обзорный документ.

Жесткие правила программы:
- не делать physical split до завершения логической очистки;
- не делать destructive rename `companyId -> tenantId` в ранних фазах;
- не тащить `MG-Core` в active runtime как второй source of truth;
- не выпускать migration wave без закрытых phase gates.

## Sync Discipline (Mandatory)

После закрытия каждой логической задачи обязательно синхронизировать:
- этот checklist (`DB_REFACTOR_CHECKLIST.md`);
- phase-status файл (`DB_PHASE_0_STATUS.md` или соответствующий фазе);
- зависимые файлы (ADR, manifest, policy, roadmap, proposal, CI workflow);
- `memory-bank/activeContext.md`;
- `memory-bank/progress.md`.

Без этой синхронизации задача считается незакрытой, даже если код/док уже изменены.

### Canonical precedence on conflict (mandatory)

Если документы расходятся, канонический порядок истины:
1. `manifest/policy` (`MODEL_SCOPE_MANIFEST`, `DOMAIN_OWNERSHIP_MANIFEST`, runtime policies, ADR)
2. `phase status` (`DB_PHASE_N_STATUS.md`)
3. `checklist` (`DB_REFACTOR_CHECKLIST.md`)
4. `roadmap` (`DB_REFACTOR_ROADMAP.md`)

Правило применения:
- сначала исправляется документ более высокого приоритета;
- затем lower-priority документы синхронизируются в том же change-set;
- merge запрещён, если precedence-chain остается в конфликте.

### Execution packet companion artifacts (mandatory set)

- [x] `DB_PHASE_0_STATUS.md`
- [x] `DB_PHASE_1_STATUS.md`
- [x] `DB_PHASE_2_STATUS.md ... DB_PHASE_8_STATUS.md`
- [x] `DB_TENANCY_TRANSITION_RUNTIME_POLICY.md`
- [x] `TRANSITION_RUNTIME_POLICY.md` (compatibility alias)
- [x] `READ_MODEL_POLICY.md`
- [x] `DB_PROJECTION_REGISTER.md`
- [x] `DB_SUCCESS_METRICS.md`
- [x] `ENUM_DECISION_REGISTER.md`
- [x] `DB_INDEX_EVIDENCE_REGISTER.md`
- [x] `DB_OPERATIONAL_AGGREGATE_MIGRATION_WAVES.md`
- [x] `DB_PHYSICAL_SPLIT_DECISION.md`
- [x] `MODEL_SCOPE_MANIFEST.md`
- [x] `DOMAIN_OWNERSHIP_MANIFEST.md`

---

## Phase 0. Governance Before Schema

### Goal
Остановить архитектурный дрейф до начала миграций и schema changes.

### Checklist
- [x] Утвердить `ADR_DB_001_TENANT_VS_COMPANY_BOUNDARY.md`.
- [x] Утвердить `ADR_DB_002_SCHEMA_FRAGMENTATION_AND_OWNERSHIP.md`.
- [x] Утвердить `ADR_DB_003_ENUM_GOVERNANCE.md`.
- [x] Утвердить `ADR_DB_004_READ_MODELS_AND_PROJECTIONS.md`.
- [x] Утвердить `ADR_DB_005_INDEX_AND_QUERY_GOVERNANCE.md`.
- [x] Заполнить `MODEL_SCOPE_MANIFEST.md` для всех high-risk моделей.
- [x] Заполнить `DOMAIN_OWNERSHIP_MANIFEST.md` для всех current contour моделей.
- [x] Утвердить `READ_MODEL_POLICY.md`.
- [x] Утвердить `DB_SUCCESS_METRICS.md`.
- [x] Зафиксировать 8 верхнеуровневых доменов как единственный top-level ownership set.
- [x] Зафиксировать `knowledge_memory` как `ai_runtime` subcontour.
- [x] Зафиксировать `risk_governance` как `ai_runtime` subcontour.
- [x] Зафиксировать `research_rd` как `quarantine/sandbox contour`.
- [x] Зафиксировать архитектурные запреты:
- [x] Новые модели нельзя root-ить в `Company` по умолчанию.
- [x] Новые cross-domain relations запрещены без ADR.
- [x] `companyId = NULL` запрещён как universal global scope.
- [x] `JSONB` запрещён как замена отсутствующей модели.
- [x] Read models запрещены как source of truth.
- [x] Исправить конфликт классификации `EventConsumption` в runtime policy.
- [x] Добавить CI-check на model scope manifest.
- [x] Добавить CI-check на domain ownership manifest.
- [x] Добавить CI-check на forbidden cross-domain relations.
- [x] Добавить CI-check на enum growth budget.
- [x] Добавить CI-check на duplicate/weak index patterns.
- [x] Добавить CI-check на heavy Prisma include trees.

### Phase gate
- [x] Все high-risk модели имеют manifest classification.
- [x] Все новые schema changes блокируются без manifest + ownership.
- [x] `EventConsumption` больше не имеет conflicting scope semantics.

---

## Phase 1. Additive Tenancy In Control-Plane

### Goal
Ввести настоящий platform boundary без удара по core business aggregates.

### Checklist
- [x] Спроектировать Prisma-модель `Tenant`.
- [x] Спроектировать Prisma-модель `TenantCompanyBinding`.
- [x] Утвердить dual-key policy: `tenantId` + `companyId`.
- [x] Утвердить transition runtime policy.
- [x] Обновить auth/runtime contract так, чтобы context держал `tenantId`, `companyId`, `isSystem`.
- [x] Добавить additive `tenantId` в `TenantState`.
- [x] Добавить additive `tenantId` в `AgentConfiguration`.
- [x] Добавить additive `tenantId` в `AgentCapabilityBinding`.
- [x] Добавить additive `tenantId` в `AgentToolBinding`.
- [x] Добавить additive `tenantId` в `AgentConnectorBinding`.
- [x] Добавить additive `tenantId` в `AgentConfigChangeRequest`.
- [x] Добавить additive `tenantId` в `RuntimeGovernanceEvent`.
- [x] Добавить additive `tenantId` в `SystemIncident`.
- [x] Добавить additive `tenantId` в `IncidentRunbookExecution`.
- [x] Добавить additive `tenantId` в `PendingAction`.
- [x] Добавить additive `tenantId` в `PerformanceMetric`.
- [x] Добавить additive `tenantId` в `EvalRun`.
- [x] Добавить additive `tenantId` в `EventConsumption`.
- [x] Добавить additive `tenantId` в `MemoryInteraction`.
- [x] Добавить additive `tenantId` в `MemoryEpisode`.
- [x] Добавить additive `tenantId` в `MemoryProfile`.
- [x] Включить shadow-write для новых `tenantId` полей.
- [x] Включить shadow-read для новых `tenantId` query paths.
- [x] Включить mismatch logging между `tenantId` и `companyId -> tenant` mapping.
- [x] Добавить alerts на tenant/company drift.
- [x] Сохранить feature-flagged fallback на `companyId`-only isolation.
- [x] Не трогать destructively `Season`, `TechMap`, `HarvestPlan`, `Task`, `EconomicEvent`, `LedgerEntry`, `Party`, `CommerceContract`.

### Phase gate
- [x] `Tenant` и `TenantCompanyBinding` добавлены additive-first.
- [x] Control-plane contour получил `tenantId` без destructive change.
- [x] Runtime поддерживает dual-key context.
- [x] Shadow mode и mismatch logging работают.

---

## Phase 2. Company De-Rooting

### Goal
Убрать `Company` из роли глобального relation hub.

### Baseline and target (фиксируются до старта фазы)

- Baseline direct relations у `Company` (2026-03-13): `140`.
- Phase 2 target direct relations у `Company`: `<= 95`.
- Допустимый `business/legal core` relation set:
- `accounts/holdings/users/invitations/counterparty bindings`
- `legal/compliance/regulatory ownership surface`
- `party/contract/business ownership references`
- `tenant transition bridge` (`tenantCompanyBindings`, `tenantStates`) на период migration
- Все остальные relation groups считаются кандидатом на de-rooting/projection seam.

### Checklist
- [x] Зафиксировать целевой минимальный core graph `Company`.
- [x] Выделить relation edges `Company`, которые являются business/legal semantics.
- [x] Выделить relation edges `Company`, которые являются tenant-noise.
- [x] Выделить relation edges `Company`, которые должны уйти в projections/read models.
- [x] Выделить relation edges `Company`, которые должны уйти в indirect ownership.
- [x] Убрать root-роль `Company` из AI/runtime tables.
- [x] Убрать root-роль `Company` из integration/control tables.
- [x] Убрать root-роль `Company` из memory/knowledge control-plane.
- [x] Подготовить staged deprecation plan для лишних `Company` relations.
- [x] Подготовить compatibility read paths для сервисов, читающих через `Company` graph.
- [x] Снизить число direct relations у `Company` по зафиксированной метрике.

### Phase gate
- [x] `Company` больше не является platform root.
- [x] Новые модели не добавляют direct relation в `Company` без ADR.
- [x] `Company` relation graph сокращён до business/legal core.
- [x] Зафиксирована метрика `140 -> <=95` с evidence в phase status.

---

## Phase 3. Domain Fragmentation

### Goal
Разбить schema monolith логически по ownership domains без physical split.

### Checklist
- [x] Подготовить `schema.compose.ts` или эквивалентный compose-script.
- [x] Создать `00_base.prisma`.
- [x] Создать `01_platform_core.prisma`.
- [x] Создать `02_org_legal.prisma`.
- [x] Создать `03_agri_planning.prisma`.
- [x] Создать `04_agri_execution.prisma`.
- [x] Создать `05_finance.prisma`.
- [x] Создать `06_crm_commerce.prisma`.
- [x] Создать `07_ai_runtime.prisma`.
- [x] Создать `08_integration_reliability.prisma`.
- [x] Создать `09_quarantine_sandbox.prisma`.
- [x] Создать `10_legacy_bridge.prisma`.
- [x] Разнести модели по fragments по ownership manifest.
- [x] Разнести enum по fragments по ownership manifest.
- [x] Зафиксировать правила для shared primitives в `00_base.prisma`:
- [x] base ids / timestamps / common scalar conventions
- [x] cross-domain technical enums
- [x] shared audit primitives
- [x] common relation conventions
- [x] Проверить, что compose-процесс собирает идентичный functional `schema.prisma`.
- [x] Ввести review rule: изменения в fragment возможны только owner domain.
- [x] Ввести запрет на новые cross-domain relations без ADR.
- [x] Не дробить `knowledge_memory` и `risk_governance` в отдельные top-level fragments.
- [x] Не выводить `research_rd` из quarantine contour без отдельного ADR.

### Phase gate
- [x] Все current contour модели имеют owner fragment.
- [x] Compose process стабилен и проверяется в CI.
- [x] Fragmentation не изменила runtime semantics самопроизвольно.
- [x] `00_base.prisma` не превратился в mini-god-fragment (валидируется CI rule).

---

## Phase 4. Read Models / Projection Discipline

### Goal
Перевести тяжёлые cross-domain чтения на управляемые projections, не создавая второй мусорный слой данных.

### Checklist
- [x] Утвердить список allowed projection use-cases.
- [x] Для каждой projection заполнить metadata contract:
- [x] owner
- [x] source of truth
- [x] refresh SLA
- [x] refresh mechanism
- [x] deterministic rebuild
- [x] retention policy
- [x] staleness tolerance
- [x] deletion/reconciliation semantics
- [x] consumers
- [x] rollback strategy
- [x] Подготовить planning workspace projection.
- [x] Подготовить party workspace projection.
- [x] Подготовить front-office operator projection.
- [x] Подготовить runtime governance projection.
- [x] Запретить ad hoc projection tables без owner/rebuild contract.
- [x] Запретить projection как write model.
- [x] Измерить снижение сложности include-графов в hot services.

### Phase gate
- [x] Ни одна новая projection не создана без policy metadata.
- [x] Projection layer пересобираем детерминированно.
- [x] Projection layer не стал source of truth.

---

## Phase 5. Enum Taxonomy Cleanup

### Goal
Сделать enum cleanup taxonomy-driven, а не косметическим.

### Checklist
- [x] Классифицировать каждый enum в один класс:
- [x] `technical closed enum`
- [x] `FSM/status invariant enum`
- [x] `business evolving vocabulary`
- [x] `jurisdiction-sensitive vocabulary`
- [x] `tenant-customizable vocabulary`
- [x] `suspicious duplicate enum family`
- [x] Собрать overlap matrix по `risk-*`.
- [x] Собрать overlap matrix по `status-*`.
- [x] Собрать overlap matrix по `source-*`.
- [x] Собрать overlap matrix по `type-*`.
- [x] Собрать overlap matrix по `mode-*`.
- [x] Зафиксировать enum, которые остаются enum.
- [x] Зафиксировать enum, которые объединяются.
- [x] Зафиксировать enum, которые переименовываются.
- [x] Зафиксировать vocabulary, которые уходят в reference/config tables.
- [x] Исправить literal defects вроде `FERTILIZER` / `FERTILIZERS`.
- [x] Нормализовать risk/severity family.
- [x] Нормализовать source family.
- [x] Нормализовать mode family.
- [x] Сформировать `ENUM_DECISION_REGISTER.md` (keep/merge/rename/table/deprecate + owner + phase).

### Phase gate
- [x] У каждого enum есть taxonomy class.
- [x] Нет enum cleanup без owner domain approval.
- [x] Evolving vocabularies выведены из hardcoded enum path по плану.
- [x] Все спорные enum отражены в `ENUM_DECISION_REGISTER.md`.

---

## Phase 6. Workload-Driven Index Tuning

### Goal
Настроить index layer под реальные query paths.

### Checklist
- [x] Зафиксировать hot query paths по active contour.
- [x] Подтвердить missing indexes для `HarvestPlan`.
- [x] Подтвердить missing indexes для `Task`.
- [x] Подтвердить missing indexes для `DeviationReview`.
- [x] Подтвердить missing indexes для `CmrRisk`.
- [x] Подтвердить missing indexes для `EconomicEvent`.
- [x] Подтвердить missing indexes для `LedgerEntry`.
- [x] Подтвердить missing indexes для `Party`.
- [x] Добавить только workload-confirmed composite indexes.
- [x] Для каждого нового индекса зафиксировать query evidence:
- [x] query shape
- [x] frequency
- [x] latency pain
- [x] expected selectivity
- [x] Проверить зеркальные индексы на удаление.
- [x] Отдельно проверить `Season(companyId,status)` vs `Season(status,companyId)`.
- [x] Нормализовать outbox scope columns до индексации ordering path.
- [x] Разделить append-heavy и read-heavy tables.
- [x] Не добавлять speculative indexes на AI/runtime tables без evidence.
- [x] Удалять low-value indexes только после production query statistics.
- [x] Для каждого удаляемого индекса зафиксировать production observation window до удаления.

### Phase gate
- [x] Hot queries покрыты подтверждёнными индексами.
- [x] Write-heavy tables не перегружены лишними индексами.
- [x] Index layer отражает workload, а не привычку индексировать `companyId`.

---

## Phase 7. Operational Aggregate Migration

### Goal
Выборочно перевести core business aggregates на новую tenancy semantics после cleanup control-plane и read seams.

### Checklist
- [x] Выбрать первый non-core candidate для migration.
- [x] Подготовить migration contract для `FrontOfficeThread` family или другого low-blast-radius aggregate.
- [x] Выполнить tenant bootstrap и закрыть null-backlog для первой `FrontOfficeThread` wave.
- [x] Выпустить cutover runbook для первой `FrontOfficeThread` wave.
- [x] Прогнать shadow-read compare для первой `FrontOfficeThread` wave.
- [x] Подтвердить partial read cutover под feature flag для первой `FrontOfficeThread` wave.
- [x] Провести rollback drill и зафиксировать `rollback verified` для первой `FrontOfficeThread` wave.
- [x] Подготовить migration contract для finance projections/event-control seams.
- [x] Только после этого готовить migration для `Season`.
- [x] Только после этого готовить migration для `HarvestPlan`.
- [x] Только после этого готовить migration для `TechMap`.
- [x] Только после этого готовить migration для `Task`.
- [x] Для каждого aggregate определить:
- [x] source of scope
- [x] compatibility read path
- [x] compatibility write path
- [x] rollback path
- [x] data backfill strategy
- [x] shadow validation strategy
- [x] Запрет: `Season`, `HarvestPlan`, `TechMap`, `Task` нельзя мигрировать параллельно более одной aggregate family за migration wave.

### Phase gate
- [x] Ни один central operational aggregate не переводится без projections/compatibility seam.
- [x] Для каждого aggregate есть backfill + rollback plan.

---

## Phase 8. Decide Physical Split Only If Proven

### Goal
Решить, нужен ли вообще physical split после логической стабилизации.

### Checklist
- [x] Замерить, есть ли доказанный physical bottleneck.
- [x] Сравнить вариант `one physical DB`.
- [x] Сравнить вариант `one DB + multiple Postgres schemas`.
- [x] Сравнить вариант `selective storage contours`.
- [x] Оценить write/load pressure у event/history/AI telemetry contours.
- [x] Оценить archive pressure.
- [x] Оценить security/privilege boundary pressure.
- [x] Не запускать split без доказанного bottleneck.
- [x] Не делать split как реакцию на размер `schema.prisma`.

### Phase gate
- [x] Есть доказательное решение по physical split (обоснованный split или explicit rejection).
- [x] Если причины нет, решение = оставить одну физическую БД.

---

## MG-Core Decision Checklist

- [x] Не использовать `MG-Core` как active runtime contour.
- [x] Не использовать `MG-Core` для dual-write.
- [x] Не использовать `MG-Core` как hot backup active schema.
- [x] Оценить `MG-Core` как `read-only archive`.
- [x] Оценить `MG-Core` как `migration sandbox`.
- [x] Оценить `MG-Core` как `reference diff contour`.
- [x] Зафиксировать решение отдельным ADR или decision note.

---

## Program-Level Success Metrics Checklist

- [x] Direct relations у `Company`: baseline `140` -> target `<=95` (Phase 2).
- [x] Ambiguous scope models (mixed-transition backlog): baseline `17` -> target `<=6` (Phase 5) -> `0` (Phase 7).
- [x] Enums without taxonomy: baseline `149` -> target `0` (Phase 5).
- [x] Cross-domain relations without ADR: baseline `>0` -> target `0`.
- [x] Hot queries without workload-confirmed indexes: baseline `8` -> target `<=2` (Phase 6).
- [x] Median Prisma include depth in hot paths: baseline `4` -> target `<=2` (Phase 6).
- [x] New models added without cross-domain rewiring: KPI instrumentation включен, measurement window открыт (target `>=80%` для следующих model waves).

---

## Final Release Gate For Full DB Refactoring Program

Программу можно считать успешно выполненной только если:
- [x] `Tenant` реально стал platform boundary.
- [x] `Company` перестал быть platform root.
- [x] Domain ownership зафиксирован и соблюдается.
- [x] Projection layer управляемый и не стал вторым source of truth.
- [x] Enum layer очищен по taxonomy, а не косметически.
- [x] Index layer отражает реальные workload paths.
- [x] Central operational aggregates переведены только после controlled migration seams.
- [x] Physical split либо доказан, либо сознательно отклонён.
- [x] Новая сущность или новый домен могут быть добавлены без перепрошивки существующего ядра.
