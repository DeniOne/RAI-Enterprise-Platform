# RAI Agent Domain Ownership Map

> Версия: 1.0  
> Дата: 2026-03-09  
> Статус: Active Canon Input  
> Назначение: единая карта доменов платформы, owner-агентов, intent-owner и handoff paths для Stage 2.

---

## 1. Зачем нужен этот документ

Этот документ закрывает главный архитектурный разрыв Stage 2:

- доменные модули и UX-маршруты уже существуют;
- часть owner-агентов уже работает;
- часть future-role уже зафиксирована;
- но полной и явной `ownership map` по платформе до сих пор не было.

Без этого невозможно:

- честно понять, какой агент владеет каким доменом;
- определить owner для нового intent-а;
- отличить реальный agent path от route-based fallback;
- проектировать handoff без архитектурной каши;
- увидеть, какие домены уже покрыты, а какие ещё сироты.

Этот документ должен читаться вместе с:

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md)
- [A_RAI_AGENT_INTERACTION_BLUEPRINT.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/A_RAI_AGENT_INTERACTION_BLUEPRINT.md)
- [TRUTH_SYNC_STAGE_2_CLAIMS.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/TRUTH_SYNC_STAGE_2_CLAIMS.md)

---

## 2. Базовые определения

### 2.1 Domain owner

`Domain owner` — это агентный или системный владелец целого доменного контура.

Он отвечает за:

- первичный ownership сценариев этого домена;
- набор intent-owner;
- допустимые handoff;
- guardrails;
- продуктовую поверхность домена.

### 2.2 Owner-agent

`Owner-agent` — это канонический или плановый агент, который назначен основным исполнителем домена.

Категории:

- `canonical owner-agent` — уже реализован как runtime family;
- `future owner-agent` — зафиксирован как template/future role;
- `missing owner-agent` — домен есть, owner ещё не назначен как агент.

### 2.3 Intent owner

`Intent owner` — это агент, который имеет право быть primary executor для конкретного intent-а.

Правило:

- у каждого intent-а должен быть ровно один primary owner;
- secondary/handoff paths допустимы, но только через оркестратор.

### 2.3.1 Secondary read / evidence owner

`Secondary read / evidence owner` — это агент, который не владеет исполнением домена, но имеет право:

- читать контекст домена;
- обогащать ответ доказательствами;
- выполнять grounding;
- возвращать read-only материалы для primary owner.

Канонический пример:

- `knowledge` как evidence-owner для чужих доменов.

### 2.3.2 Secondary advisory owner

`Secondary advisory owner` — это агент, который не владеет write- или execution-path, но имеет право:

- интерпретировать результат чужого домена;
- давать advisory поверх primary owner данных;
- участвовать в governed handoff.

Канонические примеры:

- `economist` как interpretive owner для агро- или договорных последствий;
- `monitoring` как signal owner без business execution ownership.

### 2.4 Handoff path

`Handoff path` — это допустимая передача сценария из одного доменного owner-agent в другой.

Нормативная модель:

- `source agent -> orchestrator -> target agent`

Запрещённая модель:

- `source agent -> target agent` напрямую как скрытый peer-to-peer вызов.

### 2.5 System domain

Есть домены, которые не должны иметь business owner-agent.

Это:

- оркестрация;
- governance;
- explainability;
- identity и tenant infrastructure;
- системные supporting contours.

Для них owner существует как platform/system owner, а не как бизнес-агент.

### 2.6 Authority layers

Для каждого бизнес-домена нужно отдельно фиксировать:

- `read authority` — кто имеет право читать и использовать данные домена;
- `advisory authority` — кто имеет право интерпретировать домен без исполнения;
- `write authority` — кто имеет право выполнять управляемые изменения в этом домене.

Жёсткое правило:

- `domain owner` не всегда равен `write authority`;
- `read authority` и `advisory authority` не дают права захватывать ownership.

### 2.7 Fallback mode

Для каждого домена должен быть указан формализованный fallback mode:

