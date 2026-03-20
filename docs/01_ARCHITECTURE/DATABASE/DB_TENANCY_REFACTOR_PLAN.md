---
id: DOC-ARC-DATABASE-DB-TENANCY-REFACTOR-PLAN-0JBG
layer: Architecture
type: HLD
status: draft
version: 0.1.0
---
# План рефакторинга tenancy

## Позиция

Да, отдельный `Tenant` нужен.

Нет, делать разрушительный rename `companyId -> tenantId` сейчас нельзя.

Безопасная стратегия:
- добавить `Tenant` и `tenantId` как новый platform boundary;
- сохранить `companyId` на переходный период;
- сначала перевести control-plane и platform-state модели;
- оставить `companyId` там, где это реальная business/legal связь;
- только потом трогать наиболее связанные operational aggregates.

## Текущее состояние

Подтверждено по репозиторию:
- в active schema `152/195` моделей имеют `companyId`;
- в active schema добавлен `Tenant` boundary + bridge `TenantCompanyBinding`;
- `tenantId` добавлен additive-first в Phase 1 control-plane/runtime модели;
- `PrismaService` работает в dual-key режиме (`companyId` compatibility + `tenantId` shadow/enforce policy);
- `TenantState` все еще keyed by `companyId`, но уже имеет additive `tenantId`;
- `13` моделей имеют nullable `companyId`, то есть один и тот же столбец уже кодирует tenant-local и global/shared scope;
- `43` модели не имеют `companyId` вообще;
- `EventConsumption` runtime-classification conflict устранен.

## Корневой дефект

Сейчас `companyId` означает сразу четыре разные вещи:
- активный tenant boundary;
- business owner organization;
- denormalized access-control key;
- global/shared preset fallback через `NULL`.

Это не naming issue. Это сломанная scope-модель.

## Обязательные governance-артефакты до миграций

До любого реального добавления `tenantId` должны существовать:
- `MODEL_SCOPE_MANIFEST.md`
- `DOMAIN_OWNERSHIP_MANIFEST.md`
- CI-check на соответствие manifest и runtime policy
- явный список архитектурных запретов

Минимальные поля manifest для каждой модели:
- `scope_type`: `tenant` / `business` / `global` / `preset` / `system` / `mixed-transition`
- `owner_domain`
- `authoritative_key`
- допускается ли `companyId`
- должен ли появиться `tenantId`
- nullable/non-nullable policy
- допустим ли `global row`
- допустим ли `preset row`
- migration phase

Жесткое правило:
- если модель не описана в manifest, её нельзя переводить на новую scope-модель.

## Целевая taxonomy моделей

### 1. `tenant-scoped operational`
Это реальные tenant-local рабочие данные. Они должны в целевой архитектуре изолироваться по `tenantId`, даже если на переходе сохранят `companyId`.

Примеры:
- `Account`, `Holding`, `User`, `Invitation`
- `Field`, `Season`, `HarvestPlan`, `TechMap`, `Task`
- `DeviationReview`, `CmrDecision`, `CmrRisk`, `FieldObservation`, `HarvestResult`
- `EconomicEvent`, `LedgerEntry`, `Budget`, `CashAccount`
- `Party`, `CommerceContract`, `Invoice`, `Payment`
- `FrontOfficeThread`, `FrontOfficeDraft`, `FrontOfficeCommittedEvent`

### 2. `tenant-scoped control-plane`
Это не business entities. Это tenant-local platform state. Они должны перейти на `tenantId` раньше остальных.

Примеры:
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
- `MemoryInteraction`, `MemoryEpisode`, `MemoryProfile`
- `EventConsumption`

### 3. `business-scoped`
Это модели, где связь с `Company` должна остаться как предметная business/legal семантика.

Примеры:
- `Company`
- `Jurisdiction`
- `RegulatoryProfile`
- `Party`
- `CommerceContract`
- `CommerceObligation`
- `LegalDocument`
- `LegalRequirement`
- `RegulatoryBody`
- `ComplianceCheck`
- `PerformanceContract`

Важно:
- многие из этих моделей сегодня tenant-local;
- это не значит, что `companyId` должен и дальше оставаться platform tenant key;
- это значит, что им нужен и platform scope, и business owner concept.

