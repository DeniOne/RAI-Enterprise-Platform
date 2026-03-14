# Рационализация enum

## Жесткий вывод

Проблема не в том, что enum много.
Проблема в том, что в enum сейчас перемешаны:
- технические lifecycle/FSM состояния,
- бизнес-справочники,
- evolving vocabularies,
- reporting labels,
- локальные терминологии доменов.

Подтвержденные факты:
- current contour: `149` enum.
- MG-Core contour: `52` enum.
- в current contour уже есть overlapping family для risk/severity/status/liability/source.
- literal defect `BudgetCategory` (`FERTILIZER/FERTILIZERS`) закрыт в Phase 5 migration wave `20260313214500_phase5_budget_category_literal_fix`.

## Критерии решений

## `closed technical enum`
Оставлять enum, если одновременно верно:
- значения привязаны к коду, инвариантам, FSM или DB-ограничениям;
- значения меняются редко;
- tenant-ом не кастомизируются;
- это не словарь предметной области;
- добавление нового значения - это осознанное кодовое изменение.

Примеры:
- `OutboxStatus`
- `RuntimeGovernanceEventType`
- `SeasonStatus`
- `TechMapStatus`
- `HarvestPlanStatus`
- `TaskStatus`
- `InvoiceStatus`
- `CommerceObligationStatus`
- `AgentConfigChangeStatus`
- `ModelStatus`

## `evolving business vocabulary`
Не держать как enum, если верно хотя бы одно:
- словарь растет вместе с продуктом, географией, культурами, юридическими режимами;
- нужны локализация, deprecation, tenant customization или gradual rollout;
- это скорее reference data, чем control flow;
- изменение словаря не должно требовать жесткой schema migration.

Примеры:
- agronomy catalogs;
- observation/evidence taxonomies;
- часть CRM/commerce vocabularies;
- knowledge/reporting source categories.

## Оставить как есть

### Workflow/FSM/lifecycle enum
Оставить enum:
- `SeasonStatus`
- `TechMapStatus`
- `HarvestPlanStatus`
- `TaskStatus`
- `BudgetStatus`
- `InvoiceStatus`
- `PaymentStatus`
- `CommerceContractStatus`
- `CommerceObligationStatus`
- `ChangeOrderStatus`
- `ApprovalDecision`
- `AgentConfigChangeStatus`
- `ModelStatus`
- `TrainingStatus`

### Technical/control enum
Оставить enum:
- `OutboxStatus`
- `RuntimeGovernanceEventType`
- `CashFlowType`
- `CashDirection`
- MG-Core: `AuthSessionStatus`, `OrderStatus`, `ProductionOrderStatus`, `WorkOrderStatus`, `QualityResult`

### Security/role enum
Оставить enum пока роли остаются code-bound:
- `UserRole`
- MG-Core `UserRole`

## Объединить

### Семейство risk/severity
Подтвержденный overlap cluster:
- `RiskCategory`
- `RiskLevel`
- `ImpactLevel`
- `RiskSeverity`

Пересечение literals:
- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

Решение:
- оставить один канонический severity/risk level enum;
- остальные либо удалить, либо оставить только если реально различается семантика, а не слова.

Рекомендуемый target:
- один `SeverityLevel` или один `RiskLevel` как shared scale.

### Семейство liability/responsibility
Подтвержденный overlap cluster:
- `LiabilityMode`
- `ResponsibilityMode`

Решение:
- если одно означает legal liability, а другое workflow ownership, их значения должны радикально отличаться.
- в текущем виде это почти дубль.
- оставить один enum для liability allocation, operational ownership выражать явными полями и ролями.

### Knowledge source family
Подтвержденный overlap cluster:
- `KnowledgeNodeSource`
- `KnowledgeEdgeSource`

Решение:
- collapse в один source taxonomy, если нет доказанной причины держать два.

## Переименовать / нормализовать

Переименования и чистка:
- `RiskCategory` - либо реально taxonomy, либо убрать конфликт с severity semantics.
- `RiskSeverity` - убрать, если остается канонический severity enum.
- `ResponsibilityMode` - убрать или переименовать, если это на самом деле liability allocation.
- `StrategicValue` - слишком расплывчатое имя; если остается enum, нужно сделать более явным.

Литеральная чистка:
- `BudgetCategory` уже нормализован до канонического `FERTILIZER`.
- любые enum с alias-like значениями должны быть нормализованы до дальнейшего reuse.