- `NONE` — fallback не нужен, есть полноценный agent path;
- `READ_ONLY_SUPPORT` — возможна только вспомогательная read-only поддержка;
- `ROUTE_FALLBACK` — UI уходит в route-based fallback;
- `BACKLOG_ONLY` — система умеет только сформировать backlog или задачу без реального исполнения;
- `MANUAL_HUMAN_REQUIRED` — домен обслуживается только человеком или ручным процессом.

### 2.8 Gap severity

Разрывы ownership нужно ранжировать так:

- `CRITICAL`
- `HIGH`
- `MEDIUM`
- `LOW`
- `SYSTEM-SUPPORT`

---

## 3. Главные правила ownership map

1. Наличие модуля не означает наличие owner-agent.
2. Наличие template-role не означает наличие canonical runtime owner-agent.
3. У каждого продуктового intent-а должен быть primary owner.
4. У каждого бизнес-домена должны быть отдельно указаны `read authority`, `advisory authority` и `write authority`.
5. Между агентами не допускается свободная `all-to-all` mesh-связность.
6. Все handoff проходят через orchestration spine.
7. Если домен не имеет owner-agent, это не “частный UX-баг”, а архитектурный разрыв.
8. System domains не должны искусственно натягиваться на business owner-agent.
9. `Secondary read/evidence owner` и `secondary advisory owner` не могут переопределять primary owner.
10. Fallback mode обязан быть формализован, а не скрыт в prose.

---

## 4. Текущая топология ownership

### 4.1 Что подтверждено кодом

Канонические runtime-агенты:

- `agronomist`
- `economist`
- `knowledge`
- `monitoring`
- `crm_agent`

Источники:

