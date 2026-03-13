# DB_REFACTOR_ROADMAP

## Hard position

Правильный порядок важнее скорости.

Нельзя:
- сначала пилить физическую БД;
- сначала переименовывать `companyId` в `tenantId`;
- сначала дробить `schema.prisma` на файлы, не зафиксировав ownership и границы;
- сначала тащить MG-Core в active contour как резервный рантайм.

Нужно идти так:
1. зафиксировать реальную архитектурную картину;
2. остановить дальнейший schema drift;
3. развести platform tenancy и business/legal identity;
4. только потом делать логическую модульность;
5. затем чистить enum и workload/index layer;
6. и только после этого обсуждать physical split.

## Phase 1: audit-only

### Goal
Получить зафиксированную, repo-backed картину текущей БД и снять архитектурную неопределённость.

### Concrete changes
- подготовить пакет документов:
  - `DB_ARCH_AUDIT.md`
  - `DB_TENANCY_REFACTOR_PLAN.md`
  - `DB_DOMAIN_MAP.md`
  - `DB_ENUM_RATIONALIZATION.md`
  - `DB_INDEX_AUDIT.md`
  - `DB_REFACTOR_ROADMAP.md`
  - `DB_REFACTOR_PROPOSAL.patch.md`
- классифицировать все модели current contour и MG-Core contour;
- зафиксировать hard facts:
  - `Company` = god-root;
  - `companyId` перегружен и смешивает tenancy с бизнес-связью;
  - `tenantId` отсутствует;
  - есть enum sprawl;
  - hot paths сосредоточены в `Season`, `TechMap`, `HarvestPlan`, `DeviationReview`, `Task`, `Party`, `AgentConfiguration`, `OutboxMessage`, `RuntimeGovernanceEvent`.

### Risks
- технический риск низкий;
- главный риск: сделать слишком общий аудит и получить ложное ощущение контроля.

### Expected effect
- прекращается спонтанный рефакторинг на ощущениях;
- появляется единая архитектурная база для следующих фаз;
- дальнейшие решения перестают спорить с реальным workload.

### Rollback considerations
- rollback не нужен: это documentation-only phase.

## Phase 2: conventions and ownership

### Goal
Остановить дальнейшее разрастание схемы до начала structural refactor.

### Concrete changes
- создать ADR-пакет:
  - `ADR_DB_001_TENANT_VS_COMPANY_BOUNDARY.md`
  - `ADR_DB_002_SCHEMA_FRAGMENTATION_AND_OWNERSHIP.md`
  - `ADR_DB_003_ENUM_GOVERNANCE.md`
  - `ADR_DB_004_READ_MODELS_AND_PROJECTIONS.md`
  - `ADR_DB_005_INDEX_AND_QUERY_GOVERNANCE.md`
- зафиксировать ownership по bounded contexts;
- ввести taxonomy для всех моделей:
  - `tenant-scoped operational`
  - `tenant-scoped control-plane`
  - `business-scoped`
  - `global/shared`
  - `integration/control-plane`
  - `inherited-scope child`
- описать allowed inbound/outbound dependencies;
- зафиксировать список запрещённых прямых cross-domain relation paths;
- устранить policy contradiction в tenant enforcement, в первую очередь вокруг `EventConsumption` в `PrismaService`.

### Risks
- технический риск низкий;
- организационный риск средний: команды могут продолжить работать по старой mental model.

### Expected effect
- прекращается uncontrolled schema growth;
- новые модели перестают автоматически root-иться в `Company`;
- следующая фаза tenancy refactor становится уже не хаотичной, а управляемой.

### Rollback considerations
- откатывать смысла нет;
- если правило оказалось неверным, его меняют через ADR, а не тихим нарушением.

## Phase 3: tenancy refactor

### Goal
Развести platform tenant boundary и business/legal organization identity без большого взрыва.

