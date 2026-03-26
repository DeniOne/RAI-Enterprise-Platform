---
id: DOC-INS-AGENTS-INSTRUCTION-ORCHESTRATOR-ROUTING-AN-1V4S
layer: Instructions
type: Instruction
status: approved
version: 1.2.0
owners: [@techlead]
last_updated: 2026-03-25
---
# ИНСТРУКЦИЯ — ОРКЕСТРАТОР: ROUTING И ВЫБОР АГЕНТА

## 1. Назначение

Этот документ фиксирует единый канон для оркестратора `RAI_EP`:

- как оркестратор выбирает primary owner-agent для запроса;
- как он определяет допустимый handoff;
- как он отличает agent path от fallback;
- как он разруливает конфликты ownership между агентами;
- какие документы и точки кода считаются source of truth для маршрутизации.

Документ нужен как центральный стандарт маршрутизации для `SupervisorAgent`, `IntentRouterService`, `AgentRuntimeService` и связанных product-layer решений.

Дополнительная роль документа:

- синхронизировать routing-канон с `front-office ingress`, `back-office rai-chat`, `lead owner-agent` и `Branch Trust Gate`.

---

## 2. Когда применять

Использовать документ обязательно, когда:

- добавляется новый intent;
- добавляется новый агент или future-role;
- меняется ownership домена;
- проектируется handoff между агентами;
- возникает спор, кому должен принадлежать пользовательский сценарий;
- нужно понять, это routing bug, ownership gap или корректный fallback;
- нужно согласовать agent profile с поведением оркестратора.

---

## 3. Предварительные условия

Перед использованием этого документа нужно опираться на:

