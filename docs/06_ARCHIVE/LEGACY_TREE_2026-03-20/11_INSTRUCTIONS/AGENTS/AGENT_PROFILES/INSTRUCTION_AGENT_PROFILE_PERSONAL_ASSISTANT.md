---
id: DOC-INS-AGENT-PROFILES-INSTRUCTION-AGENT-PROFILE-P-VITX
layer: Instructions
type: Instruction
status: approved
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-10
---
# ИНСТРУКЦИЯ — ПРОФИЛЬ АГЕНТА PERSONAL_ASSISTANT

## 1. Назначение

Документ описывает plan/template-role `personal_assistant`.

## 2. Когда применять

Использовать документ при проектировании личного delegated-assistant контура и при разведении его границ с business owner-agents.

## 3. Статус агента

- Статус: плановая template/future role.
- Runtime family: не реализована.
- Owner domain в template: `personal_ops`.
- Execution adapter: `knowledge`.

## 4. Стратегический образ агента в Stage 2

Роль нужна для:

- personal tasks;
- agenda coordination;
- delegated summaries;
- reminders;
- personal productivity в узких и privacy-safe границах без перехвата бизнес ownership.

## 5. Фактическое состояние агента по коду

Подтверждён только как onboarding template:

- `ownerDomain: personal_ops`
- `profileId: personal-assistant-runtime-v1`
- `executionAdapterRole: knowledge`
- `ProductivityToolsRegistry`
- connector `calendar_read_model` в режиме `read`
- `personal-assistant-v1` output contract
- `personal-assistant-memory-v1`
- `personal-assistant-governance-v1`
- human gate rule `delegated_actions_require_confirmation`
- critical action rule `no_unreviewed_external_writes`
- fallback rule `use_context_summary_if_llm_unavailable`
- optional `personal-ops-adapter`

Canonical runtime role отсутствует.

## 6. Домены ответственности

- personal tasks;
- reminders;
- delegated summaries;
- agenda and lightweight coordination;
- personal context interpretation в делегированных границах, а не business execution.

## 7. Что агент обязан делать

- Работать только в делегированных и privacy-safe пределах.
- Уважать personal context и masking policy.
- Отделять summary и coordination от внешнего действия.
- Не совершать внешние writes без подтверждения.

## 8. Что агенту запрещено делать

- Выполнять unreviewed external writes.
- Захватывать ownership бизнес-доменов.
- Подменять `crm_agent`, `contracts_agent`, `economist`, `legal_advisor`, `front_office_agent` или другие owner-агенты.
- Притворяться production-ready runtime owner, пока canonical personal_ops family не поднята.
- Использовать personal contour как обход бизнес-guardrails.

## 9. Текущий фактический функционал

Подтверждённый current state на template-уровне:

- template manifest для `personal_assistant`;
- runtime defaults для будущего personal_ops-контура;
- adapter binding к `knowledge`;
- `ProductivityToolsRegistry` на template-уровне;
- read-only connector `calendar_read_model` со scope `events`, `availability`;
- `personal-assistant-v1` output contract с секциями `summary`, `tasks`, `constraints`, `next_steps`;
- memory policy `personal-assistant-memory-v1` со `scoped_recall`, `append_interaction` и `allow_masked_only`;
- governance defaults для delegated advisory-only path;
- optional `personal-ops-adapter` для deterministic formatting календаря и задач.

Что отсутствует сейчас как runtime-функционал:

- canonical runtime family;
- подтверждённый самостоятельный personal_ops intent catalog в `rai-chat`;
- production personal-assistant tool surface;
- direct production routing в `personal_assistant` как в `primary owner-agent`.

## 10. Максимально допустимый функционал

- Calendar and task summary;
- next-step planning;
- delegated reminders;
- lightweight coordination внутри user scope;
- read-only follow-up preparation;
- advisory handoff к доменным owner-агентам без подмены их ownership.

Роль не должна автоматически расширяться до:

- ownership над CRM, contracts, finance, legal, agronomy или monitoring;
- communicator ingress ownership у `front_office_agent`;
- retrieval ownership у `knowledge`;
- скрытого executive assistant, который исполняет business actions без подтверждения;
- bypass-path вокруг подтверждений и privacy restrictions.

## 11. Связи с оркестратором

- Сейчас только через onboarding template.
- В canonical runtime topology как отдельная family отсутствует.
- До canonical enablement direct production routing в `personal_assistant` запрещён.

## 12. Связи с другими агентами

- С `knowledge`: текущее template inheritance и retrieval support.
- С доменными owner-agents: только как потребитель их read-only результатов, а не владелец сценария.
- С `front_office_agent`: будущий restricted handoff по personal/delegated summaries, когда запрос не является business ingress.

### 12.1 Нормативные handoff-trigger зоны

`personal_assistant` может быть owner только standalone delegated/personal-запроса, когда доминирующее действие пользователя относится к personal coordination:

- собрать личную сводку по календарю и задачам;
- подготовить delegated reminder;
- оформить next steps по уже известному личному контексту;
- напомнить ограничения, встречи или availability;
- сделать read-only personal follow-up без бизнес-исполнения.

