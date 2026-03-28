---
id: DOC-CORE-RAI-EP-DOCUMENT-SYSTEM-MAP-20260328
layer: Architecture
type: Standards
status: approved
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-28
claim_id: CLAIM-CORE-RAI-EP-DOCUMENT-SYSTEM-MAP-20260328
claim_status: asserted
verified_by: manual
last_verified: 2026-03-28
evidence_refs: docs/README.md;docs/INDEX.md;docs/DOCS_MATRIX.md;docs/01_ARCHITECTURE/TOPOLOGY/LAYER_TYPE_MATRIX.md
---
# RAI_EP DOCUMENT SYSTEM MAP

## CLAIM
id: CLAIM-CORE-RAI-EP-DOCUMENT-SYSTEM-MAP-20260328
status: asserted
verified_by: manual
last_verified: 2026-03-28

## Назначение
Этот документ фиксирует карту канонических документов и правило, какой слой документации отвечает за какую роль в системе знаний `RAI_EP`.

## Главный принцип

- `code / tests / gates` = фактическая истина исполнения;
- `generated artifacts` = измеримая истина состояния и readiness;
- `canonical docs` = замысел, контракты, политики, архитектурные правила и roadmap;
- `docs/_audit` = датированные исследовательские и доказательные срезы, но не основной operational truth.

## Что куда класть

### `docs/00_CORE`

Здесь лежат документы, которые объясняют саму систему документов и базовые правила чтения.

Класть сюда:
- `RAI_EP_DOCUMENT_SYSTEM_MAP.md`
- `README.md` и `INDEX.md` как вход в документацию
- source-of-truth policy и порядок чтения

### `docs/00_STRATEGY`

Здесь лежат документы уровня north star и генерального плана.

Класть сюда:
- `RAI_EP_SYSTEM_BLUEPRINT_AND_GENERAL_PLAN.md`
- `RAI_EP_TARGET_OPERATING_MODEL.md`
- `RAI_EP_EXECUTION_ROADMAP.md`

### `docs/01_ARCHITECTURE`

Здесь лежат целевая карта системы и архитектурные границы.

Класть сюда:
- `RAI_EP_TARGET_ARCHITECTURE_MAP.md`
- runtime boundaries
- integration boundaries
- deployment topology overview

### `docs/02_DOMAINS`

Здесь лежат документы предметного ядра.

Класть сюда:
- `RAI_EP_TECHMAP_OPERATING_CORE.md`
- domain docs по season execution, finance/economy, CRM/front-office, legal events, knowledge

### `docs/04_AI_SYSTEM`

Здесь лежат документы по governed AI runtime.

Класть сюда:
- `RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md`
- eval suites
- routing policies
- incident model
- truthfulness policies

### `docs/05_OPERATIONS`

Здесь лежат release, compliance, deployment и operational readiness документы.

Класть сюда:
- `RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md`
- privacy, legal, transborder, backup, DR и installability runbooks
- access review, support boundary и release approval docs

### `docs/_audit`

Сюда остаются датированные audit snapshots.

Класть сюда:
- executive brief
- due diligence
- evidence matrix
- privacy/data-flow map
- RF compliance review
- AI failure scenarios
- delta vs baseline
- runtime map

Важно: audit-документы используются как evidence base, но не заменяют канонические стратегии и политики.

## Минимальный обязательный комплект

Чтобы система документации не была разрозненной, в активном контуре должны существовать и поддерживаться как минимум:

1. `docs/00_STRATEGY/RAI_EP_SYSTEM_BLUEPRINT_AND_GENERAL_PLAN.md`
2. `docs/00_STRATEGY/RAI_EP_TARGET_OPERATING_MODEL.md`
3. `docs/00_STRATEGY/RAI_EP_EXECUTION_ROADMAP.md`
4. `docs/01_ARCHITECTURE/RAI_EP_TARGET_ARCHITECTURE_MAP.md`
5. `docs/02_DOMAINS/RAI_EP_TECHMAP_OPERATING_CORE.md`
6. `docs/04_AI_SYSTEM/RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md`
7. `docs/05_OPERATIONS/RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md`

## Порядок чтения

1. `docs/00_CORE/RAI_EP_DOCUMENT_SYSTEM_MAP.md`
2. `docs/00_STRATEGY/RAI_EP_SYSTEM_BLUEPRINT_AND_GENERAL_PLAN.md`
3. `docs/00_STRATEGY/RAI_EP_TARGET_OPERATING_MODEL.md`
4. `docs/01_ARCHITECTURE/RAI_EP_TARGET_ARCHITECTURE_MAP.md`
5. `docs/02_DOMAINS/RAI_EP_TECHMAP_OPERATING_CORE.md`
6. `docs/04_AI_SYSTEM/RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md`
7. `docs/05_OPERATIONS/RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md`
8. `docs/00_STRATEGY/RAI_EP_EXECUTION_ROADMAP.md`
9. потом `docs/_audit/*` как доказательная база и текущий snapshot состояния

## Практическое правило обновления

- изменился стратегический замысел -> обновлять `docs/00_STRATEGY`
- изменились системные границы -> обновлять `docs/01_ARCHITECTURE`
- изменился доменный lifecycle -> обновлять `docs/02_DOMAINS`
- изменились AI policies -> обновлять `docs/04_AI_SYSTEM`
- изменились release/compliance правила -> обновлять `docs/05_OPERATIONS`
- появился новый проверочный snapshot -> добавлять его в `docs/_audit`