- [INSTRUCTION_AGENT_PLATFORM_INTERACTION_ARCHITECTURE.md](./INSTRUCTION_AGENT_PLATFORM_INTERACTION_ARCHITECTURE.md)
- [INSTRUCTION_AGENT_CATALOG_AND_RESPONSIBILITY_MAP.md](./INSTRUCTION_AGENT_CATALOG_AND_RESPONSIBILITY_MAP.md)
- [INSTRUCTION_AGENT_DOMAIN_GAPS_AND_UNOWNED_MODULES.md](./INSTRUCTION_AGENT_DOMAIN_GAPS_AND_UNOWNED_MODULES.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](../../00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [agent-registry.service.ts](../../apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [supervisor-agent.service.ts](../../apps/api/src/modules/rai-chat/supervisor-agent.service.ts)
- [tool-call.planner.ts](../../apps/api/src/modules/rai-chat/runtime/tool-call.planner.ts)
- [agent-interaction-contracts.ts](../../apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)
- [AGENT_MODULE_ORG_STRUCTURE.md](../../07_EXECUTION/AGENT_MODULE_ORG_STRUCTURE.md)
- [AGENT_MODULE_RACI_AND_REPORTING_LINES.md](../../07_EXECUTION/AGENT_MODULE_RACI_AND_REPORTING_LINES.md)

---

## 4. Роль оркестратора

### 4.1 Что такое оркестратор в текущем каноне

Оркестратор — это не бизнес-агент и не ещё один доменный owner.

Оркестратор отвечает за:

- выбор primary owner-agent;
- проверку intent ownership;
- проверку доступного контекста;
- запуск clarification path, когда контекста недостаточно;
- запуск governed handoff через центральный spine;
- запрет невалидных cross-domain переходов;
- выбор между agent path, fallback и manual-human-required.

Оркестратор работает в двух разных ingress-контурах:

- `front-office communication ingress` приходит через `front_office_agent`;
- `back-office business ingress` приходит через `rai-chat -> semantic ingress`.

Жёсткое правило:

- эти два ingress-контура не должны сливаться в один “общий коммуникатор”;
- `SupervisorAgent` обязан держать единый orchestration spine поверх обоих контуров.

### 4.2 Чем оркестратор не является

Оркестратор не должен:

- брать ownership бизнес-домена;
- подменять отсутствие owner-agent красивым ответом;
- создавать прямую `agent -> agent` mesh-модель;
- менять owner-agent только потому, что пользователь открыл другой route;
- считать template/future role полноценным runtime-owner без отдельного enablement.

---

## 5. Иерархия источников истины для routing

При конфликте источников оркестратор должен читать систему в таком порядке:

1. `agent-interaction-contracts.ts` — подтверждённые intent-ы, guardrails, UI surface, базовая классификация.
2. `RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md` — primary owner, secondary read/advisory owner, допустимые handoff, fallback mode.
3. agent profile конкретного агента — границы домена, запреты, максимальный допустимый функционал.
4. `agent-registry.service.ts` — список канонических runtime-агентов и их tool surface.
5. future templates в `agent-management.service.ts` — только как template/future semantics, но не как доказательство runtime ownership.

Жёсткое правило:

- наличие backend-модуля не доказывает наличие owner-agent;
- наличие profile не доказывает наличие runtime family;
- наличие template manifest не доказывает право оркестратора маршрутизировать туда production scenario.

---

## 6. Базовый алгоритм выбора агента

### 6.1 Канонический путь

```text
Front-office communication
  -> front_office_agent
  -> SupervisorAgent
  -> IntentRouterService
  -> определение primary owner-agent
  -> проверка authority и required context
  -> AgentRuntimeService
  -> AgentExecutionAdapterService
  -> tool / domain path
  -> typed result / clarification / governed handoff

Back-office business message
  -> rai-chat
  -> semantic ingress
  -> SupervisorAgent
  -> IntentRouterService
  -> определение primary owner-agent
  -> проверка authority и required context
  -> AgentRuntimeService
  -> AgentExecutionAdapterService
  -> tool / domain path
  -> typed result / clarification / governed handoff
```

### 6.2 Правила выбора

1. Сначала определить intent, а не route.
2. Затем определить primary owner-agent по ownership map.
3. Потом проверить, существует ли у owner-agent подтверждённый runtime path.
4. Потом проверить, хватает ли required context.
5. При нехватке контекста запускать clarification, а не routing в соседний домен.
6. Secondary read/advisory owner подключать только после фиксации primary owner.
7. Любой handoff проводить только по схеме `source agent -> orchestrator -> target agent`.
8. `lead owner-agent` выбирать по финальному business effect, а не по первому слову или route страницы.
9. `front_office_agent` не может быть primary owner для `rai-chat` business scenarios.
10. `knowledge`, `monitoring`, expert-layer и trust-layer не могут становиться primary owner только потому, что участвуют в branch path.

### 6.3 Что считается корректным результатом выбора

Оркестратор считается отработавшим правильно, если на выходе получилось одно из состояний:

- выбран один primary owner-agent;
- открыт clarification path у этого owner-agent;
- выполнен governed handoff в допустимый target agent;
- честно возвращён fallback mode, предусмотренный ownership map;
- сценарий остановлен как `MANUAL_HUMAN_REQUIRED`.

---

## 7. Текущая матрица primary routing

| Тип запроса / сценария | Primary owner-agent | Что считается триггером | Что не должно перехватывать ownership |
|---|---|---|---|
| Техкарты, агро-отклонения, полевые рекомендации | `agronomist` | поля, сезоны, техкарты, отклонения, agro execution context | `economist`, `knowledge`, `monitoring` |
| Plan/fact, сценарии, risk assessment, core finance analytics | `economist` | бюджеты, план-факт, сценарии, финансовые KPI | `strategist`, `finance_advisor`, `monitoring` |
| Поиск документов, политик, нормативной базы, grounding | `knowledge` | policy lookup, corpus lookup, evidence lookup | любой operational owner |
| Сигналы, alerts, incidents, risk summaries | `monitoring` | сигналы, предупреждения, incident review | `controller`, `economist`, любой business owner |
| Контрагенты, аккаунты, контакты, CRM interactions | `crm_agent` | CRM record management, client workspace, party relations | `contracts_agent`, `front_office_agent` |
| Входящие диалоги, thread classification, communicator escalation | `front_office_agent` | message ingress, dialog thread, escalation routing; подтверждённые intent-ы: `log_dialog_message`, `classify_dialog_thread`, `create_front_office_escalation` | downstream business owner без признака перехода домена |
| Договоры, обязательства, fulfillment, invoice, payment, allocation, AR | `contracts_agent` | contract lifecycle и commerce execution | `crm_agent`, `legal_advisor`, `economist` |

### 7.1 Routing по ingress-контурам

| Ingress | Кто принимает первым | Кто accountable за orchestration | Кто не является owner по умолчанию |
|---|---|---|---|
| `front-office communication ingress` | `front_office_agent` | `SupervisorAgent` | `crm_agent`, `agronomist`, `economist`, `contracts_agent` до явного domain handoff |
| `back-office business ingress` через `rai-chat` | `semantic ingress` | `SupervisorAgent` | `front_office_agent` |

### 7.2 Master-таблица `trigger -> owner -> handoff`

Эта таблица не заменяет детальные конфликтные секции ниже. Это быстрый operational cheat sheet для оркестратора: сначала выбирается строка по доминирующему действию пользователя, затем при необходимости открывается соответствующий детальный блок.

| Доминирующее действие / trigger | Primary owner-agent | Secondary owner / governed handoff | Что оркестратор должен проверить сразу | Что делать при нехватке контекста | Детализация |
|---|---|---|---|---|---|
| Сохранить сообщение, классифицировать thread, зарегистрировать escalation, обработать communicator ingress | `front_office_agent` | downstream owner только после явного доменного trigger | `message_id`, `thread_id`, тип ingress-intent, наличие признака перехода в бизнес-домен | Открыть clarification path у `front_office_agent`, не переводить запрос в доменный agent преждевременно | `8.1` |
| Обновить карточку клиента, аккаунт, контакт, CRM interaction, связать party relations | `crm_agent` | `knowledge` как read/evidence; `contracts_agent` только после переключения в contract lifecycle | `party_id`, `account_id`, `contact_id`, ИНН/контрагент, что именно пользователь хочет сделать с CRM-record | Открыть clarification path у `crm_agent`, не подменять отсутствующий CRM-context договорным path | `8.1`, `8.2` |
| Создать/просмотреть/исполнить договор, обязательство, fulfillment, invoice, payment, allocation, AR | `contracts_agent` | `economist` как advisory, `legal_advisor` как advisory/future path, `knowledge` как read/evidence | `contract_id` или данные договора, сторона, обязательство, invoice/payment context, стадия contract lifecycle | Открыть clarification path у `contracts_agent`, не передавать write-intent в `crm_agent`, `economist` или `legal_advisor` | `8.2`, `8.3`, `8.4` |
| Дать legal interpretation по clause, compliance, рискам формулировки, legal review документа | `legal_advisor` только для standalone legal-advisory path; в смешанном execution-запросе owner остаётся `contracts_agent` | `contracts_agent` как domain owner смешанного запроса | есть ли запрос на правовую интерпретацию или на business execution; есть ли clause/document reference | Если нет документа/пункта, открыть clarification path; если runtime legal-path не enabled, вернуть advisory-gap, а не симулировать owner | `8.3` |
| Посчитать plan/fact, бюджет, KPI, сценарий, финансовую оценку, risk assessment | `economist` | `knowledge` как read/evidence; `monitoring` как signal-input | период, сценарий, KPI, сущность анализа, требуемый финансовый результат | Открыть clarification path у `economist`, не переводить запрос в `monitoring` только из-за слова risk | `8.4` |
| Оценить финансовые последствия договора, invoices, payments, дебиторки внутри contract execution | `contracts_agent` | `economist` как advisory | есть ли действующий contract/payment/invoice context и нужен ли execution path или только analysis | Открыть clarification path у `contracts_agent`; при смешанном запросе удерживать owner в contract contour | `8.4` |
| Найти документ, политику, регламент, норму, corpus evidence без бизнес-исполнения | `knowledge` | operational owner только если после retrieval возникает отдельный business action | corpus scope, источник знания, policy/document reference, вопрос пользователя именно про lookup | Открыть clarification path у `knowledge`, не превращать retrieval в operational ownership | `8.5` |
| Показать сигнал, alert, incident summary, anomaly snapshot, monitoring risk signal | `monitoring` | domain owner для remediation; `knowledge` как evidence при необходимости | источник сигнала, alert/incident id, тип события, нужен ли именно signal review или уже remediation | Открыть clarification path у `monitoring`; remediation-routing делать только после фиксации доменного owner | `8.6` |
| Дать агрономическую рекомендацию по полю, сезону, техкарте, отклонению, агро-сценарию | `agronomist` | `knowledge` как read/evidence; `monitoring` как signal-input при наличии тревог | `field_id`, сезон, культура, техкарта, отклонение, что именно нужно: рекомендация, проверка, разбор | Открыть clarification path у `agronomist`, не переводить запрос в `economist` или `monitoring` по вторичным словам | `7` |

### 7.3 Production gating для template/future roles

Наличие profile, template manifest или `executionAdapterRole` ещё не даёт оркестратору права маршрутизировать production-запрос в такую роль как в `primary owner-agent`.

Жёсткое правило:

- границы ответственности future-role могут быть уже описаны нормативно;
- но direct production routing разрешается только после появления canonical runtime family, intent contract и подтверждённого execution path;
- adapter inheritance от canonical runtime role не превращает future-role в production owner;
- детальные секции ниже определяют ownership boundaries, но не отменяют enablement gate.

Это правило особенно важно для ролей, которые уже выглядят "готовыми" в onboarding templates, но по факту остаются template-only.

| Role | Подтверждённый статус | Текущий adapter / inheritance | Может быть `primary owner` в production сейчас | Что оркестратор может делать сейчас | Что обязательно нужно для enablement |
|---|---|---|---|---|---|
| `strategist` | template/future role | `knowledge` | нет | держать как будущий advisory-domain; production-запросы маршрутизировать в `economist` или `knowledge` по доминирующему действию | canonical runtime family, strategy-specific intent catalog, evidence path, own execution contract |
| `finance_advisor` | template/future role | `economist` | нет | использовать только как future advisory semantics; production-routing оставлять у `economist` или `contracts_agent` | formal ownership split c `economist`, own intent contract, no-write runtime governance |
| `controller` | template/future role | `monitoring` | нет | держать как future control contour; production-routing оставлять у `monitoring` или `economist` | canonical runtime family, exception model, split c `monitoring` и `economist`, governed escalation contract |
| `marketer` | template/future role | `knowledge` | нет | marketing/advisory-запросы держать в `knowledge` или `crm_agent` по контексту; не создавать отдельный production owner | canonical runtime family, marketing intents, real tool surface, CRM handoff contract |
| `personal_assistant` | template/future role | `knowledge` | нет | использовать только как future delegated/personal contour; бизнес-запросы оставлять у доменного owner-agent | canonical runtime family, personal context contract, privacy-safe tool surface, confirmation rules |

Отдельное уточнение:

- `legal_advisor` уже нормирован в секции `8.3` как required future advisory-path, но это не отменяет общий enablement gate для template/future roles.

---

## 8. Правила routing по конфликтным зонам

### 8.1 `front_office_agent` vs downstream owner

`front_office_agent` остаётся owner только пока сценарий находится в ingress-контуре:

- логирование сообщения;
- классификация thread;
- фиксация escalation;
- базовая маршрутизация в owner-domain.

Дополнительная жёсткая граница:

- этот ingress-контур относится только к `front-office` коммуникационному потоку;
- back-office сообщения из `rai-chat` не должны делать `front_office_agent` owner “по дороге”.

Как только запрос становится предметным бизнес-сценарием, owner должен переходить в доменный агент:

- договорный процесс -> `contracts_agent`
- CRM-работа по карточке клиента -> `crm_agent`
- агрономический вопрос -> `agronomist`
- финансовый разбор -> `economist`

### 8.1.1 Когда `front_office_agent` остаётся primary owner

`front_office_agent` остаётся primary owner, только когда подтверждён один из ingress-intent-ов:

- `log_dialog_message`
- `classify_dialog_thread`
- `create_front_office_escalation`

Или когда пользовательский запрос ещё не вышел из слоя коммуникации:

- нужно сохранить сообщение, переписку или thread;
- нужно понять, это `free_chat`, `task_process`, `client_request` или `escalation_signal`;
- нужно завести escalation record без исполнения бизнес-процесса;
- нужно подготовить handoff, но не выполнять downstream action.

### 8.1.2 Триггеры выхода из ingress в доменный owner

| Что увидел оркестратор в запросе | Куда переводить owner | Почему |
|---|---|---|
| ИНН, контрагент, карточка клиента, CRM-account, contact, interaction, obligation по клиенту | `crm_agent` | это CRM record management, а не коммуникационный ingress |
| Договор, контракт, обязательство по договору, отгрузка, исполнение, счёт, оплата, аллокация, дебиторка | `contracts_agent` | это contract lifecycle и commerce execution |
| Поле, сезон, техкарта, отклонение, агро-рекомендация | `agronomist` | это agronomy owner-intent |
| План-факт, бюджет, сценарий, risk assessment, финансовая оценка | `economist` | это finance owner-intent |
| Тревожный сигнал, incident, alert, monitoring snapshot | `monitoring` | это signal/risk contour |

### 8.1.3 Анти-триггеры для `front_office_agent`

Следующие признаки не должны удерживать ownership у `front_office_agent`:

- пользователь пришёл из Telegram или communicator;
- в сообщении есть слова "клиент", "нужно в работу", "передай", "срочно";
- запрос начался как переписка, но уже содержит предметный бизнес-intent;
- фронт-офис уже выделил `client_request` или `task_process`.
- сообщение пришло из `rai-chat`.

Жёсткое правило:

- `front_office_agent` определяет, что начался процесс;
- доменный owner определяет и исполняет сам процесс.

### 8.1.4 Разрешение спора `front_office_agent` vs `crm_agent`

Нормативная граница:

- история общения, thread, communicator log, escalation trail -> `front_office_agent`
- контрагент, account workspace, contact, relation, CRM obligation -> `crm_agent`

Следствие:

- клиентский запрос не равен CRM ownership;
- CRM ownership начинается только там, где появляется работа с CRM-сущностью, а не просто сообщение о клиенте.

### 8.1.5 Разрешение спора `front_office_agent` vs `contracts_agent`

Нормативная граница:

- факт разговора о договоре, фиксация thread и эскалации -> `front_office_agent`
- создание, просмотр, изменение и исполнение договора -> `contracts_agent`

Следствие:

- разговор про договор не должен оставаться во фронт-офисе дольше, чем нужно для handoff;
- наличие client context не переводит договорный сценарий в `crm_agent`.

### 8.2 `crm_agent` vs `contracts_agent`

Граница проходит так:

- `crm_agent` владеет контрагентом, аккаунтом, контактом, CRM-history, отношениями;
- `contracts_agent` владеет договором, договорным обязательством, исполнением, счетом, платежом, аллокацией и AR.

Жёсткое правило:

- наличие контрагента в контексте не даёт `crm_agent` ownership над договорным сценарием;
- наличие договора в контексте не даёт `contracts_agent` ownership над CRM-карточкой.

### 8.2.1 Когда primary owner = `crm_agent`

Оркестратор должен выбирать `crm_agent`, если запрос относится к одной из CRM-сущностей:

- `party`
- `account`
- `contact`
- `interaction`
- `crm obligation`
- relation graph между контрагентами

И если действие относится к CRM lifecycle:

- найти или зарегистрировать контрагента;
- создать или обновить CRM-аккаунт;
- открыть account workspace;
- создать, изменить или удалить контакт;
- создать, изменить или удалить interaction;
- создать, изменить или удалить CRM-obligation.

Подтверждённые owner-intent-ы этого контура:

- `register_counterparty`
- `create_counterparty_relation`
- `create_crm_account`
- `review_account_workspace`
- `update_account_profile`
- `create_crm_contact`
- `update_crm_contact`
- `delete_crm_contact`
- `log_crm_interaction`
- `update_crm_interaction`
- `delete_crm_interaction`
- `create_crm_obligation`
- `update_crm_obligation`
- `delete_crm_obligation`

### 8.2.2 Когда primary owner = `contracts_agent`

Оркестратор должен выбирать `contracts_agent`, если запрос относится к одной из договорных сущностей:

- `contract`
- contract role
- `contract obligation`
- `fulfillment_event`
- `invoice`
- `payment`
- payment allocation
- `ar balance`

И если действие относится к contract lifecycle:

- создать договор;
- открыть реестр договоров или карточку договора;
- создать обязательство по договору;
- зафиксировать исполнение;
- создать или провести счёт;
- создать, подтвердить или разнести платёж;
- посмотреть дебиторский остаток.

Подтверждённые owner-intent-ы этого контура:

- `create_commerce_contract`
- `list_commerce_contracts`
- `review_commerce_contract`
- `create_contract_obligation`
- `create_fulfillment_event`
- `create_invoice_from_fulfillment`
- `post_invoice`
- `create_payment`
- `confirm_payment`
- `allocate_payment`
- `review_ar_balance`

### 8.2.3 Trigger-матрица для спорных сценариев

| Что увидел оркестратор | Primary owner-agent | Почему |
|---|---|---|
| ИНН, регистрация контрагента, связь контрагентов, CRM-аккаунт, карточка клиента, контакт, взаимодействие | `crm_agent` | это CRM record management |
| Договор, контракт, условия договора, обязательство по договору, исполнение, отгрузка, счёт, платёж, дебиторка | `contracts_agent` | это contract lifecycle и commerce execution |
| Контрагент упоминается только как сторона договора | `contracts_agent` | контрагент здесь часть contract context, а не CRM owner-scope |
| Договор упоминается только как вложение в карточку клиента, но действие направлено на просмотр/обновление CRM-сущности | `crm_agent` | договорный контекст не переводит ownership сам по себе |

### 8.2.4 Действия-переключатели owner

Следующие глаголы и пользовательские намерения должны переводить ownership в `contracts_agent`, даже если стартовый контекст был CRM:

- заключить договор
- оформить договор
- согласовать контракт
- добавить договорное обязательство
- зафиксировать исполнение
- выставить счёт
- провести счёт
- зарегистрировать оплату
- подтвердить платёж
- разнести платёж
- посмотреть дебиторку

Следующие действия должны удерживать ownership в `crm_agent`, даже если в запросе упомянут договор:

- найти контрагента
- завести карточку клиента
- обновить профиль аккаунта
- добавить контакт
- записать взаимодействие
- обновить CRM-obligation
- посмотреть account workspace

### 8.2.5 Анти-триггеры и ошибки маршрутизации

Следующие признаки не должны автоматически вести в `crm_agent`:

- в запросе есть слово "клиент";
- договор связан с контрагентом;
- пользователь пришёл из CRM-route;
- в account workspace виден список договоров.

Следующие признаки не должны автоматически вести в `contracts_agent`:

- у клиента уже есть договоры;
- в сообщении просто упоминается контракт без действия над contract lifecycle;
- пользователь находится в контексте контрагента, но хочет обновить CRM-профиль или контакты.

### 8.2.6 Нормативное правило разрешения конфликта

При споре между `crm_agent` и `contracts_agent` оркестратор обязан отвечать на вопрос:

`Пользователь хочет управлять клиентской сущностью или договорным обязательством?`

Если ответ:

- клиентская сущность -> `crm_agent`
- договорное обязательство или исполнение -> `contracts_agent`

При смешанном запросе:

- primary owner выбирается по главному действию;
- второй домен подключается только как governed handoff через оркестратор;
- один запрос не должен порождать два primary owner одновременно.

### 8.3 `contracts_agent` vs `legal_advisor`

Граница проходит так:

- `contracts_agent` — execution owner;
- `legal_advisor` — advisory owner по legal review, clause risk, compliance.

Следствие:

- юридическая интерпретация не переводит ownership договора в `legal_advisor`;
- legal handoff допустим только через оркестратор и пока остаётся future/required path.

### 8.3.1 Когда `legal_advisor` не должен становиться primary owner

Оркестратор не должен переводить ownership в `legal_advisor`, когда пользователь хочет:

- создать договор;
- открыть или изменить карточку договора;
- создать договорное обязательство;
- зафиксировать исполнение;
- создать или провести счёт;
- создать, подтвердить или разнести платёж;
- посмотреть operational status договора, исполнения, счёта или оплаты.

Во всех этих случаях primary owner остаётся `contracts_agent`, даже если запрос содержит:

- юридический риск;
- clause risk;
- compliance concern;
- просьбу "проверь юридически" как часть contract workflow.

### 8.3.2 Когда `legal_advisor` становится owner только advisory-запроса

`legal_advisor` может быть owner только отдельного legal/advisory-запроса, когда предметом запроса является:

- разбор clause risk;
- legal commentary по условию;
- policy review;
- compliance interpretation;
- legal corpus lookup как самостоятельный результат.

Но даже в этом режиме:

- роль остаётся template/future role;
- runtime-owner для production legal domain ещё не доведён до canonical family;
- fallback для legal остаётся `MANUAL_HUMAN_REQUIRED`, а не полноценный agent execution path.

### 8.3.3 Trigger-матрица `contracts_agent` vs `legal_advisor`

| Что увидел оркестратор | Primary owner-agent | Почему |
|---|---|---|
| Создать или исполнить договорный объект | `contracts_agent` | это commerce execution |
| Проверить риск пункта, трактовку условия, соответствие политике, compliance-комментарий | `legal_advisor` как advisory-only future path | это legal interpretation, а не contract execution |
| В одном запросе есть и действие по договору, и просьба о legal review | `contracts_agent` | главное действие execution, legal подключается только как handoff |
| Запрос состоит только из legal review без contract write-action | `legal_advisor` как advisory-only future path | это самостоятельный legal intent |

### 8.3.4 Анти-триггеры для `legal_advisor`

Следующие признаки не должны переводить ownership в `legal_advisor`:

- в запросе есть слово "договор";
- обсуждается юридический риск внутри уже идущего contract workflow;
- пользователь находится в contract route;
- для выполнения нужно менять договорное состояние, а не только интерпретировать его.

Жёсткое правило:

- legal interpretation не может захватывать write authority договорного контура.

### 8.4 `contracts_agent` vs `economist`

Граница проходит так:

- `contracts_agent` владеет фактом договорного исполнения;
- `economist` владеет финансовой интерпретацией последствий.

Следствие:

- дебиторка как operational artefact остаётся в договорном контуре;
- финансовый анализ дебиторки остаётся advisory-layer у `economist`.

### 8.4.1 Когда `economist` не должен становиться primary owner

Оркестратор не должен переводить ownership в `economist`, когда пользователь хочет:

- создать договорное обязательство;
- зафиксировать исполнение;
- выставить счёт;
- провести счёт;
- создать платёж;
- подтвердить платёж;
- разнести платёж;
- посмотреть operational AR как часть contract execution flow.

Во всех этих случаях primary owner остаётся `contracts_agent`, даже если в запросе есть слова:

- маржа;
- финансовый риск;
- дебиторка;
- экономика сделки;
- cash flow impact.

### 8.4.2 Когда `economist` становится primary owner

Оркестратор должен выбирать `economist`, когда главный результат запроса:

- plan/fact;
- сценарное сравнение;
- risk assessment;
- финансовая интерпретация последствий договора, оплаты, счёта, дебиторки;
- аналитика KPI, бюджета, cash flow или profitability.

### 8.4.3 Trigger-матрица `contracts_agent` vs `economist`

| Что увидел оркестратор | Primary owner-agent | Почему |
|---|---|---|
| Нужно выполнить contract lifecycle action | `contracts_agent` | это operational execution |
| Нужно оценить финансовые последствия договора, счёта, оплаты, дебиторки | `economist` | это finance interpretation |
| В одном запросе есть и payment action, и просьба оценить impact | `contracts_agent` | главное действие execution, `economist` подключается как advisory handoff |
| В запросе нет contract write, только анализ экономики сделки или дебиторки | `economist` | это самостоятельный finance intent |

### 8.4.4 Анти-триггеры для `economist`

Следующие признаки не должны переводить ownership в `economist`:

- в запросе есть деньги, сумма, оплата или счёт как часть contract action;
- пользователь смотрит invoice или payment route;
- нужно менять payment/invoice status, а не анализировать результат;
- в запросе упомянута дебиторка, но действие направлено на contract-side operational state.

Жёсткое правило:

- `economist` интерпретирует финансовые последствия;
- `contracts_agent` исполняет договорное и платёжное действие.

### 8.5 `knowledge` vs любой operational owner

`knowledge` не должен становиться owner бизнес-процесса, даже когда:

- запрос сформулирован как вопрос о политике;
- пользователю нужен документ;
- агенту нужен evidence/grounding.

В этих случаях `knowledge` остаётся secondary read/evidence owner.

### 8.5.1 Когда `knowledge` является primary owner

Оркестратор должен выбирать `knowledge` как primary owner только тогда, когда главный результат запроса:

- найти документ;
- найти политику;
- найти регламент;
- вернуть knowledge-based answer по corpus lookup;
- дать grounded summary по документам без business execution.

Подтверждённый owner-intent этого контура:

- `query_knowledge`

### 8.5.2 Когда `knowledge` не должен становиться primary owner

Оркестратор не должен переводить ownership в `knowledge`, когда пользователь хочет:

- выполнить CRM-действие;
- выполнить agronomy-действие;
- выполнить contract lifecycle action;
- выполнить finance scenario или plan/fact;
- выполнить remediation по alert или incident.

Даже если в запросе есть:

- "покажи политику";
- "найди регламент";
- "есть ли правило";
- "на что сослаться";
- "дай документальное подтверждение".

В этих случаях `knowledge` остаётся только слоем evidence/grounding для primary owner.

### 8.5.3 Trigger-матрица `knowledge` vs operational owner

| Что увидел оркестратор | Primary owner-agent | Почему |
|---|---|---|
| Запрос только на поиск документа, политики, регламента, фрагмента corpus | `knowledge` | это самостоятельный retrieval intent |
| Запрос на выполнение бизнес-действия с просьбой приложить policy/evidence | operational owner | главное действие не retrieval, а execution или domain analysis |
| Запрос на объяснение domain-result через документы | operational owner | `knowledge` здесь evidence-owner, а не owner результата |
| Нужен corpus lookup для handoff или проверки правила | source owner остаётся прежним | `knowledge` подключается только вторично |

### 8.5.4 Анти-триггеры для `knowledge`

Следующие признаки не должны переводить ownership в `knowledge`:

- в запросе есть слова "политика", "регламент", "документ", "инструкция";
- пользователь открыт на route `/knowledge`, но действие предметно относится к другому домену;
- доменный агент просит grounding для already-owned scenario;
- пользователю нужен документ как обоснование уже выбранного действия.

Жёсткое правило:

- `knowledge` владеет retrieval;
- доменный owner владеет решением и исполнением.

### 8.6 `monitoring` vs любой operational owner

`monitoring` не становится owner remediation path.

Он может:

- фиксировать сигнал;
- объяснять snapshot;
- инициировать governed escalation.

Он не может:

- исполнять чужой бизнес-процесс;
- подменять отсутствие owner-agent в смежном домене.

### 8.6.1 Когда `monitoring` является primary owner

Оркестратор должен выбирать `monitoring` как primary owner, когда главный результат запроса:

- обработать сигнал;
- выпустить alert;
- показать monitoring summary;
- объяснить incident snapshot;
- приоритизировать риск без запуска remediation.

Подтверждённый owner-intent этого контура:

- `emit_alerts`

### 8.6.2 Когда `monitoring` не должен становиться primary owner

Оркестратор не должен переводить ownership в `monitoring`, когда пользователь хочет:

- исправить business problem;
- изменить CRM/contract/agro/finance state;
- выполнить operational remediation;
- принять решение вместо domain owner.

Даже если в запросе есть:

- alert;
- incident;
- critical signal;
- anomaly;
- red flag.

В этих случаях `monitoring` остаётся signal owner и должен только передать сигнал в правильный owner-domain через governed escalation.

### 8.6.3 Trigger-матрица `monitoring` vs operational owner

| Что увидел оркестратор | Primary owner-agent | Почему |
|---|---|---|
| Нужна генерация alerts, сводка сигналов, incident snapshot | `monitoring` | это signal/risk contour |
| Нужна реакция на agro-risk через полевое действие | `agronomist` | сигнал относится к agronomy execution |
| Нужна реакция на finance-risk или economic consequence | `economist` | сигнал относится к finance analysis |
| Нужна реакция на клиентский риск, account issue, CRM anomaly | `crm_agent` | сигнал относится к CRM owner-domain |
| Нужна реакция на договорный сбой, invoice/payment issue | `contracts_agent` | сигнал относится к contract execution contour |

### 8.6.4 Анти-триггеры для `monitoring`

Следующие признаки не должны удерживать ownership у `monitoring`:

- alert относится к уже известному business object;
- incident требует downstream write-action;
- пользователь просит "исправить", "закрыть", "провести", "обновить", "создать";
- monitoring route открыт как входная точка, но целевое действие доменное.

Жёсткое правило:

- `monitoring` фиксирует и объясняет сигнал;
- remediation и business action исполняет доменный owner.

### 8.7 `agronomist` vs `economist` vs `monitoring`

Эта конфликтная зона возникает в смешанных полевых сценариях, где рядом встречаются:

- агро-операция или отклонение;
- финансовая оценка последствий;
- monitoring signal или risk alert.

Подтверждённые owner-intent-ы по текущему коду:

- `agronomist`: `tech_map_draft`, `compute_deviations`
- `economist`: `compute_plan_fact`, `simulate_scenario`, `compute_risk_assessment`
- `monitoring`: `emit_alerts`

### 8.7.1 Когда `agronomist` является primary owner

`agronomist` должен быть primary owner, когда доминирующее действие пользователя относится к agronomy execution или agronomy interpretation:

- составить или уточнить техкарту;
- разобрать отклонение по полю, сезону, операции, культуре;
- предложить агрономическое действие или remediation;
- объяснить, что происходит в поле и как корректировать полевую работу.

Даже если в запросе одновременно встречаются:

- стоимость;
- потери;
- риск;
- alert;
- бюджетные последствия.

В этих случаях `agronomist` остаётся owner, если главное действие пользователя связано с полем, техкартой, отклонением или agronomy decision.

### 8.7.2 Когда `economist` является primary owner

`economist` должен быть primary owner, когда пользователь просит не агро-исполнение, а финансовую интерпретацию или сравнение вариантов:

- оценить экономический эффект агро-решения;
- сравнить сценарии по бюджету, ROI, cost delta, EBITDA;
- посчитать plan/fact по сезону или плану;
- выполнить risk assessment как finance-analysis.

Даже если расчёт основан на агроданных, `economist` остаётся owner, если доминирующий результат запроса:

- финансовый вывод;
- сценарное сравнение;
- budget impact;
- экономическая приоритизация.

### 8.7.3 Когда `monitoring` является primary owner

`monitoring` должен быть primary owner, когда пользователь просит именно signal/risk review, а не агро- или finance-action:

- показать alerts по полям или сезонам;
- собрать incident snapshot;
- вывести anomaly summary;
- объяснить, какие сигналы сработали и почему.

Как только пользователь просит:

- исправить полевую ситуацию;
- выбрать агро-действие;
- оценить экономическое последствие;
- выполнить remediation;

owner должен уходить из `monitoring` в `agronomist` или `economist`.

### 8.7.4 Trigger-матрица `agronomist` vs `economist` vs `monitoring`

| Что увидел оркестратор | Primary owner-agent | Почему |
|---|---|---|
| Нужна техкарта, агро-рекомендация, разбор полевого отклонения, agronomy remediation | `agronomist` | это agronomy execution / agronomy interpretation |
| Нужен расчёт plan/fact, economic scenario, budget impact, finance-risk analysis | `economist` | это finance owner-intent |
| Нужны alerts, incident summary, anomaly snapshot, signal digest | `monitoring` | это signal/risk contour |
| Нужна экономическая оценка агрономического решения по полю или сезону | `economist` | главное действие - financial interpretation, а не field execution |
| Нужна агрономическая реакция на agro-alert или field anomaly | `agronomist` | сигнал является входом, но целевое действие относится к agronomy owner |
| Нужен только обзор сигналов по полям перед дальнейшим решением | `monitoring` | пользователь пока просит signal review, а не remediation |

### 8.7.5 Анти-триггеры для смешанного agro/finance/risk routing

Следующие признаки сами по себе не должны менять owner:

- слово "риск" без уточнения, это signal review, finance-risk или agronomy deviation;
- слово "стоимость" внутри агрономического remediation-запроса;
- наличие alert в запросе, если пользователь просит именно полевое действие;
- наличие field или season в finance-analysis запросе;
- открытие сценария из monitoring UI или agro UI без смены доминирующего действия.

### 8.7.6 Нормативное правило разрешения конфликта

Оркестратор должен выбирать owner по главному действию пользователя:

- нужен agronomy decision или field remediation -> `agronomist`
- нужен financial conclusion или scenario comparison -> `economist`
- нужен signal digest или incident review -> `monitoring`

В смешанном запросе:

- `monitoring` даёт только signal input;
- `agronomist` даёт agronomy context и agronomy action;
- `economist` даёт финансовую интерпретацию;
- прямой `monitoring -> agronomist` или `agronomist -> economist` peer-call запрещён, только через оркестратор.

---

## 9. Authority model для оркестратора

Для каждого домена оркестратор обязан различать три уровня authority:

- `read authority`
- `advisory authority`
- `write authority`

Ключевое правило:

- `primary owner` не всегда равен единственному читателю домена;
- `read authority` не даёт права перехватывать ownership;
- `advisory authority` не даёт права выполнять write-path;
- `write authority` для бизнес-домена должен быть привязан к явному owner-agent и governed tool path.

Для текущих конфликтных зон:

- `contracts_agent` имеет write authority в contract lifecycle;
- `crm_agent` имеет write authority в CRM;
- `front_office_agent` имеет write authority только в своём ingress/domain state;
- `legal_advisor`, `economist`, `knowledge`, `monitoring` в спорных сценариях не заменяют primary owner.

---

## 10. Правила handoff

### 10.1 Допустимые handoff

Подтверждённо допустимы:

- `front_office_agent -> contracts_agent`
- `front_office_agent -> crm_agent`
- `front_office_agent -> agronomist`
- `front_office_agent -> economist`
- `front_office_agent -> monitoring`
- `crm_agent -> contracts_agent`
- `contracts_agent -> knowledge`
- `contracts_agent -> economist`
- `agronomist -> knowledge`
- `agronomist -> economist`
- `monitoring -> agronomist`
- `monitoring -> economist`
- `monitoring -> crm_agent`

### 10.2 Future / required handoff

Требуют отдельного enablement:

- `contracts_agent -> legal_advisor`
- `front_office_agent -> legal_advisor`
- `contracts_agent -> finance_advisor`
- `controller -> economist`
- `controller -> monitoring`

### 10.3 Запрещённые handoff

Запрещено:

- `agent -> agent` напрямую без оркестратора;
- handoff в домен без owner-agent как будто owner уже существует;
- handoff, который меняет ownership только по UI route или prompt wording;
- handoff из signal owner напрямую в write-path чужого домена;
- превращение clarification в скрытый cross-domain handoff.

---

## 11. Fallback и ownership gaps

Оркестратор обязан отличать пять состояний:

- `NONE` — есть полноценный agent path;
- `READ_ONLY_SUPPORT` — можно только читать и объяснять;
- `ROUTE_FALLBACK` — UI умеет маршрут, но owner-agent не подтверждён;
- `BACKLOG_ONLY` — можно только сформировать задачу или backlog;
- `MANUAL_HUMAN_REQUIRED` — сценарий должен обрабатывать человек.

Жёсткое правило:

- fallback не должен выглядеть как будто агент реально выполнил сценарий;
- ownership gap — это архитектурный факт, а не текстовая особенность ответа.

Для future/template roles:

- `legal_advisor`
- `strategist`
- `finance_advisor`
- `controller`
- `marketer`
- `personal_assistant`

оркестратор не должен назначать их primary owner-agent для production scenario до отдельного canonical enablement.

---

## 12. Что обновлять при добавлении нового intent или агента

При каждом изменении routing-логики нужно обновлять минимум:

1. этот документ как routing canon;
2. [INSTRUCTION_AGENT_CATALOG_AND_RESPONSIBILITY_MAP.md](./INSTRUCTION_AGENT_CATALOG_AND_RESPONSIBILITY_MAP.md);
3. [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](../../00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md);
4. профиль конкретного агента;
5. `agent-interaction-contracts.ts`;
6. при необходимости `agent-registry.service.ts` и `tool-call.planner.ts`.

Без этого новый routing считается неканоничным.

---

## 13. Критические ошибки и запреты

- Запрещено описывать платформу как свободную `all-to-all` agent mesh.
- Запрещено выбирать owner-agent по route вместо intent ownership.
- Запрещено считать template/future role production owner-agent.
- Запрещено смешивать `read authority` с `write authority`.
- Запрещено скрывать ownership gap под fallback-ответом.
- Запрещено дублировать owner одного и того же intent-а между агентами без явного primary owner.
- Запрещено размывать `contracts_agent` в generic `commerce_agent`.

---

## 14. Проверка готовности

Документ считается оформленным правильно, если:

- для каждого подтверждённого домена указан primary owner-agent;
- для конфликтных зон указаны правила выбора owner;
- handoff-path разделён на `allowed`, `future`, `forbidden`;
- authority model отделена от ownership model;
- fallback mode описан как отдельное состояние;
- future/template roles явно отделены от канонических runtime-агентов;
- документ связан с каталогом, ownership map, профилями и кодом.

---

## 15. Связанные файлы и точки кода

- [INSTRUCTION_AGENT_PLATFORM_INTERACTION_ARCHITECTURE.md](./INSTRUCTION_AGENT_PLATFORM_INTERACTION_ARCHITECTURE.md)
- [INSTRUCTION_AGENT_CATALOG_AND_RESPONSIBILITY_MAP.md](./INSTRUCTION_AGENT_CATALOG_AND_RESPONSIBILITY_MAP.md)
- [INSTRUCTION_AGENT_DOMAIN_GAPS_AND_UNOWNED_MODULES.md](./INSTRUCTION_AGENT_DOMAIN_GAPS_AND_UNOWNED_MODULES.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](../../00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [agent-registry.service.ts](../../apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [supervisor-agent.service.ts](../../apps/api/src/modules/rai-chat/supervisor-agent.service.ts)
- [agent-runtime.service.ts](../../apps/api/src/modules/rai-chat/runtime/agent-runtime.service.ts)
- [agent-execution-adapter.service.ts](../../apps/api/src/modules/rai-chat/runtime/agent-execution-adapter.service.ts)
- [tool-call.planner.ts](../../apps/api/src/modules/rai-chat/runtime/tool-call.planner.ts)
- [agent-interaction-contracts.ts](../../apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)
- [agent-management.service.ts](../../apps/api/src/modules/explainability/agent-management.service.ts)
- [INSTRUCTION_AGENT_PROFILE_FRONT_OFFICE_AGENT.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_FRONT_OFFICE_AGENT.md)
- [INSTRUCTION_AGENT_PROFILE_AGRONOMIST.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_AGRONOMIST.md)
- [INSTRUCTION_AGENT_PROFILE_CRM_AGENT.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_CRM_AGENT.md)
- [INSTRUCTION_AGENT_PROFILE_CONTRACTS_AGENT.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_CONTRACTS_AGENT.md)
- [INSTRUCTION_AGENT_PROFILE_LEGAL_ADVISOR.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_LEGAL_ADVISOR.md)
- [INSTRUCTION_AGENT_PROFILE_ECONOMIST.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_ECONOMIST.md)
- [INSTRUCTION_AGENT_PROFILE_KNOWLEDGE.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_KNOWLEDGE.md)
- [INSTRUCTION_AGENT_PROFILE_MONITORING.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_MONITORING.md)
- [INSTRUCTION_AGENT_PROFILE_STRATEGIST.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_STRATEGIST.md)
- [INSTRUCTION_AGENT_PROFILE_FINANCE_ADVISOR.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_FINANCE_ADVISOR.md)
- [INSTRUCTION_AGENT_PROFILE_CONTROLLER.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_CONTROLLER.md)
- [INSTRUCTION_AGENT_PROFILE_MARKETER.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_MARKETER.md)
- [INSTRUCTION_AGENT_PROFILE_PERSONAL_ASSISTANT.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_PERSONAL_ASSISTANT.md)