## Перевести в reference/config tables

### Agronomy vocabularies
Сильные кандидаты на вывод из enum:
- `CropType`
- `SoilType`
- `SoilGranulometricType`
- `ClimateType`
- `InputType`
- `OperationType`
- `ApplicationMethod`

Почему:
- это growing domain vocabulary, а не кодовый инвариант.
- новые культуры, новые типы inputs и новые agronomy patterns будут добавляться.

### Observation/evidence vocabularies
Перевести в dictionary layer:
- `ObservationType`
- `ObservationIntent`
- `EvidenceType`

Почему:
- это capture/reporting taxonomy;
- нужен controlled growth, deprecation и при необходимости локализация.

### CRM/commerce vocabularies
Кандидаты:
- `PartyEntityType`
- `PartyRelationType`
- `AssetPartyRoleType`
- `ContactRole`
- `InteractionType`
- `CommerceEventType`

Почему:
- эти словари будут расширяться по мере роста commerce/legal surface.

## Слишком узкие или подозрительно локальные enum

Нуждаются в переоценке:
- `StrategicValue`
- `ConfidenceLevel`
- `ObservationIntent`
- `AssetStatus`
- `MachineryType`
- MG-Core `TargetMetric`, если это не реально closed set

Правило:
- если enum живет в основном для UI/filter/reporting, а не для строгого control flow, это кандидат на dictionary table.

## Подтвержденные overlap clusters

Из schema inspection:
- `RiskCategory` <-> `RiskLevel` <-> `ImpactLevel` <-> `RiskSeverity`
- `LiabilityMode` <-> `ResponsibilityMode`
- `KnowledgeNodeSource` <-> `KnowledgeEdgeSource`
- `TaskStatus` <-> `TrainingStatus` делят общие lifecycle literals, но merge допустим только если workflows реально одинаковы
- `AgentProductionDecision` <-> `OverrideStatus`
- `HarvestPlanStatus` <-> `ProtocolStatus`
- `TechMapStatus` <-> `ProtocolStatus`
- `GoalStatus` <-> `ModelStatus` частично пересекаются на `DRAFT/ACTIVE/ARCHIVED`

Вывод:
- часть кластеров надо merge;
- часть не надо merge, но они доказывают отсутствие enum governance.

## Что оставить отдельно, даже если literals похожи

Не надо механически объединять всё похожее:
- `HarvestPlanStatus`, `TechMapStatus`, `BudgetStatus`, `ProtocolStatus` не обязаны становиться одним giant enum.
- Но их надо подчинить одному naming standard и lifecycle policy.

Нормальное состояние:
- разные домены могут иметь разные status enum;
- нельзя, чтобы они бесконтрольно дублировали одни и те же слова с разным смыслом.

## MG-Core: отдельные замечания

MG-Core enum surface меньше и в целом чище.

Причина:
- там больше HR, personnel, learning, MES lifecycle enum;
- меньше попыток запихнуть evolving vocabularies в один монолитный business schema.

Но:
- эти enum contour-local;
- они не являются готовым reusable standard для current contour;
- naming/style у MG-Core другой.

## Безопасные правила миграции

1. Не заменять workflow enum на dictionary table, пока workflow invariants не переехали вместе с ним.
2. Не объединять enum только потому, что literals похожи.
3. Не расширять бизнес-словари бесконечными enum migrations, если это уже reference data.
4. Нормализовать literals до начала tenancy/domain refactor, иначе грязь будет перенесена в новую архитектуру.
5. Двигаться additive-first:
   - создать dictionary tables;
   - backfill из enum;
   - переключить reads/writes;
   - только потом убирать enum-зависимость.

## Приоритет выполнения

### Priority 1
- canonical risk severity taxonomy;
- `LiabilityMode` vs `ResponsibilityMode`;
- knowledge source enum cleanup;
- `BudgetCategory` literal fix.

### Priority 2
- dictionary extraction для agronomy vocabularies;
- dictionary extraction для observation/evidence vocabularies;
- dictionary extraction для части CRM/commerce vocabularies.

### Priority 3
- единый naming standard для lifecycle enums.

## Финальная рекомендация

Оставлять enum там, где они несут кодовые инварианты.
Выносить enum там, где они подменяют собой vocabulary management.

Текущая схема страдает не от любви к типизации.
Она страдает от того, что enum используются как substitute для нормального слоя справочников и доменных словарей.