### 4. `global/shared/reference`
Эти модели нельзя дальше кодировать через nullable `companyId`.

Примеры:
- `Rapeseed`
- `CropVariety`
- `BusinessRule`
- `RegionProfile`
- `InputCatalog`
- `HybridPhenologyModel`
- `Engram`
- `SemanticFact`
- global presets в `AgentConfiguration` и binding tables

## Проблемные случаи scope

### Nullable `companyId`
Подтвержденные модели:
- `Rapeseed`
- `CropVariety`
- `BusinessRule`
- `SystemIncident`
- `AgentConfiguration`
- `AgentCapabilityBinding`
- `AgentToolBinding`
- `AgentConnectorBinding`
- `Engram`
- `SemanticFact`
- `RegionProfile`
- `InputCatalog`
- `HybridPhenologyModel`
- `EventConsumption`

Вывод:
- схема уже сама показывает, что `companyId` не является чистым tenant boundary.
- сейчас `NULL` используется как surrogate для global/preset/network scope.
- это нужно заменить на явную scope-модель.

### Модели без `companyId`
Критично понимать: отсутствие `companyId` само по себе не ошибка.

В current contour без `companyId` живут:
- child/history модели вроде `SeasonHistory`, `SeasonStageProgress`, `TaskResourceActual`;
- internals planning graph: `TechnologyCardOperation`, `TechnologyCardResource`, `MapStage`, `MapOperation`, `MapResource`;
- технические модели вроде `OutboxMessage`.

Правильный вопрос не "есть ли `companyId`", а:
- scope наследуется от родителя?
- scope выражен явно?
- нет ли конфликтов между inherited scope и denormalized scope?

## Где `companyId` надо оставить

Оставить как business relation:
- legal/compliance/commerce ownership surface;
- договорные и регуляторные записи;
- business ownership для party/contract/regulatory layer;
- migration-period bridge `Tenant -> Company`.

## Где `companyId` надо перестать использовать как tenant boundary

Первый приоритет:
- `TenantState`
- весь AI/runtime control plane
- incident/governance tables
- memory control-plane tables
- `EventConsumption`
- global/preset knowledge and config models

## Где `companyId` нужно убрать как шумное дублирование

Долгосрочно не держать как обязательный top-level scope на child/support tables, где он уже выводится из parent aggregate:
- `FrontOfficeThreadMessage`
- `FrontOfficeHandoffRecord`
- `FrontOfficeThreadParticipantState`
- `SeasonSnapshot`
- `SeasonHistory`
- часть execution/evidence child tables

## Целевая модель tenancy

### Новая platform boundary

```prisma
model Tenant {
  id               String   @id @default(cuid())
  key              String   @unique
  displayName      String
  status           TenantStatus @default(ACTIVE)
  primaryCompanyId String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}
```

### Bridge к business entity