### Concrete changes
- добавить `Tenant` и `TenantCompanyBinding`;
- для существующих компаний сделать one-tenant-per-company backfill как transitional mapping;
- ввести `tenantId` сначала в control-plane и platform tables:
  - `TenantState`
  - `AgentConfiguration`
  - `AgentCapabilityBinding`
  - `AgentToolBinding`
  - `AgentConnectorBinding`
  - `AgentConfigChangeRequest`
  - `RuntimeGovernanceEvent`
  - `SystemIncident`
  - `IncidentRunbookExecution`
  - `PendingAction`
  - `PerformanceMetric`
  - `EvalRun`
  - `EventConsumption`
  - `MemoryInteraction`
  - `MemoryEpisode`
  - `MemoryProfile`
- обновить `TenantContextService` и auth/runtime context так, чтобы он держал отдельно `tenantId` и `companyId`;
- `companyId` оставить как compatibility key и business relation;
- привести global/shared preset модели к явной политике, а не к неформальному `companyId = null`.

### Risks
- это самая опасная фаза всей программы;
- изменятся Prisma types и часть service contracts;
- возможны ошибки tenant isolation;
- без shadow mode легко словить разрыв между runtime semantics и schema semantics.

### Expected effect
- снимается главный structural defect схемы;
- AI/runtime/integration модели перестают насиловать `Company` как platform-root;
- система становится пригодной для multi-org, control-plane и platform-first роста.

### Rollback considerations
- `companyId` остаётся authoritative до завершения shadow-validation;
- чтение по `tenantId` включать сначала в shadow/debug mode;
- держать feature-flagged fallback на `companyId`-only isolation;
- никакие destructive renames на этой фазе не делать.

## Phase 4: domain modularization

### Goal
Разбить schema monolith логически, не разделяя физическую БД.

### Concrete changes
- разложить schema source на fragment-файлы под `packages/prisma-client/prisma/`;
- оставить единый build-артефакт `schema.prisma` для Prisma generation;
- закрепить ownership каждого fragment-файла за конкретным bounded context;
- вынести cross-domain read paths в явные projections/read models;
- сократить relation graph у `Company` до минимального business-core;
- запретить новые cross-domain relations без ADR и ownership review.

### Risks
- средний риск tooling drift между fragments и сгенерированным `schema.prisma`;
- риск ложной модульности, если relation graph не будет реально резаться;
- возможен соблазн объявить победу после файловой декомпозиции, не изменив семантику.

### Expected effect
- схема перестаёт быть нечитаемым монолитом на 6000+ строк;
- уменьшается blast radius миграций;
- review и ownership становятся реальными, а не номинальными.

### Rollback considerations
- фрагментация должна быть tool-driven и обратимой;
- на первом шаге не трогать names моделей и таблиц;
- при необходимости fragments можно временно снова собрать в один источник без потери смысла.

## Phase 5: enum cleanup

### Goal
Сократить enum sprawl и убрать evolving business vocabulary из hardcoded schema evolution path.

### Concrete changes
- нормализовать дублирующиеся и конфликтующие enum families;
- ввести каноническую severity taxonomy для risk/governance surface;
- исправить literal defects, например `FERTILIZER` vs `FERTILIZERS`;
- вынести evolving vocabularies в reference/config tables:
  - агрономические справочники;
  - observation/evidence vocabularies;
  - часть commerce/CRM vocabularies;
  - часть research/knowledge taxonomies;
- сохранить технические FSM/status enums как enum, если они реально кодируют инварианты и поведение.

### Risks
- средний риск совместимости generated types;
- риск поломки validation/admin tooling;
- риск спутать FSM enum и бизнес-словарь, если делать cleanup без domain ownership.

### Expected effect
- снижается миграционный шум;
- новые юрисдикции, модули и продуктовые словари перестают требовать schema surgery;
- Prisma Client становится предсказуемее.

### Rollback considerations
- сначала additive reference tables;
- на переходный период можно держать enum и reference table параллельно;
- enum dependency убирать только после стабилизации read/write paths.

## Phase 6: index/query tuning

### Goal
Привести индексный слой к реальному workload и перестать платить write-cost за placeholder indexes.

