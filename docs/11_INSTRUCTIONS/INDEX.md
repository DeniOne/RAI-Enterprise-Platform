---
id: DOC-INS-GEN-001
type: InstructionIndex
layer: Instructions
status: Active
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-08
---

# ИНСТРУКЦИИ — УКАЗАТЕЛЬ И СТАНДАРТ ОФОРМЛЕНИЯ

## 1. Назначение раздела

Раздел `docs/11_INSTRUCTIONS/` предназначен для практических инструкций.

Сюда попадают документы, которые отвечают не на вопрос:

- «что мы строим»;
- «почему это так устроено»;

а на вопрос:

- «как это сделать правильно шаг за шагом».

Это не слой стратегии и не слой архитектурной мотивации.
Это рабочий слой исполнения.

---

## 2. Когда нужно создавать инструкцию

Инструкция обязательна, если задача:

- повторяемая;
- критична для качества продукта;
- требует прохождения нескольких этапов;
- может быть выполнена неправильно без жёсткого порядка действий;
- требует согласованности между продуктом, backend, frontend, governance и тестированием.

Примеры:

- создание нового агента;
- подключение нового доменного адаптера;
- ввод нового governed write-контура;
- выпуск нового UI-модуля с обязательным quality gate;
- миграция критичного доменного процесса.

---

## 3. Структура папок

Рекомендуемая структура:

- `docs/11_INSTRUCTIONS/INDEX.md` — корневой указатель и стандарт;
- `docs/11_INSTRUCTIONS/AGENTS/` — инструкции по агентной платформе;
- `docs/11_INSTRUCTIONS/PLATFORM/` — инструкции по платформенным контурам;
- `docs/11_INSTRUCTIONS/DOMAINS/` — инструкции по доменным модулям;
- `docs/11_INSTRUCTIONS/OPERATIONS/` — эксплуатационные инструкции;
- `docs/11_INSTRUCTIONS/TESTING/` — инструкции по обязательному тестированию и приёмке.

Если тематический блок становится устойчивым, под него создаётся отдельная подпапка.

---

## 4. Как правильно называть инструкции

### 4.1 Основной принцип

Имя файла должно отвечать на вопрос:

**что именно нужно сделать и для какого объекта**

Имя должно быть:

- однозначным;
- прикладным;
- читаемым без открытия файла;
- без абстрактных слов вроде `notes`, `misc`, `thoughts`, `draft2_final`.

### 4.2 Рекомендуемый шаблон имени

`INSTRUCTION_<ОБЪЕКТ>_<ДЕЙСТВИЕ>_<ОБЛАСТЬ>.md`

Примеры:

- `INSTRUCTION_AGENT_CREATION_FULL_LIFECYCLE.md`
- `INSTRUCTION_CRM_AGENT_RUNTIME_ENABLEMENT.md`
- `INSTRUCTION_GOVERNED_WRITE_CONNECTOR_ROLLOUT.md`
- `INSTRUCTION_EVAL_GOLDEN_SET_CREATION.md`

### 4.3 Обязательные правила именования

- только `UPPER_SNAKE_CASE`;
- только ASCII в имени файла;
- префикс `INSTRUCTION_` обязателен;
- название должно быть предметным, а не организационным;
- избегать дат в имени, если документ должен жить долго;
- дата допустима только для одноразовых runbook-инструкций.

---

## 5. Обязательная структура каждой инструкции

Каждая инструкция должна содержать следующие разделы:

1. `Назначение`
2. `Когда применять`
3. `Предварительные условия`
4. `Пошаговый алгоритм`
5. `Что должно получиться на выходе`
6. `Критические ошибки и запреты`
7. `Проверка готовности`
8. `Связанные файлы и точки кода`

Если инструкция описывает создание новой сущности, дополнительно обязательны:

- `Минимальный состав реализации`
- `Точки интеграции`
- `Требования к тестам`
- `Критерии production-ready`

---

## 6. Правила содержания

Инструкция обязана быть:

- конкретной;
- проверяемой;
- пригодной для выполнения другим инженером без устных пояснений.

Запрещено:

- писать расплывчатые рекомендации вместо шагов;
- смешивать стратегические размышления и исполняемую инструкцию;
- пропускать обязательные точки проверки;
- подменять production-путь временными хаками без явной пометки.

---

## 7. Сертификат качества инструкции

Инструкция считается оформленной правильно, если:

- по названию понятно, что она делает;
- по структуре видно полный порядок действий;
- есть явные входы и выходы;
- перечислены все обязательные проверки;
- указаны конкретные файлы, сервисы, API и UX-точки;
- отделён временный путь от полноценного production-пути;
- документ можно использовать как стандарт исполнения.

