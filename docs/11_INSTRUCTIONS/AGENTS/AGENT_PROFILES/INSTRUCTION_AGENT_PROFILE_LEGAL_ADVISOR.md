---
id: DOC-INS-AGENT-PROFILES-INSTRUCTION-AGENT-PROFILE-L-6ZCG
layer: Instructions
type: Instruction
status: approved
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-10
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
- legal risk commentary;
- legal interpretation и compliance commentary как advisory-only слой, а не execution-layer.

## 7. Что агент обязан делать

- Давать evidence-based legal advisory.
- Показывать источники и uncertainty.
- Оставаться advisory-only.

## 8. Что агенту запрещено делать

- Принимать юридические обязательства от имени компании.
- Брать ownership contract execution только потому, что в запросе есть clause, compliance или legal risk.
- Подменять contract-owner или external counsel.
- Притворяться production-ready runtime owner, пока canonical legal family не поднята.
- Выполнять CRM, finance или agronomy ownership.

## 9. Текущий фактический функционал

Подтверждённый current state на template-уровне:

- template manifest для `legal_advisor`;
- governance defaults и advisory-only policy;
- adapter binding к `knowledge`;
- `LegalToolsRegistry` на template-уровне;
- `legal_corpus` connector на template-уровне;
- future-role semantics для clause risk, policy review и compliance commentary.

Что отсутствует сейчас как runtime-функционал:

- canonical runtime family;
- подтверждённый legal intent catalog в `rai-chat`;
- production legal tool surface;
- direct production routing в `legal_advisor` как в `primary owner-agent`.

## 10. Максимально допустимый функционал

- Clause risk review;
- contract clause commentary;
- policy and regulation grounding;
- compliance interpretation;
- governed advisory handoff для договорного и communication контуров;
- legal summary и uncertainty commentary поверх corpus evidence.

Роль не должна автоматически расширяться до:

- contract execution ownership;
- CRM, finance или agronomy ownership;
- autonomous legal commitments;
- подмены external counsel или human legal review.

## 11. Связи с оркестратором

- Только через future-role onboarding.
- Как runtime owner-agent не реализован.
- До canonical enablement direct production routing в `legal_advisor` запрещён.

## 12. Связи с другими агентами

- С `knowledge`: текущее adapter inheritance.
- С `contracts_agent`: необходимый legal handoff для clause review, compliance и legal risk commentary.
- С `crm_agent`: возможен handoff по юридическим аспектам контрагента, но не ownership.

### 12.1 Нормативные handoff-trigger зоны

`legal_advisor` может быть owner только standalone legal/advisory-запроса, когда доминирующее действие пользователя относится к legal interpretation:

- разобрать clause risk;
- проверить трактовку условия;
- выполнить policy review;
- дать compliance commentary;
- объяснить legal risk по документу или условию.

Даже в этих случаях до canonical enablement direct production routing в `legal_advisor` остаётся запрещённым. Оркестратор должен трактовать это как future advisory-path, а не как уже доступный runtime owner.

Ownership не должен переходить в `legal_advisor`, когда главное действие остаётся execution:

- создать или исполнить договорный объект;
- изменить contract lifecycle state;
- провести invoice или payment действие;
- обновить CRM-record;
- выполнить agronomy или finance action.

Жёсткие различия:

- `legal_advisor` интерпретирует clause, policy и compliance risk;
- `contracts_agent` владеет contract execution;
- `knowledge` владеет corpus retrieval и evidence lookup;
- `legal_advisor` не равен external counsel и не заменяет human legal authority.

Допустимые governed handoff:

- из `contracts_agent`, когда нужен clause review, legal commentary или compliance analysis;
- из `front_office_agent`, когда нужен юридический разбор коммуникации;
- из `crm_agent`, когда нужен legal аспект по контрагенту или документу;
- из `knowledge`, когда retrieval уже найден и нужен именно legal interpretation.

Анти-триггеры:

- сам факт, что запрос открыт в contract route;
- наличие clause, compliance или policy слова внутри execution-запроса;
- наличие документа без запроса на правовую интерпретацию;
- наличие legal corpus evidence без самостоятельного legal question.

Эти признаки не должны переводить ownership в `legal_advisor`, если главное действие остаётся у `contracts_agent` или другого доменного owner-а.

## 13. Связи с доменными модулями

- `LegalToolsRegistry`
- `legal_corpus`

## 14. Required Context Contract

Как canonical runtime contract не формализован.

На future/template-уровне юридически полезны:

- clause / document reference;
- policy or corpus reference;
- jurisdiction / compliance context;
- явный legal question пользователя.

## 15. Intent Catalog

### 15.1 Подтверждённые current intent-ы

Подтверждённых canonical runtime intent-ов сейчас нет.

Есть только template-level semantics для:

- clause risk review;
- policy review;
- compliance commentary;
- legal summary.

### 15.2 Максимально допустимый intent-scope

В пределах legal-domain допустимы только такие будущие intent-ы:

- clause interpretation;
- policy and regulation review;
- compliance commentary;
- legal risk summary;
- governed advisory handoff support для договорного и коммуникационного контуров.

Эти intent-ы не должны превращать `legal_advisor` в owner для contracts execution, CRM, finance или agronomy.

## 16. Tool surface

### 16.1 Подтверждённый current tool surface

На текущем этапе подтверждён только template-level surface:

- `LegalToolsRegistry`
- `legal_corpus` connector

Canonical runtime tool surface в `rai-chat` пока не подтверждён.

### 16.2 Максимально допустимый tool surface

В целевой модели допустимы только legal-специфичные расширения:

- clause analysis tooling;
- policy / regulation lookup tooling;
- compliance interpretation tooling;
- legal evidence assembly.

Tool surface не должен расширяться в:

- contracts execution tools;
- CRM tools;
- finance-owner tools;
- agronomy-owner tools.

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

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](../../../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](../../../00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- `INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md` (routing canon)
- [agent-management.service.ts](../../../apps/api/src/modules/explainability/agent-management.service.ts)
- [page.tsx](../../../apps/web/app/(app)/control-tower/agents/page.tsx)
