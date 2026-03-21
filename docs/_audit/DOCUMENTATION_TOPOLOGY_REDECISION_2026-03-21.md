---
id: DOC-ARV-TOPOLOGY-REDECISION-20260321
layer: Archive
type: Research
status: approved
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-21
---
# DOCUMENTATION TOPOLOGY REDECISION 2026-03-21

## Решение

Сжатая схема, в которой активными считались почти только `00_CORE`, `01_ARCHITECTURE`, `04_AI_SYSTEM`, `05_OPERATIONS`, `11_INSTRUCTIONS`, признана недостаточной.

Причина:
- она смешала `not verified runtime truth` с `not important`
- из-за этого стратегические, доменные, execution и frontend-пакеты были вытеснены в архив
- агентный и продуктовый контур потеряли доступ к действующей логике intent и planning

## Новая рабочая топология

| Слой | Роль | Режим доверия | Решение |
|---|---|---|---|
| `00_CORE` | cross-cutting canon и минимальный truth-контур | verified operational canon | активный |
| `00_STRATEGY` | бизнес-логика, consulting, front-office, Stage 2 AI/agent canon, vision, roadmap | active intent / planning | активный |
| `01_ARCHITECTURE` | ADR, topology, HLD, database contracts, invariants | verified operational canon | активный |
| `02_DOMAINS` | доменные модели, policy, guides, domain semantics | active design knowledge | активный |
| `02_PRODUCT` | UX/UI, bot behavior, product surfaces | active design knowledge | активный |
| `03_ENGINEERING` | implementation specs, technical contracts, technical audits | active design knowledge | активный |
| `04_AI_SYSTEM` | code-proximate AI runtime truth и QA по agent contour | verified operational canon | активный |
| `05_OPERATIONS` | runbooks, operational policy, risk register | verified operational canon | активный |
| `06_METRICS` | KPI, success metrics, quality gates | active planning / evaluation | активный |
| `07_EXECUTION` | WBS, rollout plans, delivery checklists, phase packets | active delivery knowledge | активный |
| `08_TESTING` | formal test matrices, audits, test specs | active verification knowledge | активный |
| `10_FRONTEND_MENU_IMPLEMENTATION` | master menu map, screen contracts, frontend integration package | active product/frontend package | активный |
| `11_INSTRUCTIONS` | step-by-step instructions, agent playbooks, enablement | active execution standard | активный |
| `06_ARCHIVE` | historical snapshots, raw research, prompts, dated audits, root-drop | historical / raw context only | архив |

## Физические переносы

Из `docs/06_ARCHIVE/LEGACY_TREE_2026-03-20/` обратно в active tree возвращены:
- `00_STRATEGY`
- `02_DOMAINS`
- `06_METRICS`
- `07_EXECUTION`
- `08_TESTING`
- `10_FRONTEND_MENU_IMPLEMENTATION`

## Дополнительные решения

- `00_STRATEGY/STAGE 2` остаётся активным путём, потому что на него уже завязаны `11_INSTRUCTIONS`, memory-bank и агентные cross-links.
- `11_INSTRUCTIONS` остаётся отдельным активным слоем, а не частью архива.
- `06_ARCHIVE` больше не трактуется как “мусор”; это только слой исторического и raw-контекста.
- Planning-docs, domain-docs и frontend-docs считаются действующими документами, даже если они не являются прямым отражением текущего runtime.

## Практическое правило

Сначала искать ответ в активных слоях:
- `00_STRATEGY`
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

Архив читать, когда нужен:
- старый снимок состояния
- raw research
- dated audit
- prompt trail
- legacy reasoning, который ещё не поднят в активный слой