- [agent-registry.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [agent-interaction-contracts.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)

Плановые future/template roles:

- `marketer`
- `strategist`
- `finance_advisor`
- `legal_advisor`
- `controller`
- `personal_assistant`

Источники:

- [agent-management.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/agent-management.service.ts)
- [page.tsx](/root/RAI_EP/apps/web/app/(app)/control-tower/agents/page.tsx)

### 4.2 Что подтверждено архитектурно

Ownership и handoff должны проходить через:

- `SupervisorAgent`
- `IntentRouterService`
- `AgentRuntimeService`
- `AgentExecutionAdapterService`

То есть текущая нормативная модель:

```text
Пользователь / UI
  -> Оркестратор
  -> Intent owner
  -> Tool / module path
  -> Result / clarification / handoff через оркестратор
```

---

## 5. Полная карта доменов платформы

Ниже перечислены бизнес-домены и системные домены платформы с текущим статусом ownership.

### 5.1 Бизнес-домены

| Домен | Основной scope | Связанные модули / маршруты | Primary owner-agent | Secondary read / evidence owner | Secondary advisory owner | Read authority | Advisory authority | Write authority | Fallback mode | Gap severity | Статус ownership | Комментарий |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `agronomy` | техкарты, поля, сезон, отклонения, агро-рекомендации | `consulting`, `tech-map`, `technology-card`, `agro-events`, `field-registry`, `field-observation`, `season`, `crop-variety`, `satellite`, `vision`, `/consulting/techmaps`, `/consulting/deviations` | `agronomist` | `knowledge` | `economist` | `agronomist`, `knowledge`, `monitoring` | `agronomist`, `economist` | `agronomist` | `NONE` | `MEDIUM` | `CANONICAL` | Owner подтверждён, но покрывает не весь агро-контур platform-wide. |
| `finance` | plan/fact, сценарии, risk assessment, финансовая аналитика | `finance-economy`, `/finance`, `/consulting/plans`, `/consulting/budgets`, `/consulting/results`, `/consulting/yield` | `economist` | `knowledge` | `strategist`, `finance_advisor` | `economist`, `knowledge`, `controller` | `economist`, `finance_advisor`, `strategist` | `economist` в пределах tools; транзакционный write не делегирован | `READ_ONLY_SUPPORT` | `MEDIUM` | `CANONICAL` | Owner подтверждён для core intents, но не для всего finance landscape. |
| `knowledge` | документы, политики, knowledge corpus, grounding | `knowledge`, `knowledge-graph`, `/knowledge` | `knowledge` | отсутствует | отсутствует | `knowledge` | `knowledge` | отсутствует | `READ_ONLY_SUPPORT` | `LOW` | `CANONICAL` | Это evidence-owner домен, а не operational write domain. |
| `monitoring` | сигналы, алерты, risk contour, monitoring summaries | `risk`, `/control-tower`, supporting monitoring routes | `monitoring` | `knowledge` | `controller`, `economist` | `monitoring`, `knowledge` | `monitoring`, `controller` | отсутствует | `READ_ONLY_SUPPORT` | `MEDIUM` | `CANONICAL` | Signal owner, не business execution owner. |
| `crm` | контрагенты, аккаунты, контакты, взаимодействия, обязательства, структуры | `crm`, `commerce/parties`, `client-registry`, `/consulting/crm`, `/crm`, `/parties` | `crm_agent` | `knowledge` | `economist` | `crm_agent`, `knowledge`, `monitoring` по сигналам | `crm_agent`, `economist` | `crm_agent` через governed CRM write path | `NONE` | `MEDIUM` | `CANONICAL` | Core CRM owner подтверждён. |
| `front_office` | входящие и исходящие сообщения, диалоги, классификация общения, task/process detection, эскалации | `front-office`, `telegram`, `task`, `advisory`, `/front-office` | `front_office_agent` | `knowledge` | `crm_agent`, `personal_assistant` | `front_office_agent`, `knowledge`, `crm_agent` по клиентскому контексту | `front_office_agent`, `crm_agent`, `personal_assistant` | только communicator log, thread state, escalation/task records своего домена | `MANUAL_HUMAN_REQUIRED` | `HIGH` | `CANONICAL FIRST WAVE` | Owner коммуникационного ingress уже реализован как canonical role первой волны; ещё не завершены Telegram adapter, отдельный thread store и полный task/handoff contour. |
| `contracts` | договоры, договорные роли, обязательства в контуре договора | `commerce`, `/commerce/contracts` | отсутствует | `knowledge` | `legal_advisor`, `economist` | route/module read и `knowledge` | `legal_advisor`, `economist` как future advisory | отсутствует | `ROUTE_FALLBACK` | `CRITICAL` | `MISSING OWNER` | Главный текущий разрыв: модуль есть, agent-owner нет. |
| `legal` | clauses, policy review, legal risk, legal corpus | `legal`, `/strategic/legal` | `legal_advisor` | `knowledge` | отсутствует | `legal_advisor`, `knowledge` | `legal_advisor` | отсутствует | `MANUAL_HUMAN_REQUIRED` | `HIGH` | `FUTURE ROLE` | Роль есть в template, canonical runtime owner ещё нет. |
| `strategy` | strategic scenarios, portfolio tradeoffs, initiatives | `strategic`, `rd`, `/strategy`, `/strategic/rd` | `strategist` | `knowledge` | `economist` | `strategist`, `knowledge` | `strategist`, `economist` | отсутствует | `MANUAL_HUMAN_REQUIRED` | `HIGH` | `FUTURE ROLE` | Роль есть, canonical owner-agent ещё нет. |
| `marketing` | campaigns, segments, funnel advisory | supporting front-office routes, CRM read models | `marketer` | `crm_agent`, `knowledge` | отсутствует | `marketer`, `crm_agent`, `knowledge` | `marketer` | отсутствует | `BACKLOG_ONLY` | `MEDIUM` | `FUTURE ROLE` | На уровне template уже зафиксирован. |
| `control` | сверки, control exceptions, управляемые эскалации | `finance-economy`, `risk`, control-related workflows | `controller` | `monitoring`, `knowledge` | `economist` | `controller`, `monitoring`, `knowledge` | `controller`, `economist` | отсутствует | `READ_ONLY_SUPPORT` | `HIGH` | `FUTURE ROLE` | Логически отдельный домен, но runtime family ещё нет. |
| `personal_ops` | tasks, reminders, delegated summaries, personal coordination | `task`, `/dashboard/tasks`, calendar read model | `personal_assistant` | `knowledge` | отсутствует | `personal_assistant`, `knowledge` | `personal_assistant` | отсутствует без подтверждения | `MANUAL_HUMAN_REQUIRED` | `MEDIUM` | `FUTURE ROLE` | Личный контур, не бизнес-owner для доменных операций. |
| `hr` | кадровые сценарии | `hr`, `/hr` | отсутствует | `knowledge` | отсутствует | module/UI read | отсутствует | отсутствует | `MANUAL_HUMAN_REQUIRED` | `MEDIUM` | `NO AGENT YET` | Домен есть в платформе, но agent ownership не формализован. |
| `exploration` | exploration / research views | `exploration`, `/exploration` | отсутствует | `knowledge` | `strategist` потенциально | module/UI read | отсутствует | отсутствует | `BACKLOG_ONLY` | `LOW` | `NO AGENT YET` | Доменно присутствует, agent-owner не определён. |

### 5.2 Системные и платформенные домены

| Домен | Scope | Текущий owner | Нужен ли business owner-agent | Комментарий |
|---|---|---|---|---|
| `orchestration` | routing, runtime, adapter, supervisor | platform orchestration spine | нет | Это системный owner, а не бизнес-агент. |
| `governance` | change requests, eval, canary, promote/rollback | explainability / governance contour | нет | Это policy/system ownership. |
| `explainability` | traces, evidence, BS%, panels, forensics | explainability contour | нет | Не должен подменяться бизнес-агентом. |
| `identity` | tenant, auth, rights, user context | identity / tenant infrastructure | нет | Системная зона. |
| `integrity` | policy integrity и technical safety | integrity contour | нет | Системная зона. |
| `health` | health checks, diagnostics, readiness | health module / infra contour | нет | Это системный support domain, а не бизнес-домен без owner-agent. |
| `telegram` | channel integration | telegram integration layer | нет | Канал, а не бизнес-domain owner. |
| `adaptive_learning` | learning support / meta-contour | adaptive-learning | нет | Не business owner-agent. |
| `generative_engine` | provider/runtime support | platform layer | нет | Инфраструктурный контур. |

---

## 6. Карта owner-agent по intent-ам

### 6.1 Подтверждённые current intent owners

| Intent | Domain | Primary owner-agent | Secondary read / evidence owner | Secondary advisory owner | Write authority | Статус | Комментарий |
|---|---|---|---|---|---|---|---|
| `tech_map_draft` | `agronomy` | `agronomist` | `knowledge` | `economist` | `agronomist` | `CONFIRMED` | Канонический agronomy intent. |
| `compute_deviations` | `agronomy` | `agronomist` | `knowledge` | `economist` | `agronomist` | `CONFIRMED` | Канонический agronomy intent. |
| `compute_plan_fact` | `finance` | `economist` | `knowledge` | отсутствует | `economist` в deterministic scope | `CONFIRMED` | Канонический finance intent. |
| `simulate_scenario` | `finance` | `economist` | `knowledge` | `strategist` потенциально | `economist` в deterministic scope | `CONFIRMED` | Канонический finance intent. |
| `compute_risk_assessment` | `finance` | `economist` | `knowledge` | `controller` потенциально | `economist` в deterministic scope | `CONFIRMED` | Канонический finance intent. |
| `query_knowledge` | `knowledge` | `knowledge` | отсутствует | отсутствует | отсутствует | `CONFIRMED` | Канонический retrieval intent. |
| `emit_alerts` | `monitoring` | `monitoring` | `knowledge` | `controller` потенциально | отсутствует | `CONFIRMED` | Канонический monitoring intent. |
| `register_counterparty` | `crm` | `crm_agent` | `knowledge` | отсутствует | `crm_agent` через governed path | `CONFIRMED` | CRM owner-intent. |
| `create_counterparty_relation` | `crm` | `crm_agent` | `knowledge` | отсутствует | `crm_agent` через governed path | `CONFIRMED` | CRM owner-intent. |
| `create_crm_account` | `crm` | `crm_agent` | `knowledge` | `economist` потенциально | `crm_agent` через governed path | `CONFIRMED` | CRM owner-intent. |
| `review_account_workspace` | `crm` | `crm_agent` | `knowledge` | `economist` | отсутствует | `CONFIRMED` | CRM owner-intent. |
| `update_account_profile` | `crm` | `crm_agent` | `knowledge` | `economist` потенциально | `crm_agent` через governed path | `CONFIRMED` | CRM owner-intent. |
| `create_crm_contact` | `crm` | `crm_agent` | `knowledge` | отсутствует | `crm_agent` через governed path | `CONFIRMED` | CRM owner-intent. |
| `update_crm_contact` | `crm` | `crm_agent` | `knowledge` | отсутствует | `crm_agent` через governed path | `CONFIRMED` | CRM owner-intent. |
| `delete_crm_contact` | `crm` | `crm_agent` | отсутствует | отсутствует | `crm_agent` через governed path | `CONFIRMED` | CRM owner-intent. |
| `log_crm_interaction` | `crm` | `crm_agent` | `knowledge` | отсутствует | `crm_agent` через governed path | `CONFIRMED` | CRM owner-intent. |
| `update_crm_interaction` | `crm` | `crm_agent` | отсутствует | отсутствует | `crm_agent` через governed path | `CONFIRMED` | CRM owner-intent. |
| `delete_crm_interaction` | `crm` | `crm_agent` | отсутствует | отсутствует | `crm_agent` через governed path | `CONFIRMED` | CRM owner-intent. |
| `create_crm_obligation` | `crm` | `crm_agent` | `knowledge` | `economist` потенциально | `crm_agent` через governed path | `CONFIRMED` | CRM owner-intent. |
| `update_crm_obligation` | `crm` | `crm_agent` | отсутствует | `economist` потенциально | `crm_agent` через governed path | `CONFIRMED` | CRM owner-intent. |
| `delete_crm_obligation` | `crm` | `crm_agent` | отсутствует | отсутствует | `crm_agent` через governed path | `CONFIRMED` | CRM owner-intent. |

### 6.2 Зафиксированные future intent-owner зоны

Это ещё не подтверждённые runtime intent-ы, а ownership направления, которые уже логически закреплены в platform templates.

| Домен | Будущий owner-agent | Intent-owner зона |
|---|---|---|
| `marketing` | `marketer` | campaigns, segments, funnel recommendations |
| `front_office` | `front_office_agent` | dialogue logging, communicator filtering, task/process detection, escalation routing |
| `strategy` | `strategist` | scenario framing, strategic tradeoffs, initiative prioritization |
| `finance` advisory | `finance_advisor` | executive finance advisory поверх deterministic evidence |
| `legal` | `legal_advisor` | clause risks, legal summaries, policy review |
| `control` | `controller` | reconciliation exceptions, control alerts, governed escalation |
| `personal_ops` | `personal_assistant` | personal tasks, reminders, delegated summaries |

### 6.3 Критичные missing intent owners

| Домен | Missing intent owner | Fallback mode | Gap severity | Комментарий |
|---|---|---|---|---|
| `contracts` | отсутствует | `ROUTE_FALLBACK` | `CRITICAL` | Нет primary owner для договорных create/review/update сценариев. |
| `hr` | отсутствует | `MANUAL_HUMAN_REQUIRED` | `MEDIUM` | Доменные сценарии в platform map присутствуют, owner-agent не назначен. |
| `exploration` | отсутствует | `BACKLOG_ONLY` | `LOW` | Нет agent-owner и intent-owner. |

---

## 7. Нормативная карта handoff paths

Ниже перечислены допустимые handoff paths.  
Если путь не указан здесь, он не должен считаться автоматически разрешённым.

### 7.1 Подтверждённые и логически допустимые current paths

| Source owner | Target owner | Когда нужен handoff | Путь | Статус |
|---|---|---|---|---|
| `agronomist` | `economist` | агро-расчёт требует финансовой интерпретации | через оркестратор | `ALLOWED / PARTIAL` |
| `agronomist` | `knowledge` | нужны регламенты, документы, policy grounding | через оркестратор | `ALLOWED` |
| `economist` | `knowledge` | нужны нормы, документы, policy grounding | через оркестратор | `ALLOWED` |
| `monitoring` | `agronomist` | сигнал относится к агро-риску | через оркестратор | `ALLOWED / PARTIAL` |
| `monitoring` | `economist` | сигнал относится к финансовому риску | через оркестратор | `ALLOWED / PARTIAL` |
| `monitoring` | `crm_agent` | сигнал относится к клиентскому или CRM-контексту | через оркестратор | `ALLOWED / PARTIAL` |
| `crm_agent` | `knowledge` | нужен policy / corpus grounding | через оркестратор | `ALLOWED` |
| `crm_agent` | `economist` | нужен финансовый follow-up по клиентскому кейсу | через оркестратор | `ALLOWED / PARTIAL` |
| `front_office_agent` | `crm_agent` | клиентский запрос или CRM-контекст | через оркестратор | `REQUIRED FUTURE` |
| `front_office_agent` | `agronomist` | агро-задача или полевой вопрос | через оркестратор | `REQUIRED FUTURE` |
| `front_office_agent` | `economist` | финансовый вопрос или process signal | через оркестратор | `REQUIRED FUTURE` |
| `front_office_agent` | `monitoring` | escalation signal или тревожный паттерн | через оркестратор | `REQUIRED FUTURE` |

### 7.2 Обязательные future handoff paths

| Source owner | Target owner | Для чего нужен путь | Статус |
|---|---|---|---|
| `front_office_agent` | `contracts_agent` | разговор перешёл в договорный процесс | `REQUIRED FUTURE` |
| `front_office_agent` | `legal_advisor` | нужен юридический разбор коммуникации | `REQUIRED FUTURE` |
| `crm_agent` | `contracts_agent` | создание и сопровождение договоров по контрагенту | `REQUIRED FUTURE` |
| `contracts_agent` | `legal_advisor` | clause review, legal risk, compliance | `REQUIRED FUTURE` |
| `contracts_agent` | `economist` / `finance_advisor` | финансовые последствия договора | `REQUIRED FUTURE` |
| `strategist` | `economist` | стратегический сценарий требует финансовой оценки | `REQUIRED FUTURE` |
| `controller` | `economist` | control exception требует finance follow-up | `REQUIRED FUTURE` |
| `controller` | `monitoring` | escalation и signal correlation | `REQUIRED FUTURE` |
| `marketer` | `crm_agent` | campaign / lead activity в CRM-контуре | `REQUIRED FUTURE` |
| `personal_assistant` | любой owner-agent | запрос на делегированный summary или read-only follow-up | `RESTRICTED FUTURE` |

### 7.3 Запрещённые handoff patterns

Запрещено:

- `agent -> agent` напрямую без участия оркестратора;
- handoff в домен, у которого нет owner-agent, как будто owner уже существует;
- handoff, который меняет ownership домена по route или по prompt;
- handoff из monitoring прямо в write-path чужого домена.

---

## 8. Домены без закрытого ownership

### 8.1 Главный текущий разрыв

`commerce/contracts`

Почему это критично:

- модуль есть;
- маршрут есть;
- пользовательский сценарий существует;
- но нет owner-agent и intent-owner.

Следствие:

- чат уходит в `ROUTE_FALLBACK`;
- UI может выглядеть “как будто система поняла”;
- реального agent path нет.

### 8.2 Вторичные разрывы

- `legal` — роль формализована, но runtime owner ещё не создан.
- `strategy` — роль формализована, но runtime owner ещё не создан.
- `control` — роль формализована, но runtime owner ещё не создан.
- `marketing` — роль формализована, но runtime owner ещё не создан.
- `personal_ops` — роль формализована, но runtime owner ещё не создан.
- `hr`, `exploration` — домены присутствуют, ownership map не закрыта.

### 8.3 Ранжирование разрывов по severity

| Домен | Severity | Почему |
|---|---|---|
| `contracts` | `CRITICAL` | Есть модуль, маршрут и реальный пользовательский сценарий, но нет owner-agent и intent-owner. |
| `front_office` | `HIGH` | В платформе уже есть Telegram, task, advisory и front-office UI, но нет owner-agent коммуникационного ingress. |
| `legal` | `HIGH` | Доменно важный контур уже существует, но agent ownership только template-level. |
| `strategy` | `HIGH` | Доменно важный контур уже существует, но ownership ещё не доведён до runtime family. |
| `control` | `HIGH` | Важен для governed operations и quality loops, но role пока только template-level. |
| `marketing` | `MEDIUM` | Доменно полезен, но не блокирует core operational testing так, как contracts/legal. |
| `personal_ops` | `MEDIUM` | Важен как отдельный контур, но не критичен для core business execution. |
| `hr` | `MEDIUM` | Домен присутствует в продукте, но не закрыт agent ownership. |
| `exploration` | `LOW` | Доменно присутствует, но не является критичным owner gap для core operational Stage 2. |

---

## 9. Что считается завершённой ownership map

Ownership map считается зрелой, если для каждого бизнес-домена есть:

- domain owner;
- owner-agent или явная пометка, что owner пока отсутствует;
- primary intent-owner;
- допустимые handoff paths;
- запреты на handoff;
- route / module evidence;
- product-level explanation, почему это именно этот owner, а не соседний.

---

## 10. Naming decision для договорного owner-domain

Для Stage 2 фиксируется нормативное решение:

- домен называется `contracts`;
- будущий canonical owner-agent называется `contracts_agent`.

Что это означает:

- `commerce` остаётся именем продуктового/технического модуля, который сейчас хостит договорный контур;
- но ownership-домен не называется `commerce`, потому что это слишком широкий контейнер;
- договорный owner должен быть отдельным и явным, а не размытым подмодулем CRM или generic commerce.

Следствие:

- в handoff, registry, contract-layer и UX нужно использовать именно `contracts_agent`;
- формулировка `commerce_agent` для договорного ownership считается ненормативной.

---

## 11. Ownership decision rules для новых доменов

Новый домен получает отдельного owner-agent только если одновременно выполняются условия:

1. У домена есть устойчивый `bounded context`.
2. У домена есть собственный `Intent Catalog`.
3. У домена есть свои `guardrails`.
4. У домена есть собственный `tool surface` или отдельный deterministic/service contour.
5. Домен не укладывается в существующего owner-agent без размывания границ.
6. Для домена можно сформулировать отдельные `read / advisory / write authority`.
7. Для домена можно описать handoff paths без превращения платформы в `all-to-all` mesh.

Если эти условия не выполнены, новый owner-agent создавать не нужно.

Вместо этого нужно выбрать один из путей:

- расширить существующий owner-domain;
- оформить домен как secondary advisory owner;
- оформить домен как secondary read/evidence owner;
- оставить домен системным, а не бизнес-агентным.

---

## 12. Непосредственные следующие шаги

1. Зафиксировать `contracts` как отдельный owner-domain, а не расширять его молча в `crm_agent`.
2. Создать отдельный canonical ownership plan для `contracts_agent`.
3. После этого формализовать `legal` и `strategy` как следующие owner families.
4. Для всех future-role перевести template ownership в canonical runtime ownership.
5. Поддерживать эту карту как обязательный источник истины при добавлении нового домена или intent-а.

---

## 13. Сводный вывод

Текущая платформа уже имеет ядро ownership map:

- `agronomist`
- `economist`
- `knowledge`
- `monitoring`
- `crm_agent`

Но platform-wide ownership ещё не замкнут.

Главный структурный разрыв:

- `contracts` существует без owner-agent.

Главное архитектурное правило:

- не `все со всеми`,
- а `все через оркестратор`,
- с явным `domain owner -> intent owner -> governed handoff`.

Этот документ становится обязательным companion-canon для всех дальнейших работ по agent enablement.

---

## 14. Связанные файлы и точки кода

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md)
- [A_RAI_AGENT_INTERACTION_BLUEPRINT.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/A_RAI_AGENT_INTERACTION_BLUEPRINT.md)
- [TRUTH_SYNC_STAGE_2_CLAIMS.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/TRUTH_SYNC_STAGE_2_CLAIMS.md)
- [agent-registry.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [agent-interaction-contracts.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)
- [supervisor-agent.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/supervisor-agent.service.ts)
- [agent-execution-adapter.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/runtime/agent-execution-adapter.service.ts)
- [tool-call.planner.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/runtime/tool-call.planner.ts)
- [agent-management.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/agent-management.service.ts)
- [commerce.controller.ts](/root/RAI_EP/apps/api/src/modules/commerce/commerce.controller.ts)
- [commerce-contract.service.ts](/root/RAI_EP/apps/api/src/modules/commerce/services/commerce-contract.service.ts)
