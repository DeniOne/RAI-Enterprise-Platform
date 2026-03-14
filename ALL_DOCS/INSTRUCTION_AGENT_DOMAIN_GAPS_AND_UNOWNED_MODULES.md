---
id: DOC-INS-AGENTS-INSTRUCTION-AGENT-DOMAIN-GAPS-AND-U-HQXF
layer: Instructions
type: Instruction
status: approved
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-10
---
# ИНСТРУКЦИЯ — ДОМЕННЫЕ РАЗРЫВЫ И МОДУЛИ БЕЗ АГЕНТНОГО ВЛАДЕЛЬЦА

## 1. Назначение

Документ фиксирует домены, где:

- бизнес-модуль уже существует;
- либо Stage 2 уже требует agent-owner;
- но owner-agent не доведён до canonical runtime состояния;
- либо логический owner уже определён, но direct production-routing в него ещё запрещён.

Документ нужен, чтобы:

- не путать наличие модуля с наличием агента;
- не путать логического owner домена с production owner для оркестратора;
- проектировать следующую волну ownership map;
- приоритизировать новые agent families;
- объяснять UX-инциденты, когда система сваливается в fallback вместо реального доменного агента.

---

## 2. Когда применять

Использовать документ нужно, если:

- найден сценарий, где чат показывает fallback вместо реального execution path;
- обсуждается расширение ownership map;
- создаётся новый canonical агент;
- нужно обосновать, почему существующий модуль ещё не считается agent-enabled;
- нужно понять, какой следующий домен превращать в owner-agent.

---

## 3. Что считается агентным разрывом

Агентным разрывом считается ситуация, когда:

- backend-модуль существует;
- продуктовый сценарий существует;
- Stage 2 логика предполагает owner-agent;
- но в production-routing нет допустимого канонического agent-owner;
- нет intent-owner в routing layer;
- нет tool surface и rich-output path для этого домена.

Иными словами:

`модуль есть` != `agent-owner есть`

### 3.1 Типы агентных разрывов

Для этого документа нужно различать два разных класса gap:

- `NO OWNER YET` — у домена нет ни canonical runtime owner, ни even template-role, пригодной как production owner;
- `LOGICAL OWNER EXISTS, BUT NOT PRODUCTION-ROUTABLE` — логический owner уже зафиксирован в Stage 2 и template-layer, но direct production-routing в него ещё запрещён.

Дополнительный рабочий случай:

- `PARTIAL CANONICAL COVERAGE` — canonical owner уже есть, но домен покрыт не полностью. Это важно для roadmap, но не равно отсутствию owner-agent.

---

## 4. Стратегический канон Stage 2 по ownership

По Stage 2 зрелый домен должен иметь:

- owner-agent;
- явную зону ответственности;
- contracts уровня `Focus / Intent / Context / UI`;
- governed execution path;
- explainability и traceability;
- тесты и smoke-подтверждение.

Если этого нет, домен считается неполностью подключённым к Agent Platform.

