---
id: DOC-INS-AGT-001
type: Instruction
layer: Instructions
domain: Agents
status: Active
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-10
---

# ПОЛНАЯ ИНСТРУКЦИЯ ПО СОЗДАНИЮ НОВОГО АГЕНТА

## 1. Назначение

Эта инструкция описывает полный путь создания нового агента:

- от появления идеи;
- до состояния production-ready полноценного агентного модуля.

Под «полным функционалом» в этой инструкции понимается не future role поверх существующего адаптера, а агент, который:

- имеет собственную продуктовую рамку;
- встроен в runtime;
- имеет контракты ответственности;
- умеет исполнять свои intent-ы;
- подключён к UX;
- проходит governance;
- имеет тесты и критерии приёмки.

---

## 2. Когда применять

Применять всегда, когда нужно:

- создать нового доменного агента;
- создать нового рабочего агента;
- вывести нового агента в продуктовый UX;
- перевести временный future role в полноценного native агента.

Если нужен только быстрый временный запуск на существующем адаптере, используется упрощённый onboarding path через UX-конфигуратор.
Эта инструкция нужна именно для полного пути.

---

## 3. Предварительные условия

Перед началом должны быть известны:

- бизнес-цель агента;
- домен агента;
- класс задач, за который он отвечает;
- какие системы и данные ему нужны;
- будет ли у него read-only или write/guided-write функционал;
- какие UI-поверхности он должен открывать;
- какие риски и ограничения у него есть.

Дополнительно обязательно учитывать lifecycle-канон:

- [RAI_AGENT_EVOLUTION_AND_LIFECYCLE.md](../00_STRATEGY/STAGE%202/RAI_AGENT_EVOLUTION_AND_LIFECYCLE.md)

Перед началом реализации обязательно ответить на вопросы:

1. Это действительно новый агент, а не новый intent существующего агента?
2. Нужен ли ему собственный tools registry?
3. Нужен ли ему собственный native runtime role?
4. Есть ли у него write-path, требующий human gate?
5. Как будет доказываться его полезность через eval и UX?

---

## 4. Итоговый результат, который считается правильным

Новый агент считается реализованным корректно только если одновременно выполнено всё:

- описан `Focus Contract`;
- описан `Intent Catalog`;
- описан `Required Context Contract`;
- описан `UI Action Surface Contract`;
- описан `Guardrails Contract`;
- агент встроен в runtime как first-class role;
- у агента есть агентный сервис и инструменты;
- router умеет его выбирать;
- clarification flow работает;
- UX умеет показать его рабочие окна и действия;
- governance валидирует его конфиги;
- определён lifecycle path:
  - onboarding
  - promotion
  - canary
  - rollback
  - retirement
- есть unit / integration / eval / smoke tests;
- агент можно честно включать в production.

---

## 5. Пошаговый алгоритм

### Шаг 1. Зафиксировать продуктовую миссию агента

Нужно письменно определить:

- за что агент отвечает;
- за что агент не отвечает;
- где он первичный исполнитель;
- где он вторичный помощник;
- в каком домене он живёт.

Результат шага:

- краткое текстовое описание агента;
- список разрешённых и запрещённых задач.

Без этого реализация запрещена.

---

### Шаг 2. Определить агентные контракты

Для нового агента нужно задать:

1. `Focus Contract`
2. `Intent Catalog`
3. `Required Context Contract`
4. `UI Action Surface Contract`
5. `Guardrails Contract`

Минимум нужно определить:

- `role`
- `businessDomain`
- `responsibilities`
- `allowedEntityTypes`
- `forbiddenRoutes`
- список intent-ов
- обязательные контекстные ключи
- допустимые UI-действия
- запрещённые intent-ы и действия

Текущая референсная точка:

- `apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts`

Результат шага:

- новый профиль агента появляется в source of truth контрактов.
- одновременно создаётся или обновляется профильный паспорт агента в `docs/11_INSTRUCTIONS/AGENTS/AGENT_PROFILES` в формате `current / max allowed / handoff boundaries`.
- для нового owner-path синхронизируются:
  - [INDEX.md](./AGENT_PROFILES/INDEX.md)
  - [INSTRUCTION_AGENT_CATALOG_AND_RESPONSIBILITY_MAP.md](./INSTRUCTION_AGENT_CATALOG_AND_RESPONSIBILITY_MAP.md)
  - [INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md](./INSTRUCTION_ORCHESTRATOR_ROUTING_AND_AGENT_SELECTION.md)

