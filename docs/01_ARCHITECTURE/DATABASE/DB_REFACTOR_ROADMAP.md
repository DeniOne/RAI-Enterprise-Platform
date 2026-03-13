# DB_REFACTOR_ROADMAP

## Hard position

Цель этого roadmap не в том, чтобы красиво перепилить `schema.prisma`.
Цель в том, чтобы новая сущность, новый домен или новый AI/runtime contour могли добавляться без перепрошивки существующего ядра.

Нельзя:
- сначала делить физическую БД;
- сначала переименовывать `companyId` в `tenantId`;
- сначала дробить schema на мелкие папки без governance;
- сначала плодить projections на каждый экран;
- сначала делать enum-cleanup по ощущениям;
- сначала тащить `MG-Core` в active runtime как резервный контур.

Нужно идти от governance к данным, а не наоборот.

## Execution status (2026-03-13)

- `Phase 0`: выполнен (governance artifacts + CI gates + manifest coverage).
- `Phase 1`: выполнен (additive `Tenant` boundary + dual-key runtime/auth + shadow mode).
- Следующий активный слой: `Phase 2` (`Company` de-rooting).

## Архитектурные запреты

Эти запреты должны действовать до первой миграции:
- новые модели нельзя автоматически root-ить в `Company`;
- новые cross-domain relations запрещены без ADR;
- `companyId = NULL` нельзя использовать как universal global scope;
- `JSONB` нельзя использовать как замену отсутствующей модели;
- read models не могут быть источником истины;
- `MG-Core` не может быть вторым active source of truth.

## Phase 0: governance before schema

### Goal
Остановить архитектурный дрейф до изменения схемы и данных.

### Concrete changes
- выпустить ADR-пакет:
  - `ADR_DB_001_TENANT_VS_COMPANY_BOUNDARY.md`
  - `ADR_DB_002_SCHEMA_FRAGMENTATION_AND_OWNERSHIP.md`
  - `ADR_DB_003_ENUM_GOVERNANCE.md`
  - `ADR_DB_004_READ_MODELS_AND_PROJECTIONS.md`
  - `ADR_DB_005_INDEX_AND_QUERY_GOVERNANCE.md`
- зафиксировать `MODEL_SCOPE_MANIFEST.md`;
- зафиксировать `DOMAIN_OWNERSHIP_MANIFEST.md`;
- зафиксировать `READ_MODEL_POLICY.md`;
- зафиксировать `DB_SUCCESS_METRICS.md`;
- включить CI-checks на scope, ownership и forbidden relations;
- исправить contradiction вокруг `EventConsumption` в tenant policy.

### Risks
- технический риск низкий;
- организационный риск средний: команды могут продолжить жить по старой mental model.

### Expected effect
- прекращается uncontrolled schema growth;
- tenancy semantics перестаёт быть неформальной;
- следующие миграции становятся воспроизводимыми, а не импульсивными.

### Rollback considerations
- rollback не нужен;
- если правило оказалось неверным, оно меняется через ADR и manifest, а не через молчаливое исключение.

## Phase 1: additive tenancy in control-plane

### Goal
Добавить настоящий platform boundary без удара по core business flows.

### Concrete changes
- добавить `Tenant` и `TenantCompanyBinding`;
- ввести dual-key policy: `tenantId` + `companyId`;
- добавить nullable `tenantId` только в control-plane / runtime / governance / memory модели;
- обновить runtime context до явного вида `tenantId + companyId + isSystem`;
- включить mismatch logging и shadow mode;
- зафиксировать source-of-scope policy: scope берётся только из runtime context.

### First target models
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

### Risks
- высокий риск семантического рассинхрона между runtime и schema;
- высокий риск сломать tenant isolation, если отказаться от shadow mode;
- средний риск затронуть Prisma types и сервисные контракты.

### Expected effect
- появляется настоящий platform boundary;
- control-plane перестаёт насиловать `Company` как tenant root;
- migration seam становится реальным, а не теоретическим.

### Rollback considerations
- `companyId` остаётся authoritative compatibility key;
- `tenantId` сначала additive и shadowed;
- feature-flagged fallback на `companyId`-only path обязателен.

## Phase 2: Company de-rooting

### Goal
Убрать `Company` из роли глобального relation hub.

### Concrete changes
- сократить direct relations у `Company` до business/legal core;
- убрать root-роль из AI/runtime/integration контуров;
- перевести часть тяжёлых чтений на approved projections;
- перестать использовать `Company` как transit root для доступа к unrelated aggregates.

### Risks
- высокий риск, если делать раньше Phase 0-1;
- риск случайно порезать implicit query paths в сервисах.

### Expected effect
- исчезает главный god-object active schema;
- новые домены перестают автоматически привязываться к `Company`.

### Rollback considerations
- relation pruning должна идти через staged deprecation;
- сначала read-path redirection, потом structural cleanup.

