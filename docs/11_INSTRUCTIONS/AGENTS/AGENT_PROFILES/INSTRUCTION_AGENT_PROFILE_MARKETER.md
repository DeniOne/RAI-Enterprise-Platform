---
id: DOC-INS-AGENT-PROFILES-INSTRUCTION-AGENT-PROFILE-M-9IKI
layer: Instructions
type: Instruction
status: approved
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-10
---
# ИНСТРУКЦИЯ — ПРОФИЛЬ АГЕНТА MARKETER

## 1. Назначение

Документ описывает plan/template-role `marketer`.

## 2. Когда применять

Использовать документ при проектировании marketing owner-agent и при разведении границ между marketing advisory, CRM ownership и knowledge-based retrieval.

## 3. Статус агента

- Статус: плановая template/future role.
- Runtime family: не реализована как canonical.
- Owner domain в template: `marketing`.
- Execution adapter: `knowledge`.

## 4. Стратегический образ агента в Stage 2

Маркетинговый агент нужен для:

- campaign planning;
- funnel review;
- segment insights;
- messaging recommendations;
- marketing interpretation поверх CRM read model без автономного campaign execution.

## 5. Фактическое состояние агента по коду

Подтверждён только как onboarding template:

- `ownerDomain: marketing`
- `profileId: marketer-runtime-v1`
- `executionAdapterRole: knowledge`
- `MarketingToolsRegistry`
- connector `crm_read_model` в режиме `read`
- `marketer-v1` output contract
- `marketer-memory-v1`
- `marketer-governance-v1`
- human gate rule `campaign_launch_requires_human_gate`
- critical action rule `no_unreviewed_writes`
- fallback rule `use_read_model_summary_if_llm_unavailable`
- optional `marketing-domain-adapter`

Не реализовано:

- canonical runtime family;
- отдельный production owner-routing;
- подтверждённый marketing intent catalog в `rai-chat`;
- реальный runtime tool surface поверх template-level semantics.

## 6. Домены ответственности

- marketing;
- campaigns;
- segments;
- funnel review;
- messaging and recommendation layer поверх CRM read model, а не CRM record execution.

## 7. Что агент обязан делать

- Давать evidence-backed marketing advisory.
- Использовать CRM read model как источник контекста, а не как write-path.
- Отделять recommendations от execution.
- Оставаться в advisory-only контуре.

## 8. Что агенту запрещено делать

- Автономно запускать кампании.
- Делать uncontrolled writes.
- Брать ownership над CRM record management только потому, что запрос связан с лидами, аккаунтами или сегментами.
- Подменять `knowledge` в retrieval-задачах и `crm_agent` в карточечных действиях.
- Притворяться production-ready runtime owner, пока canonical marketing family не поднята.
- Уходить в finance, contracts или front-office execution без отдельного доменного owner-а.

## 9. Текущий фактический функционал

Подтверждённый current state на template-уровне:

- template manifest для `marketer`;
- runtime defaults для будущего marketing-контура;
- adapter binding к `knowledge`;
- `MarketingToolsRegistry` на template-уровне;
- read-only connector `crm_read_model` со scope `campaigns`;
- `marketer-v1` output contract с секциями `summary`, `recommendations`, `risks`, `evidence`, `next_steps`;
- memory policy `marketer-memory-v1` со `scoped_recall`, `append_summary` и `mask`;
- governance defaults для advisory-only marketing path;
- optional `marketing-domain-adapter` для campaign-specific deterministic enrichments.

Что отсутствует сейчас как runtime-функционал:

- canonical runtime family;
- подтверждённый самостоятельный marketing intent catalog в `rai-chat`;
- production tool surface, отделённый от template profile;
- direct production routing в `marketer` как в `primary owner-agent`.

## 10. Максимально допустимый функционал

- Campaign planning advisory;
- funnel review;
- messaging recommendations;
- segment and lead insights через governed read model;
- marketing summary и risk commentary;
- advisory handoff для CRM и knowledge contour.

Роль не должна автоматически расширяться до:

- CRM ownership у `crm_agent`;
- retrieval ownership у `knowledge`;
- finance analysis ownership у `economist`;
- direct campaign execution;
- contract, front-office или agronomy execution;
- скрытого runtime-дубля `crm_agent`.

## 11. Связи с оркестратором

- Сейчас только через future-role onboarding и adapter binding к `knowledge`.
- В canonical runtime topology как отдельная family отсутствует.
- До canonical enablement direct production routing в `marketer` запрещён.

## 12. Связи с другими агентами

- С `crm_agent`: будущий governed handoff по lead activity, campaign context и сегментам, которые привязаны к CRM records.
- С `knowledge`: текущее template execution inheritance и retrieval support.

### 12.1 Нормативные handoff-trigger зоны

`marketer` может быть owner только standalone marketing/advisory-запроса, когда доминирующее действие пользователя относится к marketing interpretation:

- предложить campaign concept;
- разобрать funnel и conversion narrative;
- подготовить messaging recommendations;
- объяснить segment-specific opportunity;
- собрать marketing summary по read-model данным без CRM write-действия.