---

### Шаг 3. Решить, это future role или native агент

Если нужен быстрый временный запуск:

- можно использовать future role;
- привязать к существующему `executionAdapterRole`;
- пройти validation и governance.

Если нужен полноценный агент:

- нужно создавать новый native runtime family;
- future role path недостаточен.

Жёсткое правило:

- template/future role нельзя считать production primary owner, пока не появился canonical runtime family и пока оркестраторский канон не разрешил direct production routing.

Результат шага:

- принято архитектурное решение, какой путь используется.

---

### Шаг 4. Добавить native runtime role

Если агент должен быть полноценным:

- добавить новый canonical role;
- подключить его в agent registry;
- задать runtime defaults;
- подключить effective kernel;
- включить его в explainability/governance surfaces.

Как правило затрагиваются:

- `apps/api/src/modules/rai-chat/agent-registry.service.ts`
- `apps/api/src/modules/rai-chat/runtime/agent-execution-adapter.service.ts`
- `apps/api/src/modules/explainability/agent-config-guard.service.ts`
- DTO и registry read models

Результат шага:

- платформа знает этого агента как нативную роль, а не как временную надстройку.

---

### Шаг 5. Реализовать агентный сервис

Нужно создать отдельный сервис агента по образцу референсных:

- `agronom-agent.service.ts`
- `economist-agent.service.ts`
- `knowledge-agent.service.ts`
- `monitoring-agent.service.ts`
- `crm-agent.service.ts`
- `front-office-agent.service.ts`
- `contracts-agent.service.ts`

Новый агентный сервис обязан:

- принимать intent;
- проверять контекст;
- выбирать допустимые tools;
- возвращать понятный статус:
  - `COMPLETED`
  - `NEEDS_MORE_DATA`
  - `FAILED`

Если агент работает через clarification flow, он обязан возвращать корректный недостающий контекст.

Результат шага:

- у агента появляется рабочий исполнительный слой.

---

### Шаг 6. Реализовать инструменты агента

Для агента нужно определить:

- какие инструменты ему доступны;
- какой у них risk level;
- какие payload/result contracts используются;
- нужен ли human gate;
- нужен ли governed write.

При необходимости создаются:

- новые `RaiToolName`;
- новые payload/result типы;
- новый tools registry;
- доменные сервисы;
- интеграции с connector-ами.

Точки кода:

- `apps/api/src/modules/rai-chat/tools/rai-tools.types.ts`
- `apps/api/src/modules/rai-chat/tools/`

Результат шага:

- агент получает реальные механизмы выполнения задач.

---

### Шаг 7. Научить router выбирать агента

Нужно:

- добавить его intent-ы в contract layer;
- задать trigger hints;
- учесть route/workspace matching;
- учесть guardrails.

Важно:

- агент не должен выбираться только по prompt;
- выбор должен опираться на message + workspace + contracts.

Результат шага:

- `IntentRouter` умеет честно направлять задачи новому агенту.

---

### Шаг 8. Реализовать clarification и resume path

Если агенту нужен контекст для работы, нужно реализовать:

- определение отсутствующих контекстных ключей;
- формирование clarification payload;
- resume execution после добора контекста.

Нужно обеспечить:

- понятный список missing context;
- правильный `pending clarification`;
- автоматический resume, если контекст добран;
- совместимость с composer/work windows.

Результат шага:

- агент не «падает в пустоту» при нехватке данных, а ведёт пользователя по управляемому сценарию.

---

### Шаг 9. Реализовать UX-поверхность агента

Нужно определить и подключить:

- какие окна агент открывает;
- какой режим вывода используется;
- какие действия доступны пользователю;
- в какие маршруты агент может вести;
- какие доменные страницы нужны.

Если агент полнофункциональный, UX должен поддерживать:

- work windows;
- context acquisition;
- result windows;
- action buttons;
- guided navigation.

Результат шага:

- агент становится продуктовым модулем, а не только backend-сервисом.

---

### Шаг 10. Подключить governance

Нужно убедиться, что для агента работают:

- onboarding validation;
- config change request;
- eval gate;
- canary;
- promote;
- rollback;
- explainability;
- traceability;
- incidents и quality loop.

Для write-path обязательно:

- policy checks;
- human gate;
- audit trail;
- replay safety.

Результат шага:

- агент находится внутри production governance-контура.

---

