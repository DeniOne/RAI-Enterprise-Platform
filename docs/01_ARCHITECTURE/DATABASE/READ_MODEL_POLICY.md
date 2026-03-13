# READ_MODEL_POLICY

## Purpose

Read-model layer нужен для ускорения устойчивых чтений.
Он не нужен для того, чтобы скрыть плохую доменную модель под ещё одним хаотичным слоем таблиц.

## Hard rules

Read model / projection можно создавать только если выполняется хотя бы одно условие:
- есть тяжёлое cross-domain чтение;
- есть стабильный UI/workspace use-case;
- есть повторяющийся аналитический или операционный view.

Read model не может:
- быть источником истины;
- содержать уникальные бизнес-инварианты, которых нет в source aggregates;
- становиться способом обойти ownership domains;
- заменять отсутствующую нормальную модель JSONB-слоем.

## Required metadata

Для каждой projection обязательно фиксировать:
- `name`
- `owner_domain`
- `use_case`
- `source_of_truth`
- `refresh_sla`
- `refresh_mechanism`
- `deterministic_rebuild`
- `retention_policy`
- `consumers`
- `rollback_strategy`

Без этой metadata projection запрещена.

## Allowed implementation patterns

Допустимые способы реализации:
- materialized view;
- table populated by outbox/event consumer;
- rebuildable table populated by deterministic projection job;
- API-layer cached projection, если persistence не нужна.

Недопустимые способы:
- ad hoc shadow table без owner и rebuild contract;
- projection, обновляемая вручную из нескольких сервисов;
- projection, которая меняется как write model.

## Approved first candidates

На первом проходе допускаются только следующие категории:
- planning workspace projection:
  - `HarvestPlan`
  - latest `TechMap`
  - `BudgetPlan`
  - summary по `DeviationReview`
  - `HarvestResult`
- party workspace projection:
  - `Party`
  - `Jurisdiction`
  - `RegulatoryProfile`
  - `PartyRelation`
  - contract role summary
  - financial exposure summary
- front-office operator projection:
  - `FrontOfficeThread`
  - latest message preview
  - unread counts
  - current handoff status
  - farm/account owner summary
- runtime governance projection:
  - `RuntimeGovernanceEvent`
  - `SystemIncident`
  - `PendingAction`
  - reliability aggregates

## Ownership rule

У каждой projection есть один owner domain.

Примеры:
- planning workspace projection владеет `agri_execution` или `agri_planning`, в зависимости от use-case;
- party workspace projection владеет `crm_commerce`;
- runtime governance projection владеет `ai_runtime`.

Если owner неясен, projection создавать нельзя.

## Rebuild rule

Каждая projection должна быть детерминированно пересобираема из source-of-truth данных.

Если projection нельзя пересобрать:
- это не projection;
- это новый system-of-record;
- значит архитектурное решение принято неверно.

## CI / review gates

Перед добавлением новой projection нужны:
- ссылка на ADR или approved design note;
- заполненная metadata-карточка;
- owner domain approval;
- описание source-of-truth и rebuild path;
- оценка write-cost и storage-cost.

## Sunset rule

Projection должна удаляться, если:
- use-case больше не существует;
- тот же результат доступен через более простой bounded query path;
- projection стала дублировать другой projection layer без отдельной ценности.
