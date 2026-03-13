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

---

## Phase 0. Governance Before Schema

### Goal
Остановить архитектурный дрейф до начала миграций и schema changes.

### Checklist
- [ ] Утвердить `ADR_DB_001_TENANT_VS_COMPANY_BOUNDARY.md`.
- [ ] Утвердить `ADR_DB_002_SCHEMA_FRAGMENTATION_AND_OWNERSHIP.md`.
- [ ] Утвердить `ADR_DB_003_ENUM_GOVERNANCE.md`.
- [ ] Утвердить `ADR_DB_004_READ_MODELS_AND_PROJECTIONS.md`.
- [ ] Утвердить `ADR_DB_005_INDEX_AND_QUERY_GOVERNANCE.md`.
- [x] Заполнить `MODEL_SCOPE_MANIFEST.md` для всех high-risk моделей.
- [x] Заполнить `DOMAIN_OWNERSHIP_MANIFEST.md` для всех current contour моделей.
- [ ] Утвердить `READ_MODEL_POLICY.md`.
- [ ] Утвердить `DB_SUCCESS_METRICS.md`.
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

### Checklist
- [ ] Зафиксировать целевой минимальный core graph `Company`.
- [ ] Выделить relation edges `Company`, которые являются business/legal semantics.
- [ ] Выделить relation edges `Company`, которые являются tenant-noise.
- [ ] Выделить relation edges `Company`, которые должны уйти в projections/read models.
- [ ] Выделить relation edges `Company`, которые должны уйти в indirect ownership.
- [ ] Убрать root-роль `Company` из AI/runtime tables.
- [ ] Убрать root-роль `Company` из integration/control tables.
- [ ] Убрать root-роль `Company` из memory/knowledge control-plane.
- [ ] Подготовить staged deprecation plan для лишних `Company` relations.
- [ ] Подготовить compatibility read paths для сервисов, читающих через `Company` graph.
- [ ] Снизить число direct relations у `Company` по зафиксированной метрике.

### Phase gate
- [ ] `Company` больше не является platform root.
- [ ] Новые модели не добавляют direct relation в `Company` без ADR.
- [ ] `Company` relation graph сокращён до business/legal core.

---

## Phase 3. Domain Fragmentation

### Goal
Разбить schema monolith логически по ownership domains без physical split.

### Checklist
- [ ] Подготовить `schema.compose.ts` или эквивалентный compose-script.
- [ ] Создать `00_base.prisma`.
- [ ] Создать `01_platform_core.prisma`.
- [ ] Создать `02_org_legal.prisma`.
- [ ] Создать `03_agri_planning.prisma`.
- [ ] Создать `04_agri_execution.prisma`.
- [ ] Создать `05_finance.prisma`.
- [ ] Создать `06_crm_commerce.prisma`.
- [ ] Создать `07_ai_runtime.prisma`.
- [ ] Создать `08_integration_reliability.prisma`.
- [ ] Создать `09_quarantine_sandbox.prisma`.
- [ ] Создать `10_legacy_bridge.prisma`.
- [ ] Разнести модели по fragments по ownership manifest.
- [ ] Разнести enum по fragments по ownership manifest.
- [ ] Проверить, что compose-процесс собирает идентичный functional `schema.prisma`.
- [ ] Ввести review rule: изменения в fragment возможны только owner domain.
- [ ] Ввести запрет на новые cross-domain relations без ADR.
- [ ] Не дробить `knowledge_memory` и `risk_governance` в отдельные top-level fragments.
- [ ] Не выводить `research_rd` из quarantine contour без отдельного ADR.

### Phase gate
- [ ] Все current contour модели имеют owner fragment.
- [ ] Compose process стабилен и проверяется в CI.
- [ ] Fragmentation не изменила runtime semantics самопроизвольно.

---

## Phase 4. Read Models / Projection Discipline

### Goal
Перевести тяжёлые cross-domain чтения на управляемые projections, не создавая второй мусорный слой данных.

### Checklist
- [ ] Утвердить список allowed projection use-cases.
- [ ] Для каждой projection заполнить metadata contract:
- [ ] owner
- [ ] source of truth
- [ ] refresh SLA
- [ ] refresh mechanism
- [ ] deterministic rebuild
- [ ] retention policy
- [ ] consumers
- [ ] rollback strategy
- [ ] Подготовить planning workspace projection.
- [ ] Подготовить party workspace projection.
- [ ] Подготовить front-office operator projection.
- [ ] Подготовить runtime governance projection.
- [ ] Запретить ad hoc projection tables без owner/rebuild contract.
- [ ] Запретить projection как write model.
- [ ] Измерить снижение сложности include-графов в hot services.

### Phase gate
- [ ] Ни одна новая projection не создана без policy metadata.
- [ ] Projection layer пересобираем детерминированно.
- [ ] Projection layer не стал source of truth.

---

## Phase 5. Enum Taxonomy Cleanup

### Goal
Сделать enum cleanup taxonomy-driven, а не косметическим.

### Checklist
- [ ] Классифицировать каждый enum в один класс:
- [ ] `technical closed enum`
- [ ] `FSM/status invariant enum`
- [ ] `business evolving vocabulary`
- [ ] `jurisdiction-sensitive vocabulary`
- [ ] `tenant-customizable vocabulary`
- [ ] `suspicious duplicate enum family`
- [ ] Собрать overlap matrix по `risk-*`.
- [ ] Собрать overlap matrix по `status-*`.
- [ ] Собрать overlap matrix по `source-*`.
- [ ] Собрать overlap matrix по `type-*`.
- [ ] Собрать overlap matrix по `mode-*`.
- [ ] Зафиксировать enum, которые остаются enum.
- [ ] Зафиксировать enum, которые объединяются.
- [ ] Зафиксировать enum, которые переименовываются.
- [ ] Зафиксировать vocabulary, которые уходят в reference/config tables.
- [ ] Исправить literal defects вроде `FERTILIZER` / `FERTILIZERS`.
- [ ] Нормализовать risk/severity family.
- [ ] Нормализовать source family.
- [ ] Нормализовать mode family.