### Шаг 11. Подготовить UX-шаблон создания агента

После того как agent runtime готов, нужно:

- добавить template в onboarding flow;
- задать русскоязычные user-facing метки;
- подставить корректные defaults;
- задать стартовый responsibility binding;
- задать rollout checklist.

Точки кода:

- `apps/api/src/modules/explainability/agent-management.service.ts`
- `apps/web/app/(app)/control-tower/agents/page.tsx`

Результат шага:

- агент можно создавать и настраивать через UX без ручной сборки манифеста.

---

### Шаг 12. Написать тесты

Минимальный набор:

1. unit tests для contract layer;
2. unit tests для агентного сервиса;
3. unit tests для tools registry;
4. router classification tests;
5. clarification/resume tests;
6. governance validation tests;
7. golden eval set;
8. live smoke.

Без этого агент не считается завершённым.

Результат шага:

- агент можно проверять автоматически и стабильно.

---

### Шаг 13. Провести production-ready приёмку

Перед закрытием задачи нужно проверить:

- агент виден в registry;
- intent-ы выбираются корректно;
- чужие задачи не захватываются;
- required context добирается корректно;
- UI работает без хардкодных обходов;
- governance path не ломается;
- eval не деградирует;
- explainability показывает реальную картину исполнения;
- при ошибках агент безопасно откатывается.

Результат шага:

- агент можно считать production-ready.

---

## 6. Минимальный состав реализации

Чтобы новый агент считался полноценным, обычно требуется минимум:

- 1 профиль в contract-layer;
- 1 native runtime role;
- 1 agent service;
- 1 или более tools;
- router support;
- clarification support;
- UX surface;
- governance template;
- test suite.

Если чего-то из этого нет, агент считается частично реализованным.

---

## 7. Что должно получиться на выходе

На выходе должен существовать агент, который:

- честно встроен в платформу;
- не маскируется под старого агента;
- имеет свои рамки ответственности;
- умеет исполнять свои задачи;
- имеет UX и governance;
- проходит тесты;
- может сопровождаться через product-grade process.

---

## 8. Критические ошибки и запреты

Запрещено:

- считать prompt достаточным для создания агента;
- считать future role полноценным native агентом;
- добавлять агента без contracts;
- добавлять write-path без governance;
- выпускать агента без eval и тестов;
- оставлять UX без clarification flow, если агент зависит от контекста;
- закрывать задачу как `done`, если агент не прошёл полный lifecycle.

---

## 9. Проверка готовности

Контрольный список:

- [ ] Описан `Focus Contract`
- [ ] Описан `Intent Catalog`
- [ ] Описан `Required Context Contract`
- [ ] Описан `UI Action Surface Contract`
- [ ] Описан `Guardrails Contract`
- [ ] Оформлен профильный паспорт в `AGENT_PROFILES` в формате `current / max allowed / handoff boundaries`
- [ ] Синхронизированы `INDEX.md`, каталог ответственности и оркестраторский routing-канон
- [ ] Добавлен native runtime role
- [ ] Реализован agent service
- [ ] Реализованы tools
- [ ] Router умеет выбирать агента
- [ ] Clarification/resume path работает
- [ ] UX surface подключён
- [ ] Governance path подключён
- [ ] Есть onboarding template
- [ ] Есть unit tests
- [ ] Есть eval
- [ ] Есть smoke
- [ ] Агент можно честно включать в production

---

## 10. Связанные файлы и точки кода

Ключевые точки:

- `apps/api/src/modules/rai-chat/agent-contracts/agent-interaction-contracts.ts`
- `apps/api/src/modules/rai-chat/intent-router/`
- `apps/api/src/modules/rai-chat/runtime/`
- `apps/api/src/modules/rai-chat/agents/`
- `apps/api/src/modules/rai-chat/tools/`
- `apps/api/src/modules/explainability/agent-config-guard.service.ts`
- `apps/api/src/modules/explainability/agent-management.service.ts`
- `apps/api/src/modules/explainability/agents-config.controller.ts`
- `apps/web/app/(app)/control-tower/agents/page.tsx`
- `apps/web/lib/api.ts`

Связанные документы:

- `docs/00_STRATEGY/STAGE 2/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN.md`
- `docs/00_STRATEGY/STAGE 2/RAI_AGENT_PLATFORM_AND_AI_MASTER_PLAN_ADDENDUM_AGENT_FOCUS_AND_CONTEXT.md`
- `README.md`