Если хотя бы одно из этих условий не выполнено, инструкция считается неполной.

---

## 8. Текущий перечень инструкций

### AGENTS

- [INSTRUCTION_AGENT_PLATFORM_INTERACTION_ARCHITECTURE.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_AGENT_PLATFORM_INTERACTION_ARCHITECTURE.md)
  Архитектура взаимосвязей агентной платформы: стратегический канон Stage 2, фактический orchestration spine, типы связности и архитектурные разрывы.

- [INSTRUCTION_AGENT_CATALOG_AND_RESPONSIBILITY_MAP.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_AGENT_CATALOG_AND_RESPONSIBILITY_MAP.md)
  Центральный каталог агентной системы: канонические агенты, плановые роли, домены без owner-agent, матрица ответственности и матрица связей.

- [INSTRUCTION_AGENT_CREATION_FULL_LIFECYCLE.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_AGENT_CREATION_FULL_LIFECYCLE.md)
  Полная инструкция по созданию нового агента: от идеи и контрактов до runtime, UX, governance, тестов и production-ready состояния.

- [INSTRUCTION_CRM_AGENT_INTERACTION_DIAGNOSTICS_AND_FAILURE_MODES.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_CRM_AGENT_INTERACTION_DIAGNOSTICS_AND_FAILURE_MODES.md)
  Разбор проблематики взаимодействия CRM-агента: инцидент регистрации контрагента по ИНН, двойная ошибка execution/composer, соседние риски и обязательные сценарии диагностики.

- [INSTRUCTION_AGENT_DOMAIN_GAPS_AND_UNOWNED_MODULES.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/INSTRUCTION_AGENT_DOMAIN_GAPS_AND_UNOWNED_MODULES.md)
  Карта доменных разрывов: где модуль уже есть, но canonical owner-agent ещё отсутствует или ownership размыт.

- [AGENT_PROFILES/INDEX.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INDEX.md)
  Локальный указатель профилей агентов: канонические runtime-агенты и плановые template-roles в одном месте.

- [INSTRUCTION_AGENT_PROFILE_AGRONOMIST.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_AGRONOMIST.md)
  Подробный профиль `agronomist`: scope, contracts, tools, guardrails и пределы агрономического ownership.

- [INSTRUCTION_AGENT_PROFILE_ECONOMIST.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_ECONOMIST.md)
  Подробный профиль `economist`: plan/fact, сценарии, risk assessment и границы финансового ownership.

- [INSTRUCTION_AGENT_PROFILE_KNOWLEDGE.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_KNOWLEDGE.md)
  Подробный профиль `knowledge`: RAG, grounding, evidence path и запрет на operational write ownership.

- [INSTRUCTION_AGENT_PROFILE_MONITORING.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_MONITORING.md)
  Подробный профиль `monitoring`: сигналы, alerts, risk contour и ограничения на перехват бизнес-доменов.

- [INSTRUCTION_AGENT_PROFILE_CRM_AGENT.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_CRM_AGENT.md)
  Подробный профиль `crm_agent`: контрагенты, аккаунты, контакты, взаимодействия, обязательства и текущий разрыв по `contracts`.

- [INSTRUCTION_AGENT_PROFILE_MARKETER.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_MARKETER.md)
  Профиль плановой роли `marketer`: template-состояние, допустимый marketing scope и требования к canonical enablement.

- [INSTRUCTION_AGENT_PROFILE_STRATEGIST.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_STRATEGIST.md)
  Профиль плановой роли `strategist`: стратегические сценарии, advisory scope и разрыв до runtime family.

- [INSTRUCTION_AGENT_PROFILE_FINANCE_ADVISOR.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_FINANCE_ADVISOR.md)
  Профиль плановой роли `finance_advisor`: финансовый advisory поверх `economist`, ограничения и production-условия.

- [INSTRUCTION_AGENT_PROFILE_LEGAL_ADVISOR.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_LEGAL_ADVISOR.md)
  Профиль плановой роли `legal_advisor`: legal advisory, corpus grounding и требования к отдельному legal owner-agent.

- [INSTRUCTION_AGENT_PROFILE_CONTROLLER.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_CONTROLLER.md)
  Профиль плановой роли `controller`: сверки, контрольный мониторинг, эскалации и ограничения по write path.

- [INSTRUCTION_AGENT_PROFILE_PERSONAL_ASSISTANT.md](/root/RAI_EP/docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES/INSTRUCTION_AGENT_PROFILE_PERSONAL_ASSISTANT.md)
  Профиль плановой роли `personal_assistant`: personal ops scope, privacy guardrails и требования к подтверждениям.
