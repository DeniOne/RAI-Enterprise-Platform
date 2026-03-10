---
id: DOC-INS-AGT-PROFILE-009
type: Instruction
layer: Agents
status: Active
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-08
---

# ИНСТРУКЦИЯ — ПРОФИЛЬ АГЕНТА LEGAL_ADVISOR

## 1. Назначение

Документ описывает plan/template-role `legal_advisor`.

## 2. Когда применять

Использовать документ при проектировании юридического owner-agent или legal handoff из других контуров.

## 3. Статус агента

- Статус: плановая template/future role.
- Runtime family: не реализована.
- Owner domain в template: `legal`.
- Execution adapter: `knowledge`.

## 4. Стратегический образ агента в Stage 2

Роль нужна для:

- анализа условий и оговорок;
- legal risk review;
- policy/corpus grounding;
- evidence-first advisory без автономных обязательств.

## 5. Фактическое состояние агента по коду

В коде есть template с:

- `ownerDomain: legal`
- `LegalToolsRegistry`
- `legal_corpus` connector
- strict advisory governance

Нет:

- canonical runtime role;
- legal routing owner;
- production legal tool surface в `rai-chat`.

## 6. Домены ответственности

- clauses;
- policies;
- legal requirements;
- legal risk commentary.

## 7. Что агент обязан делать

- Давать evidence-based legal advisory.
- Показывать источники и uncertainty.
- Оставаться advisory-only.

## 8. Что агенту запрещено делать

- Принимать юридические обязательства от имени компании.
- Подменять contract-owner или external counsel.
- Выполнять CRM, finance или agronomy ownership.

## 9. Текущий фактический функционал

- Template manifest;
- governance defaults;
- adapter binding к `knowledge`.

## 10. Максимально допустимый функционал

- Clause risk review;
- contract clause commentary;
- policy and regulation grounding;
- governed handoff для договорного контура.

## 11. Связи с оркестратором

- Только через future-role onboarding.
- Как runtime owner-agent не реализован.

## 12. Связи с другими агентами

- С `knowledge`: текущее adapter inheritance.
- С `contracts_agent`: необходимый legal handoff для clause review, compliance и legal risk commentary.
- С `crm_agent`: возможен handoff по юридическим аспектам контрагента, но не ownership.

## 13. Связи с доменными модулями

- `LegalToolsRegistry`
- `legal_corpus`

## 14. Required Context Contract

Не формализован как canonical runtime contract.

## 15. Intent Catalog

Не формализован как canonical runtime catalog.

## 16. Tool surface

- `LegalToolsRegistry`
- `legal_corpus` connector

## 17. UI surface

- Пока только onboarding.
- Legal work windows ещё не подтверждены.

## 18. Guardrails

- `legal_decisions_require_human_review`
- `no_autonomous_legal_commitments`
- только advisory path

## 19. Основные риски и failure modes

- Путаница между advisory и legal authority.
- Попытка закрыть contract ownership одной only-template role.
- Отсутствие canonical legal owner при наличии продукта и модулей.

## 20. Требования к тестам

- Template validation.
- Governance validation.
- В будущем: clause regression set и corpus grounding tests.

## 21. Критерии production-ready

- Canonical runtime role.
- Legal contracts и routing owner.
- Corpus-backed evidence path.
- Жёсткий human review gate.

## 22. Связанные файлы и точки кода

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [agent-management.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/agent-management.service.ts)
- [page.tsx](/root/RAI_EP/apps/web/app/(app)/control-tower/agents/page.tsx)
