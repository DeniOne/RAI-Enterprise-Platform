---
id: DOC-INS-AGT-004
type: Instruction
layer: Agents
status: Active
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-08
---

# ИНСТРУКЦИЯ — КАТАЛОГ АГЕНТОВ И КАРТА ОТВЕТСТВЕННОСТИ

## 1. Назначение

Этот документ является центральным каталогом агентной системы `RAI_EP`.

Он нужен для того, чтобы:

- видеть полный состав агентных ролей платформы;
- отделять канонические runtime-агенты от template/future roles;
- фиксировать зоны ответственности;
- видеть домены без agent-owner;
- использовать каталог как стандарт для дальнейшего проектирования связей и ownership map.

---

## 2. Когда применять

Использовать документ обязательно, когда:

- обсуждается новый агент;
- пересматривается зона ответственности существующего агента;
- подключается новый доменный модуль к AI-контуру;
- нужно понять, кому должен принадлежать конкретный бизнес-сценарий;
- нужно выявить дублирование ответственности между агентами.

---

## 3. Предварительные условия

Нужно опираться на:

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [TRUTH_SYNC_STAGE_2_CLAIMS.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/TRUTH_SYNC_STAGE_2_CLAIMS.md)
- [agent-registry.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [agent-management.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/agent-management.service.ts)
- [agent-interaction-contracts.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)

---

## 4. Как читать каталог

### 4.1 Классы ролей

В каталоге используются 3 класса:

- канонический runtime-агент;
- плановая template/future role;
- доменный контур без owner-agent.

### 4.2 Три обязательных слоя описания

Для любой роли или домена нужно читать три уровня:

1. что задумано в Stage 2;
2. что реально подтверждено кодом;
3. какой разрыв между ними остаётся.

### 4.3 Что не считается агентом

Не считается полноценным агентом:

- просто backend-модуль;
- просто onboarding template;
- просто домен, у которого нет runtime-owner;
- просто UI-маршрут без explicit intent-owner.

---

## 5. Стратегический канон Stage 2 по агентам

По Stage 2 агент считается зрелым продуктовым модулем только если у него есть:

- `Focus Contract`
- `Intent Catalog`
- `Required Context Contract`
- `UI Action Surface Contract`

И дополнительно:

- runtime profile;
- tool bindings;
- governance path;
- evidence/traceability;
- тесты и smoke-подтверждение.

Отсутствие этих слоёв означает, что роль ещё не доведена до полноценного product-grade агента.

---

## 6. Текущие канонические агенты

### 6.1 Список

По текущему коду каноническими runtime-агентами являются:

- `agronomist`
- `economist`
- `knowledge`
- `monitoring`
- `crm_agent`
- `front_office_agent`
- `contracts_agent`

Источник: [agent-registry.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-registry.service.ts)

### 6.2 Краткая характеристика

- `agronomist` — агрономия, техкарты, отклонения, агро-рекомендации.
- `economist` — plan/fact, сценарии, риск-оценка.
- `knowledge` — RAG, knowledge lookup, grounding.
- `monitoring` — сигналы, alerts, read-only monitoring contour.
- `crm_agent` — контрагенты, карточки, связи, CRM-операции.
- `front_office_agent` — коммуникационный ingress, dialogue log, task/process detection, эскалации.
- `contracts_agent` — полный commerce-контур: договоры, обязательства, fulfillment, счета, оплаты и AR balance.

---

## 7. Плановые агенты

### 7.1 Список template/future roles

По onboarding templates в системе уже предусмотрены:

- `marketer`
- `strategist`
- `finance_advisor`
- `legal_advisor`
- `controller`
- `personal_assistant`

Источники:

- [agent-management.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/agent-management.service.ts)
- [page.tsx](/root/RAI_EP/apps/web/app/(app)/control-tower/agents/page.tsx)

### 7.2 Как правильно интерпретировать их статус

Это не канонические runtime-агенты.

Это роли, для которых уже есть:

- template manifest;
- базовая product semantics;
- adapter binding;
- governance onboarding path.

Но они ещё не равны полноценным отдельным runtime families.

### 7.3 Реализованная стратегическая роль нового поколения

Отдельно зафиксированы:

- `front_office_agent` как уже реализованный canonical first-wave owner-agent для коммуникационного ingress-контура;
- `contracts_agent` как уже реализованный canonical owner-agent для commerce-контура первой рабочей волны.

При этом их следующие уровни enablement ещё впереди:

- для `front_office_agent`: полноценный Telegram adapter, отдельный thread state store и расширенный handoff/work queue;
- для `contracts_agent`: дальнейшее расширение legal advisory handoff, product UX и extended commerce scenarios.

---

## 8. Домены без agent-owner

### 8.1 Подтверждённые зоны риска

На уровне `Stage 2` и текущего кода owner-agent ещё не доведён до canonical состояния для следующих доменных направлений:

- `legal`
- `strategy`

По ним есть либо модуль, либо template-role, но не завершённый canonical agent-owner.

---

## 9. Матрица ответственности

| Роль / домен | Статус | Класс | Бизнес-домен | Owner domain | Уровень реализации | Ключевые intent-ы / функции | Допустимые сущности | Запрещённые домены | Runtime status | Профиль |
|---|---|---|---|---|---|---|---|---|---|---|
| `agronomist` | активен | канонический | агрономия | `agro` | рабочий reference agent | `tech_map_draft`, `compute_deviations` | `field`, `season`, `tech_map`, `operation` | `crm`, `finance`, `knowledge` writes | canonical | [INSTRUCTION_AGENT_PROFILE_AGRONOMIST.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_AGRONOMIST.md) |
| `economist` | активен | канонический | финансы и экономика | `finance` | рабочий reference agent | `compute_plan_fact`, `simulate_scenario`, `compute_risk_assessment` | `plan`, `season`, `budget`, `finance_metric` | `crm`, `knowledge`, `agronomy` operational writes | canonical | [INSTRUCTION_AGENT_PROFILE_ECONOMIST.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_ECONOMIST.md) |
| `knowledge` | активен | канонический | знания и регламенты | `knowledge` | рабочий reference agent | `query_knowledge` | `document`, `policy`, `knowledge_article` | operational write domains | canonical | [INSTRUCTION_AGENT_PROFILE_KNOWLEDGE.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_KNOWLEDGE.md) |
| `monitoring` | активен | канонический | мониторинг и сигналы | `risk` | рабочий reference agent | `emit_alerts` | `signal`, `alert`, `incident` | `crm`, `finance`, `agronomy` business execution | canonical | [INSTRUCTION_AGENT_PROFILE_MONITORING.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_MONITORING.md) |
| `crm_agent` | активен | канонический | CRM | `crm` | рабочий reference agent | контрагенты, аккаунты, контакты, взаимодействия, обязательства | `party`, `account`, `contact`, `interaction`, `obligation`, `holding`, `farm` | `agronomy`, `finance`, `monitoring`; contracts execution ownership вынесен в `contracts_agent` | canonical | [INSTRUCTION_AGENT_PROFILE_CRM_AGENT.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_CRM_AGENT.md) |
| `front_office_agent` | активен | канонический | front office / communicator ingress | `front_office` | canonical first-wave agent | dialogue logging, communicator filtering, task/process detection, escalation routing | `message`, `dialog_thread`, `task_signal`, `escalation` | чужие domain writes | canonical | [INSTRUCTION_AGENT_PROFILE_FRONT_OFFICE_AGENT.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_FRONT_OFFICE_AGENT.md) |
| `contracts_agent` | активен | канонический | commerce / contracts | `contracts` | canonical first-wave commerce agent | договоры, обязательства, fulfillment, invoice, payment, allocation, AR balance | `contract`, `party_role`, `obligation`, `fulfillment_event`, `invoice`, `payment` | `crm` ownership, legal authority, agronomy, monitoring | canonical | [INSTRUCTION_AGENT_PROFILE_CONTRACTS_AGENT.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_CONTRACTS_AGENT.md) |
| `marketer` | плановый | template role | маркетинг | `marketing` | onboarding template | кампании, воронка, read-model summary | `campaign`, `lead`, `segment` | критичные writes вне governance | future/template | [INSTRUCTION_AGENT_PROFILE_MARKETER.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_MARKETER.md) |
| `strategist` | плановый | template role | стратегия | `strategy` | onboarding template | сценарии, стратегические компромиссы | `scenario`, `initiative`, `portfolio` | autonomous execution | future/template | [INSTRUCTION_AGENT_PROFILE_STRATEGIST.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_STRATEGIST.md) |
| `finance_advisor` | плановый | template role | финансы | `finance` | onboarding template | managed financial advisory | `metric`, `budget`, `plan` | payment / booking writes | future/template | [INSTRUCTION_AGENT_PROFILE_FINANCE_ADVISOR.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_FINANCE_ADVISOR.md) |
| `legal_advisor` | плановый | template role | право | `legal` | onboarding template | clause risks, policy summary, legal corpus | `clause`, `policy`, `requirement` | autonomous legal commitments | future/template | [INSTRUCTION_AGENT_PROFILE_LEGAL_ADVISOR.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_LEGAL_ADVISOR.md) |
| `controller` | плановый | template role | контроль и сверки | `finance` | onboarding template | сверки, контрольный мониторинг, эскалации | `control_case`, `metric`, `signal` | uncontrolled autonomous action | future/template | [INSTRUCTION_AGENT_PROFILE_CONTROLLER.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_CONTROLLER.md) |
| `personal_assistant` | плановый | template role | персональная координация | `productivity` | onboarding template | agenda, coordination, task support | `task`, `reminder`, `summary` | critical governed writes | future/template | [INSTRUCTION_AGENT_PROFILE_PERSONAL_ASSISTANT.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_PERSONAL_ASSISTANT.md) |

---

## 10. Матрица связей

| Роль / домен | Основной вход через оркестратор | Допустимый handoff | Peer-to-peer связи | Доменные модули | Ключевой разрыв |
|---|---|---|---|---|---|
| `agronomist` | `Supervisor -> Runtime -> Adapter` | только через центральный spine | не подтверждены | `tech-map`, `consulting`, `agro-events` | нет формализованного handoff map ко всем смежным доменам |
| `economist` | `Supervisor -> Runtime -> Adapter` | только через центральный spine | не подтверждены | `consulting`, `finance-economy` | financial owner map шире текущих intent-ов |
| `knowledge` | `Supervisor -> Runtime -> Adapter` | только через центральный spine | не подтверждены | `knowledge` | knowledge role не должна подменять operational owners |
| `monitoring` | `Supervisor -> Runtime -> Adapter` | только через центральный spine | не подтверждены | `risk`, `monitoring` | risk contour не должен захватывать чужие домены |
| `crm_agent` | `Supervisor -> Runtime -> Adapter` | только через центральный spine | не подтверждены | `crm`, `commerce/parties` | договорный handoff должен идти в `contracts_agent`, а не расширять CRM scope |
| `front_office_agent` | `Supervisor -> Runtime -> Adapter` | только через центральный spine | не подтверждены | `front-office`, `telegram`, `task`, `advisory` | полный production ingress и work queue ещё не завершены |
| `contracts_agent` | `Supervisor -> Runtime -> Adapter` | только через центральный spine | не подтверждены | `commerce`, `contracts`, `fulfillment`, `billing` | legal runtime owner ещё не создан, часть handoff остаётся advisory-only |
| template roles | через future-role onboarding и adapter binding | только через canonical adapter | не подтверждены | зависит от template | нет собственной canonical runtime family |

---

## 11. Разрывы между Stage 2 каноном и текущей реализацией

- Не для каждого домена Stage 2 есть owner-agent.
- Не каждая стратегическая роль доведена до canonical runtime family.
- Плановые роли существуют как template/governance сущности, но ещё не как полные агенты.
- Домен `contracts` больше не является ownership gap: теперь он подтверждает, что unowned module нужно доводить до canonical owner-agent, а не маскировать fallback-ом.
- Полная ownership map платформы ещё не замкнута.

---

## 12. Что должно получиться на выходе

После использования этого каталога должно быть возможно:

- определить owner-agent для любого нового сценария;
- отличить runtime-agent от template role;
- отличить agent-owner от просто доменного модуля;
- быстро увидеть, где нужно расширять responsibility contracts;
- использовать каталог как source of truth для следующей волны agent enablement.

---

## 13. Критические ошибки и запреты

- Запрещено называть template-role каноническим агентом.
- Запрещено называть доменный модуль агентом, если у него нет owner-agent.
- Запрещено скрывать разрывы ownership за формулировкой “сценарий пока обрабатывается fallback-ом”.
- Запрещено дублировать зоны ответственности между агентами без явной фиксации owner.

---

## 14. Проверка готовности

Каталог считается годным, если:

- перечислены все канонические runtime-агенты;
- перечислены все подтверждённые template roles;
- отдельно выделены домены без owner-agent;
- есть матрица ответственности;
- есть матрица связей;
- каталог ссылается на подробные профили;
- описание опирается и на Stage 2, и на код.

---

## 15. Связанные файлы и точки кода

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [TRUTH_SYNC_STAGE_2_CLAIMS.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/TRUTH_SYNC_STAGE_2_CLAIMS.md)
- [agent-registry.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [agent-management.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/agent-management.service.ts)
- [agent-interaction-contracts.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)
- [tool-call.planner.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/runtime/tool-call.planner.ts)