### Phase gate
- [ ] У каждого enum есть taxonomy class.
- [ ] Нет enum cleanup без owner domain approval.
- [ ] Evolving vocabularies выведены из hardcoded enum path по плану.

---

## Phase 6. Workload-Driven Index Tuning

### Goal
Настроить index layer под реальные query paths.

### Checklist
- [ ] Зафиксировать hot query paths по active contour.
- [ ] Подтвердить missing indexes для `HarvestPlan`.
- [ ] Подтвердить missing indexes для `Task`.
- [ ] Подтвердить missing indexes для `DeviationReview`.
- [ ] Подтвердить missing indexes для `CmrRisk`.
- [ ] Подтвердить missing indexes для `EconomicEvent`.
- [ ] Подтвердить missing indexes для `LedgerEntry`.
- [ ] Подтвердить missing indexes для `Party`.
- [ ] Добавить только workload-confirmed composite indexes.
- [ ] Проверить зеркальные индексы на удаление.
- [ ] Отдельно проверить `Season(companyId,status)` vs `Season(status,companyId)`.
- [ ] Нормализовать outbox scope columns до индексации ordering path.
- [ ] Разделить append-heavy и read-heavy tables.
- [ ] Не добавлять speculative indexes на AI/runtime tables без evidence.
- [ ] Удалять low-value indexes только после production query statistics.

### Phase gate
- [ ] Hot queries покрыты подтверждёнными индексами.
- [ ] Write-heavy tables не перегружены лишними индексами.
- [ ] Index layer отражает workload, а не привычку индексировать `companyId`.

---

## Phase 7. Operational Aggregate Migration

### Goal
Выборочно перевести core business aggregates на новую tenancy semantics после cleanup control-plane и read seams.

### Checklist
- [ ] Выбрать первый non-core candidate для migration.
- [ ] Подготовить migration contract для `FrontOfficeThread` family или другого low-blast-radius aggregate.
- [ ] Подготовить migration contract для finance projections/event-control seams.
- [ ] Только после этого готовить migration для `Season`.
- [ ] Только после этого готовить migration для `HarvestPlan`.
- [ ] Только после этого готовить migration для `TechMap`.
- [ ] Только после этого готовить migration для `Task`.
- [ ] Для каждого aggregate определить:
- [ ] source of scope
- [ ] compatibility read path
- [ ] compatibility write path
- [ ] rollback path
- [ ] data backfill strategy
- [ ] shadow validation strategy

### Phase gate
- [ ] Ни один central operational aggregate не переводится без projections/compatibility seam.
- [ ] Для каждого aggregate есть backfill + rollback plan.

---

## Phase 8. Decide Physical Split Only If Proven

### Goal
Решить, нужен ли вообще physical split после логической стабилизации.

### Checklist
- [ ] Замерить, есть ли доказанный physical bottleneck.
- [ ] Сравнить вариант `one physical DB`.
- [ ] Сравнить вариант `one DB + multiple Postgres schemas`.
- [ ] Сравнить вариант `selective storage contours`.
- [ ] Оценить write/load pressure у event/history/AI telemetry contours.
- [ ] Оценить archive pressure.
- [ ] Оценить security/privilege boundary pressure.
- [ ] Не запускать split без доказанного bottleneck.
- [ ] Не делать split как реакцию на размер `schema.prisma`.

### Phase gate
- [ ] Есть доказательная причина для physical split.
- [ ] Если причины нет, решение = оставить одну физическую БД.

---

## MG-Core Decision Checklist

- [ ] Не использовать `MG-Core` как active runtime contour.
- [ ] Не использовать `MG-Core` для dual-write.
- [ ] Не использовать `MG-Core` как hot backup active schema.
- [ ] Оценить `MG-Core` как `read-only archive`.
- [ ] Оценить `MG-Core` как `migration sandbox`.
- [ ] Оценить `MG-Core` как `reference diff contour`.
- [ ] Зафиксировать решение отдельным ADR или decision note.

---

## Program-Level Success Metrics Checklist

- [ ] Снижается число direct relations у `Company`.
- [ ] Снижается число моделей с неясным scope.
- [ ] Снижается число enum без taxonomy.
- [ ] Снижается число cross-domain relations без ADR.
- [ ] Снижается число hot queries без workload-confirmed indexes.
- [ ] Снижается медианная сложность include-графов.
- [ ] Растёт число новых моделей, добавляемых без cross-domain перепрошивки схемы.

---

## Final Release Gate For Full DB Refactoring Program

Программу можно считать успешно выполненной только если:
- [ ] `Tenant` реально стал platform boundary.
- [ ] `Company` перестал быть platform root.
- [ ] Domain ownership зафиксирован и соблюдается.
- [ ] Projection layer управляемый и не стал вторым source of truth.
- [ ] Enum layer очищен по taxonomy, а не косметически.
- [ ] Index layer отражает реальные workload paths.
- [ ] Central operational aggregates переведены только после controlled migration seams.
- [ ] Physical split либо доказан, либо сознательно отклонён.
- [ ] Новая сущность или новый домен могут быть добавлены без перепрошивки существующего ядра.