Даже в этих случаях до canonical enablement direct production routing в `marketer` остаётся запрещённым. Оркестратор должен трактовать это как future marketing-path, а не как уже доступный runtime owner.

Ownership не должен переходить в `marketer`, когда главное действие остаётся у runtime owner:

- обновить карточку клиента, account, contact или CRM interaction;
- зарегистрировать lead-related действие в CRM;
- связать контрагента, relation или obligation в CRM-контуре;
- найти документ, политику, инструкцию или corpus evidence;
- выполнить front-office, finance, contracts или agronomy action.

Жёсткие различия:

- `marketer` нужен для campaign/funnel/segment advisory;
- `crm_agent` владеет CRM records, accounts, contacts, interactions и CRM follow-up;
- `knowledge` владеет retrieval, corpus lookup и grounding;
- `marketer` не должен превращаться в карточечный CRM owner только из-за marketing vocabulary.

Допустимые governed handoff:

- из `crm_agent`, когда CRM read model уже собран и нужен marketing advisory layer;
- из `knowledge`, когда retrieval уже найден и нужен marketing interpretation layer;
- в `crm_agent`, когда marketing discussion переходит в обновление карточки, lead activity или client workspace;
- в `knowledge`, когда marketing request упирается в policy, guideline, corpus lookup или evidence retrieval.

Анти-триггеры:

- наличие слов `campaign`, `segment`, `lead`, `funnel`, если пользователь по сути просит CRM-действие;
- наличие marketing route без смены доминирующего действия;
- наличие read-model summary без самостоятельного advisory-вопроса;
- наличие документа, регламента или policy без запроса именно на marketing recommendation;
- наличие client context, если пользователь хочет изменить CRM record, а не получить marketing interpretation.

Эти признаки не должны переводить ownership в `marketer`, если главное действие остаётся у `crm_agent`, `knowledge` или другого доменного owner-а.

## 13. Связи с доменными модулями

- `crm_read_model` connector
- `MarketingToolsRegistry`
- будущий `marketing-domain-adapter`

## 14. Required Context Contract

Как canonical runtime contract не формализован.

На future/template-уровне для marketing advisory полезны:

- campaign context или funnel slice;
- read-model summary по сегменту, лидам или активности;
- tenant / team / period context;
- evidence и risk notes;
- явный вопрос пользователя про campaign planning, funnel review или messaging.

## 15. Intent Catalog

### 15.1 Подтверждённые current intent-ы

Подтверждённых canonical runtime intent-ов сейчас нет.

Есть только template-level semantics для:

- campaign planning summary;
- funnel review;
- messaging recommendations;
- segment insights;
- marketing advisory summary.

### 15.2 Максимально допустимый intent-scope

В пределах marketing-domain допустимы только такие будущие intent-ы:

- plan_campaign_advisory;
- review_funnel;
- generate_messaging_recommendations;
- summarize_segment_insights;
- governed advisory handoff support для CRM и knowledge контуров.

Эти intent-ы не должны превращать `marketer` в owner для CRM writes, retrieval, finance analysis, contract execution или front-office actions.

## 16. Tool surface

### 16.1 Подтверждённый current tool surface

На текущем этапе подтверждён только template-level surface:

- `MarketingToolsRegistry`

Canonical runtime tool surface в `rai-chat` пока не подтверждён.

### 16.2 Максимально допустимый tool surface

В целевой модели допустимы только marketing-специфичные расширения:

- campaign planning tooling;
- funnel summary tooling;
- messaging recommendation tooling;
- segment insight tooling;
- advisory context preparation поверх read models.

Tool surface не должен расширяться в:

- CRM-owner tools для record updates;
- retrieval-owner tools;
- finance-owner tools;
- contracts execution tools;
- front-office execution tools;
- unreviewed campaign launch tools.

## 17. UI surface

- Пока только onboarding UX.
- Product UI для marketing work windows ещё не подтверждён.

## 18. Guardrails

- только advisory
- `campaign_launch_requires_human_gate`
- `no_unreviewed_writes`
- trace/evidence required

## 19. Основные риски и failure modes

- Путаница между marketing advisory и CRM record ownership.
- Попытка использовать marketing role как production owner без runtime family.
- Разрастание template-role в скрытый CRM-дубль.
- Подмена retrieval-задач маркетинговой ролью без самостоятельного marketing question.

## 20. Требования к тестам

- Template manifest validation.
- Governance validation.
- Output contract validation.
- После enablement: routing, no-write, read-model and advisory regression tests.

## 21. Критерии production-ready

- Собственный canonical runtime role.
- Focus/Intent/Context/UI contracts.
- Реальный marketing tool surface.
- Formal CRM handoff contract.
- Smoke-сценарии по campaigns, segments и funnel advisory.

## 22. Связанные файлы и точки кода

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](../../../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](../../../00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](../../../00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- `INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md` (routing canon)
- [agent-management.service.ts](../../../apps/api/src/modules/explainability/agent-management.service.ts)
- [page.tsx](../../../apps/web/app/(app)/control-tower/agents/page.tsx)