Источники:

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md](../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md)
- [A_RAI_AGENT_INTERACTION_BLUEPRINT.md](../00_STRATEGY/STAGE%202/A_RAI_AGENT_INTERACTION_BLUEPRINT.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](../00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- `INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md` (routing canon)

---

## 5. Текущая карта разрывов

### 5.1 Домены, где логический owner уже есть, но production-routing ещё запрещён

| Домен | Логический owner | Что уже подтверждено | Что ещё отсутствует | Routing сегодня | Gap severity |
|---|---|---|---|---|---|
| `legal` | `legal_advisor` | есть legal-module; есть template-role; legal advisory-path уже логически зафиксирован | нет canonical runtime family; нет отдельного intent catalog; нет production execution path | direct routing в `legal_advisor` запрещён; mixed legal/contract запросы удерживаются у `contracts_agent`, retrieval идёт через `knowledge` | `HIGH` |
| `strategy` | `strategist` | есть strategic module; есть template-role; strategy semantics описана | нет canonical runtime family; нет strategy intent-owner как отдельной family; нет production execution path | direct routing в `strategist` запрещён; production-routing остаётся у `economist` или `knowledge` по доминирующему действию | `HIGH` |
| `marketing` | `marketer` | есть template-role; marketing template semantics уже описана | нет canonical runtime family; нет runtime intents; нет подтверждённого tool layer в `rai-chat` runtime | direct routing в `marketer` запрещён; marketing/advisory запросы удерживаются у `knowledge` или `crm_agent` по контексту | `MEDIUM` |
| `control` | `controller` | есть template-role; control semantics и template inheritance подтверждены | нет canonical runtime family; нет exception contract; нет production split с `monitoring` и `economist` | direct routing в `controller` запрещён; production-routing остаётся у `monitoring` или `economist` | `HIGH` |
| `personal_ops` | `personal_assistant` | есть template-role; есть delegated/personal semantics | нет canonical runtime family; нет personal context contract; нет privacy-safe production tool surface | direct routing в `personal_assistant` запрещён; business-запросы остаются у доменного owner-agent | `MEDIUM` |

### 5.2 Домены, где owner-agent ещё не определён вообще

| Домен | Что уже подтверждено | Чего нет | Routing сегодня | Gap severity |
|---|---|---|---|---|
| `hr` | домен присутствует в platform map | нет owner-agent; нет template-role; нет intent-owner; нет agent runtime path | `MANUAL_HUMAN_REQUIRED` | `MEDIUM` |
| `exploration` | есть product/module presence в platform map | нет owner-agent; нет canonical intent-owner; нет runtime family | `BACKLOG_ONLY` или read-only support через `knowledge` | `LOW` |

### 5.3 Как читать severity после введения production gate

- `HIGH` — домен уже логически выделен, но его отсутствие как production owner серьёзно искажает routing или важные advisory/execution границы.
- `MEDIUM` — домен нужен, но сейчас может жить через bounded fallback без критического распада ownership.
- `LOW` — поддерживающий или исследовательский контур, где отсутствие owner-agent ещё не ломает основную multi-agent topology.

---

## 6. Рекомендуемый будущий agent-owner

| Домен | Рекомендуемый owner-agent | Что это закроет |
|---|---|---|
| `legal` | `legal_advisor` как будущий canonical agent | legal advisory перестанет маскироваться под `contracts_agent` или `knowledge`, а оркестратор получит честный legal owner-path |
| `strategy` | `strategist` как будущий canonical agent | стратегические сценарии перестанут размываться между `economist` и `knowledge` |
| `marketing` | `marketer` как будущий canonical agent | marketing advisory и CRM-adjacent сценарии получат отдельный ownership вместо косвенного routing через `knowledge`/`crm_agent` |
| `control` | `controller` как будущий canonical agent | контрольные exceptions перестанут размазываться между `monitoring` и `economist` |
| `personal_ops` | `personal_assistant` как будущий canonical agent | личный delegated contour отделится от бизнес-owner-агентов и не будет искажать routing |
| `hr` | owner-agent пока не определён | сначала нужно зафиксировать owner-domain semantics и intent-owner зону |
| `exploration` | owner-agent пока не определён | сначала нужно решить, нужен ли вообще отдельный owner-agent, а не supporting read contour |

### Правило

Если домен:

- имеет собственную бизнес-логику;
- несёт отдельные риски;
- требует своих intent-ов и guardrails;

то его лучше развивать как отдельного owner-agent, а не как бесконтрольное расширение чужого агента.

Но отдельный owner-agent считается закрытым только после появления:

- canonical runtime family;
- intent catalog;
- required context contract;
- execution path, в который оркестратор имеет право делать production-routing.

---

## 7. Риск для оркестрации и UX

Если домен остаётся в gap-состоянии, возникают разные классы рисков.

### 7.1 Риск для `NO OWNER YET`

- сценарий уходит в `MANUAL_HUMAN_REQUIRED` или `BACKLOG_ONLY`;
- ownership map имеет реальную дыру;
- оркестратор не может даже логически определить будущий owner-path;
- возникает давление на соседние агенты, чтобы они захватили чужой домен.

### 7.2 Риск для `LOGICAL OWNER EXISTS, BUT NOT PRODUCTION-ROUTABLE`

- fallback маскирует отсутствие реального agent path;
- responsibility map платформы становится нечёткой;
- пользователю кажется, что агент “умеет домен”, хотя это не так;
- усложняется routing;
- возникает соблазн направить запрос прямо в template-role, потому что у неё уже есть profile и manifest;
- возникает соблазн расширять чужой агент за пределы его домена;
- растёт риск хаотического `all-to-all` мышления вместо hub-and-spoke модели.

Для маршрутизации такие разрывы должны трактоваться по правилам
`INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md`,
а не закрываться prose-fallback.

---

## 8. Что должно получиться на выходе

После использования документа должно быть возможно:

- быстро определить, почему конкретный доменный сценарий ещё не работает через AI;
- быстро понять, это `NO OWNER YET` или `LOGICAL OWNER EXISTS, BUT NOT PRODUCTION-ROUTABLE`;
- увидеть, кто является текущим routing substitute до enablement;
- обосновать создание нового owner-agent;
- приоритизировать следующий контур для enablement;
- не путать частичный UX fallback и реальную agent integration.

---

## 9. Критические ошибки и запреты

- Запрещено считать домен покрытым, если у него нет owner-agent.
- Запрещено считать gap закрытым только потому, что у домена уже есть template-role или profile.
- Запрещено лечить ownership gap только косметикой UI.
- Запрещено расширять чужой agent scope без явной фиксации нового ownership contract.
- Запрещено называть future role решением проблемы, если runtime family не создана.
- Запрещено смешивать `NO OWNER YET` и `LOGICAL OWNER EXISTS, BUT NOT PRODUCTION-ROUTABLE` как будто это один и тот же тип разрыва.

---

## 10. Проверка готовности

Документ считается пригодным, если:

- перечислены оба типа gap, если они присутствуют в системе;
- для каждого разрыва описано, что есть и чего нет;
- для каждого gap указан текущий routing-режим;
- для future/template-доменов явно указано, что direct production-routing запрещён;
- указан рекомендуемый будущий owner-agent;
- описан риск для оркестрации и UX;
- документ ссылается на Stage 2 canon и на реальные точки кода.

---

## 11. Связанные файлы и точки кода

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md](../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md)
- [A_RAI_AGENT_INTERACTION_BLUEPRINT.md](../00_STRATEGY/STAGE%202/A_RAI_AGENT_INTERACTION_BLUEPRINT.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](../00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [INSTRUCTION_AGENT_CATALOG_AND_RESPONSIBILITY_MAP.md](./INSTRUCTION_AGENT_CATALOG_AND_RESPONSIBILITY_MAP.md)
- `INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md` (routing canon)
- [RAI_CONTRACTS_AGENT_CANON.md](../00_STRATEGY/STAGE%202/RAI_CONTRACTS_AGENT_CANON.md)
- [commerce.controller.ts](../../apps/api/src/modules/commerce/commerce.controller.ts)
- [commerce-contract.service.ts](../../apps/api/src/modules/commerce/services/commerce-contract.service.ts)
- [agent-interaction-contracts.ts](../../apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)
- [agent-management.service.ts](../../apps/api/src/modules/explainability/agent-management.service.ts)