### Concrete changes
- добавить high-value composite indexes из `DB_INDEX_AUDIT.md`;
- убрать зеркальные и слабополезные индексы, если query evidence не подтверждает их необходимость;
- нормализовать scope columns в `OutboxMessage`, чтобы tenant/company ordering не зависел от JSON payload;
- ввести query governance для hot delegates;
- добавить CI/diagnostics для duplicate indexes и weak tenant indexes.

### Risks
- низкий или средний риск;
- риск write bloat, если бездумно добавить все индексы сразу;
- риск удалить seemingly-redundant index, который всё же нужен под редкий, но дорогой path.

### Expected effect
- уменьшается latency на реальных operational queries;
- снижается блокировка queue-like paths;
- индексный слой начинает отражать actual workload, а не общую идею multi-tenancy.

### Rollback considerations
- добавлять индексы конкурентно, где это возможно;
- удалять индексы только после проверки production query statistics;
- не делать массовый delete-wave до появления реальных метрик.

## Phase 7: optional physical separation / schemas / archives

### Goal
Решить, нужна ли вообще физическая декомпозиция после того, как логическая архитектура уже очищена.

### Concrete changes
Сравнить три варианта.

#### Option A. Оставить одну физическую БД
Использовать, если:
- логическая декомпозиция уже убрала основную связанность;
- operational simplicity важнее infra-сложности;
- нет доказанного bottleneck, который требует физического split.

#### Option B. Одна БД, несколько Postgres schemas / namespaces
Использовать, если:
- ownership и privilege boundaries нужно усилить;
- физическое разделение по отдельным инстансам пока преждевременно;
- нужны более чистые namespace-границы для `platform_core`, `finance`, `ai_runtime`, `integration_reliability`.

#### Option C. Selective storage contours
Использовать только при доказанном давлении по объёму, write-rate или retention.

Потенциальные кандидаты:
- event/outbox/history archive;
- AI telemetry / eval / audit history;
- knowledge/vector-heavy storage;
- long-term archive для некоторых legacy/MG-Core data sets.

### Risks
- premature physical split создаёт dual-truth, ops tax и migration tax;
- cross-schema/cross-store joins могут сделать всё хуже, если доменные границы всё ещё грязные;
- высок риск перенести проблему из логики в инфраструктуру и получить дорогой legacy следующего поколения.

### Expected effect
- полезно только после успешного завершения предыдущих фаз;
- может улучшить retention, archival, security isolation и отдельные operational SLO;
- не является обязательной целью.

### Rollback considerations
- physical split должен быть опциональным;
- переходить к нему можно только после появления одного конкретного доказанного bottleneck;
- если bottleneck не доказан, Phase 7 должна завершаться решением оставить одну БД.

## MG-Core handling across phases

Рекомендуемая позиция:
- Phases 1-3: `MG-Core` использовать только как legacy/adjacent reference contour;
- Phases 4-5: использовать для domain comparison и migration-risk analysis;
- Phases 6-7: принять решение, нужен ли узкий `read-only archive` или `migration sandbox`.

Что запрещено:
- dual-write между active contour и MG-Core;
- runtime fallback на MG-Core schema;
- попытка держать два равноправных Prisma source of truth.

Рациональный outcome по умолчанию:
- `MG-Core` либо остаётся legacy reference;
- либо превращается в read-only archive/sandbox;
- но не становится вторым активным operational contour.

## End-state target

Если roadmap выполнен правильно, итоговая архитектура должна выглядеть так:
- одна физическая Postgres БД как основной operational contour;
- логически разрезанная schema с ownership по bounded contexts;
- `Tenant` как platform boundary;
- `Company` как business/legal entity, а не system root;
- новые AI/runtime/integration модели сидят на `tenantId`;
- тяжелые cross-domain use-cases читаются через projections/read models;
- enum layer очищен от business vocabulary overflow;
- index layer соответствует реальному workload;
- MG-Core не создаёт operational ambiguity.

Это и есть современное, эволюционируемое состояние без premature microservices и без нового скрытого потолка роста.
