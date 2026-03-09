---
id: DOC-INS-AGT-005
type: Instruction
layer: Agents
status: Active
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-08
---

# ИНСТРУКЦИЯ — ДОМЕННЫЕ РАЗРЫВЫ И МОДУЛИ БЕЗ АГЕНТНОГО ВЛАДЕЛЬЦА

## 1. Назначение

Документ фиксирует домены, где:

- бизнес-модуль уже существует;
- либо Stage 2 уже требует agent-owner;
- но owner-agent не доведён до canonical runtime состояния.

Документ нужен, чтобы:

- не путать наличие модуля с наличием агента;
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
- но в runtime нет канонического agent-owner;
- нет intent-owner в routing layer;
- нет tool surface и rich-output path для этого домена.

Иными словами:

`модуль есть` != `agent-owner есть`

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

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md)
- [A_RAI_AGENT_INTERACTION_BLUEPRINT.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/A_RAI_AGENT_INTERACTION_BLUEPRINT.md)

---

## 5. Текущий перечень доменов без владельца

## 5.1 `commerce/contracts`

### Что подтверждено кодом

- модуль существует;
- есть контроллер и сервис:
  - [commerce.controller.ts](/root/RAI_EP/apps/api/src/modules/commerce/commerce.controller.ts)
  - [commerce-contract.service.ts](/root/RAI_EP/apps/api/src/modules/commerce/services/commerce-contract.service.ts)

### Чего нет

- нет канонического contract-owner агента;
- нет intent-а на создание/ведение договора в routing layer;
- нет AI tool surface для договоров;
- текущий `crm_agent` не включает `contracts` в свою подтверждённую owner-зону.

### Как проявляется в UX

- пользователь пишет про новый договор;
- чат рисует route-based fallback;
- создаётся видимость работы системы, но реального owner-agent нет.

## 5.2 `legal`

### Что подтверждено

- есть legal-модуль;
- есть плановая роль `legal_advisor`.

### Чего нет

- нет канонического runtime-agent уровня `legal`;
- нет подтверждённого platform-wide contract-layer для legal-сценариев.

## 5.3 `strategy`

### Что подтверждено

- есть strategic-модуль;
- есть плановая роль `strategist`.

### Чего нет

- нет канонического runtime-agent уровня `strategy`;
- нет подтверждённого intent-owner для стратегических сценариев как отдельной family.

---

## 6. Рекомендуемый будущий agent-owner

| Домен | Рекомендуемый owner-agent | Причина |
|---|---|---|
| `commerce/contracts` | отдельный `contracts_agent` или `commerce_agent` | договорный контур слишком широк, чтобы безоговорочно вшивать его в текущий `crm_agent` |
| `legal` | `legal_advisor` как будущий canonical agent | role уже предусмотрена в templates и логически соответствует домену |
| `strategy` | `strategist` как будущий canonical agent | стратегический домен уже выделен как отдельная role-template |

### Правило

Если домен:

- имеет собственную бизнес-логику;
- несёт отдельные риски;
- требует своих intent-ов и guardrails;

то его лучше развивать как отдельного owner-agent, а не как бесконтрольное расширение чужого агента.

---

## 7. Риск для оркестрации и UX

Если домен остаётся без owner-agent, возникают риски:

- fallback маскирует отсутствие реального agent path;
- responsibility map платформы становится нечёткой;
- пользователю кажется, что агент “умеет домен”, хотя это не так;
- усложняется routing;
- возникает соблазн расширять чужой агент за пределы его домена;
- растёт риск хаотического `all-to-all` мышления вместо hub-and-spoke модели.

---

## 8. Что должно получиться на выходе

После использования документа должно быть возможно:

- быстро определить, почему конкретный доменный сценарий ещё не работает через AI;
- обосновать создание нового owner-agent;
- приоритизировать следующий контур для enablement;
- не путать частичный UX fallback и реальную agent integration.

---

## 9. Критические ошибки и запреты

- Запрещено считать домен покрытым, если у него нет owner-agent.
- Запрещено лечить ownership gap только косметикой UI.
- Запрещено расширять чужой agent scope без явной фиксации нового ownership contract.
- Запрещено называть future role решением проблемы, если runtime family не создана.

---

## 10. Проверка готовности

Документ считается пригодным, если:

- перечислен минимум один подтверждённый разрыв;
- для каждого разрыва описано, что есть и чего нет;
- указан рекомендуемый будущий owner-agent;
- описан риск для оркестрации и UX;
- документ ссылается на Stage 2 canon и на реальные точки кода.

---

## 11. Связанные файлы и точки кода

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md)
- [A_RAI_AGENT_INTERACTION_BLUEPRINT.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/A_RAI_AGENT_INTERACTION_BLUEPRINT.md)
- [commerce.controller.ts](/root/RAI_EP/apps/api/src/modules/commerce/commerce.controller.ts)
- [commerce-contract.service.ts](/root/RAI_EP/apps/api/src/modules/commerce/services/commerce-contract.service.ts)
- [agent-interaction-contracts.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)
- [agent-management.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/agent-management.service.ts)