```prisma
model TenantCompanyBinding {
  id         String   @id @default(cuid())
  tenantId   String
  companyId  String
  isPrimary  Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

Почему так:
- платформа перестает подменять tenant организацией;
- сохраняется совместимость с текущим one-company-per-tenant состоянием;
- остается путь к future multi-org tenant, если он реально появится.

## Миграционная последовательность

## Волна 0. Зафиксировать правила

Изменения:
- ADR по tenant/company boundary;
- taxonomy всех моделей по scope;
- устранение policy-conflict вокруг `EventConsumption`;
- манифест tenant-classification в CI.

Риск:
- нулевой для данных.

Rollback:
- не требуется.

## Волна 1. Additive tenancy primitives

Изменения:
- добавить `Tenant`;
- добавить `TenantCompanyBinding`;
- backfill: один tenant на одну текущую company;
- `companyId` не менять.

Риск:
- низкий.

Rollback:
- просто не использовать новые таблицы.

## Волна 2. Добавить `tenantId` в control-plane сначала

Первый набор:
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

Почему они первыми:
- это platform/control-plane surface;
- там `companyId` уже особенно грязный semantically;
- бизнес-риск ниже, чем в agronomy core и commerce core.

## Волна 3. Научить runtime жить с двумя ключами

Изменения:
- `TenantContextService` и `PrismaService` хранят и `tenantId`, и `companyId`;
- isolation становится `tenantId`-first, `companyId`-fallback;
- RLS/session context готовится к `app.current_tenant_id`, но сохраняет совместимость с `app.current_company_id`.

Риск:
- высокий.

Смягчение:
- shadow mode;
- mismatch logging;
- alarms на tenant/company drift.

Rollback:
- feature-flagged fallback на `companyId`-only path.

## Переходная runtime policy

На период миграции должны быть зафиксированы четыре правила:
- `tenantId` = platform isolation key;
- `companyId` = business/legal association key и временный compatibility key;
- source of scope берётся только из runtime context, а не из payload;
- mismatch между `tenantId` и `companyId -> tenant` mapping логируется как инвариантное нарушение.

Обязательные механики:
- shadow-read для новых `tenantId` paths;
- shadow-write там, где `tenantId` уже добавлен;
- mismatch counters и alerts;
- feature-flagged fallback на старый `companyId` path;
- запрет на silent switch любой модели из `companyId`-only в `tenantId`-only без отдельного rollout gate.

## Волна 4. Нормализовать global/shared presets

Изменения:
- перестать кодировать global scope через `companyId = NULL`;
- ввести explicit scope types или preset tables;
- разделить global knowledge/config и tenant-local overrides.

Первый набор:
- `Rapeseed`
- `CropVariety`
- `BusinessRule`
- `RegionProfile`
- `InputCatalog`
- `HybridPhenologyModel`
- `Engram`
- `SemanticFact`
- global `AgentConfiguration` presets

Риск:
- средний, потому что код уже использует шаблон `OR: [{ companyId: null }, { companyId }]`.

Rollback:
- поддерживать compatibility read path, пока preset resolver не стабилен.

## Волна 5. Переводить operational aggregates выборочно

Не трогать сразу весь agronomy core.

Сначала кандидаты:
- `FrontOfficeThread` family;
- finance projections и часть event/control tables;
- только потом `Season`, `HarvestPlan`, `TechMap`, `Task`.

Почему так:
- agronomy graph сейчас самый сцепленный;
- tenant-refactor без projection cleanup там создаст blast radius.

## Риски совместимости

### Prisma Client
- новые nullable fields и новые индексы/уники меняют generated types;
- старые `where: { companyId, ... }` перестают быть полной правдой;
- dual-scope models потребуют service-layer compatibility wrappers.

### Сервисный слой
Особенно затронутся:
- `shared/prisma/prisma.service.ts`
- `shared/tenant-context/**`
- `modules/explainability/**`
- `modules/rai-chat/runtime-governance/**`
- `shared/memory/**`
- `shared/outbox/**`

### API / JWT
Сегодня token фактически несет active tenant как `companyId`.

Целевой переход:
- JWT должен содержать и `tenantId`, и `companyId`, пока идет миграция.
- внешние API не должны почувствовать смену внутренней boundary-модели.

## Разбор специальных моделей

### `Company`
Целевая роль:
- business/legal organization entity;
- не platform tenant root.

### `TenantState`
Целевая роль:
- должен стать `tenantId`-keyed;
- current keying by `companyId` - прямое доказательство смешения границ.

### `EventConsumption`
Целевая роль:
- idempotency / consumption log;
- integration-control data;
- либо non-tenant с optional tenant reference для reporting, либо tenant-scoped явно через `tenantId`.
- текущая dual-classification должна быть исправлена до любых дальнейших migration steps.

### `AgentConfiguration` и binding tables
Целевая роль:
- tenant-scoped control-plane;
- global presets через явную preset/scope model, а не через nullable `companyId`.

### `Engram` и `SemanticFact`
Целевая роль:
- explicit knowledge scope:
  - tenant-local,
  - platform-global preset,
  - при необходимости anonymized network scope.
- nullable `companyId` для этого недостаточен.

## Rollback-safe правило

Пока migration не доказан:
- `companyId` остается совместимым write path;
- `tenantId` - additive и shadowed;
- ни один unique/RLS path не должен становиться `tenantId`-only до shadow validation;
- внешние API не меняются.

## Финальная рекомендация

Целевое состояние:
- `Tenant` - platform boundary;
- `Company` - business/legal identity;
- control-plane, incident, AI runtime, memory и integration-control переводятся первыми;
- agronomy и finance core переводятся позже и только после cleanup read-model seams;
- `MG-Core` не участвует в active tenancy logic.
