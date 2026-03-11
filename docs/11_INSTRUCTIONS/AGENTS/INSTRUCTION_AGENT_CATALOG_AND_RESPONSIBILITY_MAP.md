---
id: DOC-INS-AGT-004
type: Instruction
layer: Agents
status: Active
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-10
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

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md](../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](../00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [TRUTH_SYNC_STAGE_2_CLAIMS.md](../00_STRATEGY/STAGE%202/TRUTH_SYNC_STAGE_2_CLAIMS.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](./INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [agent-registry.service.ts](../../apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [agent-management.service.ts](../../apps/api/src/modules/explainability/agent-management.service.ts)
- [agent-interaction-contracts.ts](../../apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)

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

### 4.4 Единый паспортный формат профиля

Подробные профили агентов в пакете `AGENT_PROFILES` должны читаться как единый нормативный паспорт.

Для каждого профиля обязательны секции:

- `Текущий фактический функционал`
- `Максимально допустимый функционал`
- `Нормативные handoff-trigger зоны`
- `Подтверждённые current intent-ы`
- `Максимально допустимый intent-scope`
- `Подтверждённый current tool surface`
- `Максимально допустимый tool surface`
- явная фиксация production-routing статуса

Это правило одинаково для canonical runtime-агентов и для template/future roles.

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

Источник: [agent-registry.service.ts](../../apps/api/src/modules/rai-chat/agent-registry.service.ts)

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

- [agent-management.service.ts](../../apps/api/src/modules/explainability/agent-management.service.ts)
- [page.tsx](../../apps/web/app/(app)/control-tower/agents/page.tsx)

### 7.2 Как правильно интерпретировать их статус

Это не канонические runtime-агенты.

Это роли, для которых уже есть:

- template manifest;
- базовая product semantics;
- adapter binding;
- governance onboarding path.

Но они ещё не равны полноценным отдельным runtime families.

Жёсткое правило:

- наличие profile, template manifest или adapter binding не даёт права production-routing в такую роль как в `primary owner-agent`;
- direct routing в template/future role запрещён до появления canonical runtime family, intent contract и подтверждённого execution path;
- source of truth для production-routing находится в [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](./INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md).

К 2026-03-10 весь пакет подробных профилей приведён к формату `current / max allowed / handoff boundaries`, поэтому каталог нужно читать вместе с профильным паспортом, а не вместо него.

### 7.3 Expert-tier роли

Отдельный класс ролей — expert-tier — находится вне стандартного orchestration spine и вызывается по запросу для глубокой экспертизы:

- `chief_agronomist` — Цифровой Мега-Агроном, верховный агрономический эксперт, встроенный в ядро консалтинга.
- `data_scientist` — Цифровой Аналитик-Прогнозист, глубокий анализ данных, прогнозы урожайности, риск-анализ, паттерн-майнинг, сезонная аналитика. Главный потребитель и генератор данных когнитивной памяти (L1-L6).

Expert-tier роли:

- работают на PRO / Heavy моделях ИИ;
- активируются on-demand, а не постоянно;
- не входят в стандартный orchestration spine;
- имеют собственный expert invocation engine;
- стоят иерархически выше операционных агентов в своём домене;
- поддерживают Lightweight background mode для фоновых аналитических задач.

Детальные профили:
- [INSTRUCTION_AGENT_PROFILE_CHIEF_AGRONOMIST.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_CHIEF_AGRONOMIST.md)
- [INSTRUCTION_AGENT_PROFILE_DATA_SCIENTIST.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_DATA_SCIENTIST.md)

### 7.4 Реализованная стратегическая роль нового поколения

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

Ниже приведён укрупнённый каталог ролей. Детальные границы ownership, handoff и production-routing нужно брать из профильных паспортов в `AGENT_PROFILES`.

| Роль / домен | Статус | Класс | Бизнес-домен | Owner domain | Уровень реализации | Ключевые intent-ы / функции | Допустимые сущности | Запрещённые домены | Runtime status | Профиль |
|---|---|---|---|---|---|---|---|---|---|---|
| `agronomist` | активен | канонический | агрономия | `agro` | рабочий reference agent | `tech_map_draft`, `compute_deviations` | `field`, `season`, `tech_map`, `operation` | `crm`, `finance`, `knowledge` writes | canonical | [INSTRUCTION_AGENT_PROFILE_AGRONOMIST.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_AGRONOMIST.md) |
| `economist` | активен | канонический | финансы и экономика | `finance` | рабочий reference agent | `compute_plan_fact`, `simulate_scenario`, `compute_risk_assessment` | `plan`, `season`, `budget`, `finance_metric` | `crm`, `knowledge`, `agronomy` operational writes | canonical | [INSTRUCTION_AGENT_PROFILE_ECONOMIST.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_ECONOMIST.md) |
| `knowledge` | активен | канонический | знания и регламенты | `knowledge` | рабочий reference agent | `query_knowledge` | `document`, `policy`, `knowledge_article` | operational write domains | canonical | [INSTRUCTION_AGENT_PROFILE_KNOWLEDGE.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_KNOWLEDGE.md) |
| `monitoring` | активен | канонический | мониторинг и сигналы | `risk` | рабочий reference agent | `emit_alerts` | `signal`, `alert`, `incident` | `crm`, `finance`, `agronomy` business execution | canonical | [INSTRUCTION_AGENT_PROFILE_MONITORING.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_MONITORING.md) |
| `crm_agent` | активен | канонический | CRM | `crm` | рабочий reference agent | контрагенты, аккаунты, контакты, взаимодействия, обязательства | `party`, `account`, `contact`, `interaction`, `obligation`, `holding`, `farm` | `agronomy`, `finance`, `monitoring`; contracts execution ownership вынесен в `contracts_agent` | canonical | [INSTRUCTION_AGENT_PROFILE_CRM_AGENT.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_CRM_AGENT.md) |
| `front_office_agent` | активен | канонический | front office / communicator ingress | `front_office` | canonical first-wave agent | dialogue logging, communicator filtering, task/process detection, escalation routing | `message`, `dialog_thread`, `task_signal`, `escalation` | чужие domain writes | canonical | [INSTRUCTION_AGENT_PROFILE_FRONT_OFFICE_AGENT.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_FRONT_OFFICE_AGENT.md) |
| `contracts_agent` | активен | канонический | commerce / contracts | `commerce` | canonical first-wave commerce agent | договоры, обязательства, fulfillment, invoice, payment, allocation, AR balance | `contract`, `party_role`, `obligation`, `fulfillment_event`, `invoice`, `payment` | `crm` ownership, legal authority, agronomy, monitoring | canonical | [INSTRUCTION_AGENT_PROFILE_CONTRACTS_AGENT.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_CONTRACTS_AGENT.md) |
| `marketer` | плановый | template role | маркетинг | `marketing` | onboarding template | кампании, воронка, read-model summary | `campaign`, `lead`, `segment` | критичные writes вне governance | future/template; not production-routable | [INSTRUCTION_AGENT_PROFILE_MARKETER.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_MARKETER.md) |
| `strategist` | плановый | template role | стратегия | `strategy` | onboarding template | сценарии, стратегические компромиссы | `scenario`, `initiative`, `portfolio` | autonomous execution | future/template; not production-routable | [INSTRUCTION_AGENT_PROFILE_STRATEGIST.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_STRATEGIST.md) |
| `finance_advisor` | плановый | template role | финансы | `finance` | onboarding template | managed financial advisory | `metric`, `budget`, `plan` | payment / booking writes | future/template; not production-routable | [INSTRUCTION_AGENT_PROFILE_FINANCE_ADVISOR.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_FINANCE_ADVISOR.md) |
| `legal_advisor` | плановый | template role | право | `legal` | onboarding template | clause risks, policy summary, legal corpus | `clause`, `policy`, `requirement` | autonomous legal commitments | future/template; not production-routable | [INSTRUCTION_AGENT_PROFILE_LEGAL_ADVISOR.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_LEGAL_ADVISOR.md) |
| `controller` | плановый | template role | контроль и сверки | `finance` | onboarding template | сверки, контрольный мониторинг, эскалации | `control_case`, `metric`, `signal` | uncontrolled autonomous action | future/template; not production-routable | [INSTRUCTION_AGENT_PROFILE_CONTROLLER.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_CONTROLLER.md) |
| `personal_assistant` | плановый | template role | персональная координация | `personal_ops` | onboarding template | agenda, coordination, task support | `task`, `reminder`, `summary` | critical governed writes | future/template; not production-routable | [INSTRUCTION_AGENT_PROFILE_PERSONAL_ASSISTANT.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_PERSONAL_ASSISTANT.md) |
| `chief_agronomist` | плановый | expert-tier role | агрономическая экспертиза | `agro_consulting_expert` | не реализован | глубокий агроанализ, экспертная ревизия техкарт, разрешение споров, стратегический advisory, подготовка заключений для техсоветов | `expert_opinion`, `tech_map_review`, `crop_strategy`, `pest_analysis` | рутинные техкарты (за `agronomist`), финансы, CRM, мониторинг | expert-tier; on-demand; PRO-модель; отдельный invocation path | [INSTRUCTION_AGENT_PROFILE_CHIEF_AGRONOMIST.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_CHIEF_AGRONOMIST.md) |
| `data_scientist` | плановый | expert-tier role | аналитика и прогнозирование | `analytics_prediction` | не реализован | прогноз урожайности, риск-анализ болезней, cost-оптимизация, паттерн-майнинг энграмм, кросс-сезонная аналитика, network benchmarking, сезонные отчёты | `yield_prediction`, `risk_analysis`, `cost_optimization`, `pattern_mining`, `benchmark` | прямые операции (за ops-агентов), CRM, юридика | expert-tier; dual-mode (Lightweight cron + Full PRO on-demand); главный потребитель когнитивной памяти L1-L6 | [INSTRUCTION_AGENT_PROFILE_DATA_SCIENTIST.md](./AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_DATA_SCIENTIST.md) |

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
| template roles | через future-role onboarding и adapter binding | только через canonical adapter | не подтверждены | зависит от template | нет собственной canonical runtime family; прямой production-routing запрещён |
| `chief_agronomist` | expert-tier invocation engine (вне orchestration spine) | governed escalation из `agronomist`, handoff из `economist` для экономической оценки, feed из `marketer` | с `agronomist` (делегация расчётов), с `marketer` (информационный feed), с `knowledge` (corpus), с человеческим агрономом (совместная работа) | `consulting`, `tech-map`, `knowledge`, будущий `marketing-feed-adapter`, `expert-invocation-engine` | expert-tier runtime path не реализован; knowledge corpus не наполнен; маркетинговый feed не подключён |
| `data_scientist` | expert-tier invocation engine (вне orchestration spine) + Lightweight cron background | запрос от `supervisor`, `chief_agronomist`, `strategist`, `economist` | с `chief_agronomist` (валидация инсайтов), с `monitoring` (аномалии→прогнозы), с `economist` (ROI-анализ), с `strategist` (benchmark, тренды) | `memory` (MemoryFacade, все L1-L6), `consulting` (TechMap, HarvestResult), `risk` (прогнозные модели), `finance-economy` (cost analysis) | expert-tier runtime path не реализован; ML pipeline не построен; feature store не создан |

---

## 11. Разрывы между Stage 2 каноном и текущей реализацией

- Не для каждого домена Stage 2 есть owner-agent.
- Не каждая стратегическая роль доведена до canonical runtime family.
- Плановые роли существуют как template/governance сущности, но ещё не как полные агенты.
- Логический owner future-роли не равен production owner для оркестратора, пока не пройден enablement gate.
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
- Запрещено маршрутизировать production-запрос прямо в template-role как в `primary owner-agent`.
- Запрещено называть доменный модуль агентом, если у него нет owner-agent.
- Запрещено скрывать разрывы ownership за формулировкой “сценарий пока обрабатывается fallback-ом”.
- Запрещено дублировать зоны ответственности между агентами без явной фиксации owner.
- Запрещено читать каталог без сверки с профильным паспортом `current / max allowed / handoff boundaries`, когда вопрос касается routing или границ ответственности.

---

## 14. Проверка готовности

Каталог считается годным, если:

- перечислены все канонические runtime-агенты;
- перечислены все подтверждённые template roles;
- отдельно выделены домены без owner-agent;
- есть матрица ответственности;
- есть матрица связей;
- template roles явно отделены от production-routing;
- пакет подробных профилей переведён в единый паспортный формат;
- каталог ссылается на подробные профили;
- описание опирается и на Stage 2, и на код.

---

## 15. Связанные файлы и точки кода

- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md](../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md)
- [RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md](../00_STRATEGY/STAGE%202/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md)
- [RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md](../00_STRATEGY/STAGE%202/RAI_AGENT_DOMAIN_OWNERSHIP_MAP.md)
- [TRUTH_SYNC_STAGE_2_CLAIMS.md](../00_STRATEGY/STAGE%202/TRUTH_SYNC_STAGE_2_CLAIMS.md)
- [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](./INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)
- [agent-registry.service.ts](../../apps/api/src/modules/rai-chat/agent-registry.service.ts)
- [agent-management.service.ts](../../apps/api/src/modules/explainability/agent-management.service.ts)
- [agent-interaction-contracts.ts](../../apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts)
- [tool-call.planner.ts](../../apps/api/src/modules/rai-chat/runtime/tool-call.planner.ts)

