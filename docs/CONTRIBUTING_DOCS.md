---
id: DOC-CORE-CONTRIBUTING-DOCS-20260320
layer: Meta
type: Navigation
status: approved
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-21
claim_id: CLAIM-CORE-CONTRIBUTING-DOCS
claim_status: asserted
verified_by: code
last_verified: 2026-03-21
evidence_refs: scripts/lint-docs.cjs;package.json
---
# CONTRIBUTING DOCS

## CLAIM
id: CLAIM-CORE-CONTRIBUTING-DOCS
status: asserted
verified_by: code
last_verified: 2026-03-21

## Source of Truth Order
1. `code/tests/gates`
2. `generated manifests`
3. `docs`

## Mandatory Contract
- Каждый CORE/SUPPORTING markdown-док обязан иметь claim metadata в frontmatter:
  - `claim_id`
  - `claim_status`
  - `verified_by`
  - `last_verified`
  - `evidence_refs`
- Каждый claim обязан быть зарегистрирован в `docs/DOCS_MATRIX.md`.
- Любой merge блокируется, если `pnpm lint:docs` красный.

## Root Policy
В `docs/` root разрешены только:
- `README.md`
- `INDEX.md`
- `DOCS_MATRIX.md`
- `CONTRIBUTING_DOCS.md`

Остальные файлы должны быть в слоях:
- `00_CORE`
- `00_STRATEGY`
- `01_ARCHITECTURE`
- `02_DOMAINS`
- `02_PRODUCT`
- `03_ENGINEERING`
- `04_AI_SYSTEM`
- `05_OPERATIONS`
- `06_METRICS`
- `07_EXECUTION`
- `08_TESTING`
- `10_FRONTEND_MENU_IMPLEMENTATION`
- `11_INSTRUCTIONS`
- `06_ARCHIVE`

## Layer Model
- Не все активные документы обязаны описывать текущий код.
- `00_STRATEGY`, `02_DOMAINS`, `02_PRODUCT`, `03_ENGINEERING`, `06_METRICS`, `07_EXECUTION`, `08_TESTING`, `10_FRONTEND_MENU_IMPLEMENTATION`, `11_INSTRUCTIONS` являются действующими слоями проектного знания.
- `00_CORE`, `01_ARCHITECTURE`, `04_AI_SYSTEM`, `05_OPERATIONS` и claim-managed документы других слоёв являются основным verified operational canon.
- Если документ описывает intent, план, доменную семантику, UX-логику или delivery-контур, он остаётся активным, даже если не является прямым зеркалом runtime.
- Только claim-managed документы и `code/tests/gates` можно цитировать как подтверждённую runtime truth.

## Freshness
SLA правила в `docs/05_OPERATIONS/DOC_FRESHNESS_SLA.md`.

## Archive Recovery
- `docs/06_ARCHIVE` не является operational truth, но является обязательным search-space для recovery исторической логики и intent-map.
- Сначала нужно читать активные слои `docs/00_STRATEGY`, `docs/02_DOMAINS`, `docs/07_EXECUTION`, `docs/10_FRONTEND_MENU_IMPLEMENTATION`, `docs/11_INSTRUCTIONS`.
- Если активные слои не объясняют business logic, agent logic, consulting logic, product intent или исходную архитектурную мотивацию, нужно читать `docs/06_ARCHIVE`.
- Архив можно использовать как контекст, но нельзя использовать как verified truth без перепроверки по `code/tests/gates` или без переноса тезиса в активные canonical docs.

## Instructions Layer
- `docs/11_INSTRUCTIONS` является активным, а не архивным слоем.
- Сюда относятся действующие agent instructions, enablement-документы, routing/playbook-документы и пошаговые стандарты исполнения.
- Если документ описывает, как правильно выполнять повторяемую рабочую процедуру, его место в `docs/11_INSTRUCTIONS`, а не в архиве.

## Frontend Implementation Layer
- `docs/10_FRONTEND_MENU_IMPLEMENTATION` является активным пакетом продуктово-фронтовой декомпозиции.
- Сюда относятся master menu map, screen-level contracts, кнопочные сценарии и integration maps.
- Это не архив и не мусор; это рабочий слой для синхронизации product intent с реальным frontend/backend контуром.

## Codex IDE Rule Source
Repo-level поведение Codex для этого проекта дополнительно зафиксировано в `/AGENTS.md`.