## Phase 3: domain fragmentation

### Goal
Разбить schema monolith логически, но не превратить это в папочный театр.

### Concrete changes
- фрагментировать schema по 8 верхнеуровневым доменам:
  - `platform_core`
  - `org_legal`
  - `agri_planning`
  - `agri_execution`
  - `finance`
  - `crm_commerce`
  - `ai_runtime`
  - `integration_reliability`
- `knowledge_memory` и `risk_governance` держать как подконтуры `ai_runtime`;
- `research_rd` держать как `quarantine/sandbox contour`;
- закрепить ownership на уровне fragment files и manifests;
- запретить новые cross-domain relations без ADR.

### Risks
- риск over-modularization, если дробить глубже раньше времени;
- риск ложной победы, если поменяются файлы, но не границы.

### Expected effect
- схема становится обозримой;
- ownership становится жёстким;
- новые сущности добавляются без перепрошивки всего графа.

### Rollback considerations
- fragment layout должен быть обратимым;
- при необходимости schema может временно собираться обратно в единый source без semantic drift.

## Phase 4: enum taxonomy cleanup

### Goal
Убрать enum-sprawl системно, а не косметически.

### Concrete changes
- классифицировать каждый enum в один из классов:
  - `technical closed enum`
  - `FSM/status invariant enum`
  - `business evolving vocabulary`
  - `jurisdiction-sensitive vocabulary`
  - `tenant-customizable vocabulary`
  - `suspicious duplicate enum family`
- собрать overlap matrix по кластерам:
  - `risk-*`
  - `status-*`
  - `source-*`
  - `type-*`
  - `mode-*`
- оставить первые два класса как enum;
- остальные переводить в reference/config tables или нормализовать.

### Risks
- средний риск generated-type churn;
- риск спутать FSM и vocabulary без domain ownership.

### Expected effect
- уменьшается migration noise;
- платформа легче переносит новые юрисдикции, tenants и продуктовые словари.

### Rollback considerations
- reference tables вводить additive-first;
- enum dependency убирать только после стабилизации read/write paths.

## Phase 5: workload-driven index tuning

### Goal
Ускорять реальные запросы, а не коллекционировать placeholder indexes.

### Concrete changes
- добавлять индексы только под подтверждённые hot query paths;
- удалять шаблонные и зеркальные индексы только после проверки query statistics;
- разделить append-heavy и read-heavy tables;
- отдельно нормализовать outbox scope columns до индексного тюнинга `OutboxMessage`.

### Risks
- низкий или средний риск;
- write-bloat, если пытаться компенсировать плохую query architecture количеством индексов.

### Expected effect
- реальные operational flows ускоряются;
- write-heavy surfaces не зарастают бессмысленными индексами.

### Rollback considerations
- create indexes concurrently where possible;
- remove indexes only with production evidence.

## Phase 6: only then decide physical split

### Goal
Доказать необходимость physical split, а не предполагать её.

### Concrete changes
Сравнить три варианта:
- одна физическая БД;
- одна БД с несколькими Postgres schemas / namespaces;
- selective storage contours для history / AI telemetry / archive.

### Risks
- premature split создаёт dual-truth и ops tax;
- инфраструктура может зацементировать неочищенные логические границы.

### Expected effect
- physical split становится осознанным выбором, а не панической реакцией на большой `schema.prisma`.

### Rollback considerations
- если bottleneck не доказан, Phase 6 должна закончиться решением оставить одну физическую БД.

## Transition runtime policy

На весь переходный период должны быть зафиксированы четыре инварианта:
- `tenantId` = platform isolation key;
- `companyId` = business/legal association key и compatibility key;
- scope приходит только из runtime context;
- mismatch cases между `tenantId` и `companyId -> tenant` mapping логируются и считаются архитектурным инцидентом.

## Success metrics

Измеримые метрики должны жить отдельно в `DB_SUCCESS_METRICS.md`, но минимумом для roadmap являются:
- число прямых relations у `Company`;
- число моделей с неясным scope;
- число enum без taxonomy;
- число cross-domain relations без ADR;
- число hot queries без workload-confirmed indexes;
- медианная сложность Prisma include-графов;
- число новых моделей, добавленных без cross-domain правок.

## MG-Core handling

Рекомендуемая позиция:
- до конца Phase 3 `MG-Core` = только legacy/adjacent reference contour;
- допустимые роли: `read-only archive`, `migration sandbox`, `reference diff tooling`;
- запрещённые роли: active dual-write, runtime fallback, второй source of truth.

## First implementation tranche

Первый реальный tranche должен ограничиваться только `Phase 0 + Phase 1`.

Это означает:
- governance package;
- manifests;
- CI checks;
- `Tenant` / `TenantCompanyBinding`;
- `tenantId` только для control-plane contour;
- без массового refactor operational core.

Именно это даёт первый настоящий архитектурный шов без production explosion.