Даже в этих случаях до canonical enablement direct production routing в `personal_assistant` остаётся запрещённым. Оркестратор должен трактовать это как future delegated/personal path, а не как уже доступный runtime owner.

Ownership не должен переходить в `personal_assistant`, когда главное действие остаётся у доменного owner-а:

- обновить CRM record, account, contact или interaction;
- создать или исполнить договорный, invoice, payment или AR action;
- выполнить finance analysis, legal review, agronomy action или monitoring remediation;
- обработать communicator ingress, thread classification или escalation;
- найти документ, policy или corpus evidence как основной результат.

Жёсткие различия:

- `personal_assistant` нужен для delegated summaries, reminders и personal coordination;
- `front_office_agent` владеет communicator ingress и диалоговыми эскалациями;
- доменные owner-агенты владеют business decisions и execution;
- `knowledge` владеет retrieval и grounding;
- `personal_assistant` не должен превращаться в универсальный обходной агент для любых поручений пользователя.

Допустимые governed handoff:

- из любого owner-agent, когда нужен delegated summary или read-only follow-up по уже завершённому доменному результату;
- из `front_office_agent`, когда из входящего общения выделен именно personal/delegated запрос, а не business escalation;
- из `knowledge`, когда retrieval уже найден и нужен personal summary layer;
- в доменного owner-agent, когда personal discussion переходит в business action;
- в `knowledge`, когда personal request упирается в retrieval, policy или corpus lookup.

Анти-триггеры:

- наличие слов `напомни`, `задача`, `план`, если пользователь по сути просит business execution;
- наличие personal wording внутри CRM, contracts, finance или legal запроса;
- наличие календарного контекста без самостоятельного personal/delegated вопроса;
- наличие route `/dashboard/tasks` без смены доминирующего действия;
- наличие summary-вопроса, когда нужен owner-result другого домена, а не personal wrapper.

Эти признаки не должны переводить ownership в `personal_assistant`, если главное действие остаётся у доменного owner-а, `front_office_agent` или `knowledge`.

## 13. Связи с доменными модулями

- `ProductivityToolsRegistry`
- `calendar_read_model`
- будущий `personal-ops-adapter`

## 14. Required Context Contract

Как canonical runtime contract не формализован.

На future/template-уровне для personal/delegated разбора полезны:

- user-scoped task или calendar context;
- availability / event summary;
- privacy and masking constraints;
- explicit delegated question пользователя;
- граница между personal coordination и business action.

## 15. Intent Catalog

### 15.1 Подтверждённые current intent-ы

Подтверждённых canonical runtime intent-ов сейчас нет.

Есть только template-level semantics для:

- personal summary;
- delegated reminders;
- task and calendar overview;
- next-step coordination.

### 15.2 Максимально допустимый intent-scope

В пределах personal_ops-domain допустимы только такие будущие intent-ы:

- summarize_personal_context;
- prepare_delegated_reminder;
- review_calendar_constraints;
- outline_next_steps;
- governed advisory handoff support для personal/delegated follow-up.

Эти intent-ы не должны превращать `personal_assistant` в owner для CRM, contracts, finance, legal, agronomy, monitoring или front-office actions.

## 16. Tool surface

### 16.1 Подтверждённый current tool surface

На текущем этапе подтверждён только template-level surface:

- `ProductivityToolsRegistry`

Canonical runtime tool surface в `rai-chat` пока не подтверждён.

### 16.2 Максимально допустимый tool surface

В целевой модели допустимы только personal/productivity-специфичные расширения:

- calendar summary tooling;
- task prioritization tooling;
- delegated reminder tooling;
- personal context preparation tooling.

Tool surface не должен расширяться в:

- CRM-owner tools;
- contracts execution tools;
- finance-owner tools;
- legal-owner tools;
- monitoring-owner tools;
- external write tools без явного confirmation gate.

## 17. UI surface

- Пока только onboarding.
- Productized personal assistant windows ещё не подтверждены.

## 18. Guardrails

- `delegated_actions_require_confirmation`
- `no_unreviewed_external_writes`
- masked / privacy-safe sensitive data policy
- только delegated and read-safe path

## 19. Основные риски и failure modes

- Слишком широкий доступ к личным данным.
- Подмена personal assistance бизнес-ownership задачами.
- Ложное ощущение production-ready статуса из-за наличия template.
- Использование personal contour как обходного пути вокруг domain guardrails.

## 20. Требования к тестам

- Template validation.
- Governance validation.
- Privacy and masking validation.
- После enablement: delegated action, confirmation и routing regression tests.

## 21. Критерии production-ready

- Canonical runtime family.
- Личный context contract.
- Privacy-safe tool surface.
- Подтверждения на все внешние actions.
- Smoke-сценарии по summaries, reminders и delegated coordination.

## 22. Связанные файлы и точки кода

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](../../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](../../00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](../../00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- `INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md` (routing canon)
- [agent-management.service.ts](../../../apps/api/src/modules/explainability/agent-management.service.ts)
- [page.tsx](../../../apps/web/app/(app)/control-tower/agents/page.tsx)
