---
id: DOC-STR-FO-006
type: Backlog
layer: Strategy
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-03-09
---

# FRONT_OFFICE_BACKLOG

## 1. Назначение документа

Этот документ переводит `Front-Office` из набора стратегических документов в очередь исполнения.

Цель backlog:

- зафиксировать блокеры;
- разложить работу по этапам;
- выстроить зависимости между `Telegram`, `Web UI`, `API`, агентным слоем и тестами;
- дать понятную последовательность сборки рабочего `Front-Office` контура.

---

## 2. Текущее состояние на 2026-03-09

### Уже есть

- стратегия `Front-Office` как отдельного контура;
- базовые документы: `Scope`, `IA`, `User Flows`, `API Contracts`;
- backend ядро по `fields`, `tasks`, `tech-map`, `orchestrator`, `field-observation`;
- route `/front-office` в web;
- агентный и `Telegram`-контекст в кодовой базе.

### Главные проблемы

- web-контур `Front-Office` пока placeholder;
- нет единой role-aware навигации;
- есть рассинхроны между `frontend` и `backend` контрактами;
- `season`, `deviation`, `consultation`, `context update` не оформлены как единая продуктовая поверхность;
- свободная переписка еще не замкнута в канонический operational flow.

---

## 3. Канонический порядок реализации

### Этап 1

Сначала нужно закрыть контрактную и архитектурную целостность.

### Этап 2

Потом нужен работающий `Telegram-first` операционный контур.

### Этап 3

Дальше нужен полноценный `Web UI` для обзора, контроля и навигации.

### Этап 4

После этого нужно закрыть `deviation`, `consultation`, `context` и агентный слой.

### Этап 5

В конце нужна стабилизация, smoke/e2e, и readiness на реальное использование.

---

## 4. Priority 0 — Blockers

- [ ] Зафиксировать единый `Front-Office` canon как источник истины для продукта, frontend и backend.
- [ ] Убрать расхождения между `apps/web/lib/api/front-office.ts` и реальными controller-ами.
- [ ] Зафиксировать, какие `season` контракты будут REST, а какие останутся GraphQL-only.
- [ ] Зафиксировать каноническую модель `deviation`, `consultation`, `context update` для `Front-Office`.
- [ ] Определить канонический adapter-path для `Telegram` и агента `Front-Office`.

### Definition of Done

- нет неоднозначности, какой контракт считается правильным;
- `frontend`, `telegram` и агентный слой опираются на одну модель действий;
- все P1-сценарии можно связать с конкретными endpoint-ами или явно отмеченными gap'ами.

---

## 5. Priority 1 — Contract Alignment

### 5.1 Fields

- [ ] Добавить `GET /api/registry/fields/:id` или канонический adapter для карточки поля.
- [ ] Определить read-model для `field context`, `field history`, `field events`.

### 5.2 Seasons

- [ ] Ввести продуктовый read-model для `seasons`.
- [ ] Зафиксировать `GET /api/seasons`.
- [ ] Зафиксировать `GET /api/seasons/:id`.
- [ ] Зафиксировать `GET /api/seasons/:id/history`.

### 5.3 Tech Maps

- [ ] Привести frontend к каноническому FSM-контракту техкарт.
- [ ] Определить, будет ли `approve-by-farm` отдельным action endpoint.
- [ ] Определить, нужен ли публичный `activate` endpoint для `Front-Office` вообще.

### 5.4 Tasks

- [ ] Обогатить task write-contract metа-полями канала и source trace.
- [ ] Зафиксировать read endpoints для task history и task evidence.

### 5.5 Observations / Deviations / Consultations / Context

- [ ] Оформить write-contract для observation.
- [ ] Оформить минимальный write-contract для deviation.
- [ ] Оформить write/read-contract для consultation.
- [ ] Оформить write/read-contract для context updates.

---

## 6. Priority 2 — Telegram Core

### 6.1 Telegram Operational Shell

- [ ] Собрать канонический свободный ingress для `Telegram`, а не режимный бот.
- [ ] Оставить только минимальные универсальные действия `Confirm / Fix / Link` там, где они действительно нужны.
- [ ] Реализовать сценарии:
  - мои задачи;
  - старт задачи;
  - завершение задачи;
  - свободный сигнал о проблеме;
  - свободный запрос консультации;
  - свободная передача контекста.

### 6.2 Evidence Intake

- [ ] Привязать фото, гео, голос, документы и таблицы к ingress / draft flow.
- [ ] Убедиться, что исходный message trace сохраняется.
- [ ] Ввести маркировку `weak evidence` при неполных данных.

### 6.3 Telegram Identity / Session

- [ ] Проверить стабильность Telegram-auth для операционных ролей.
- [ ] Зафиксировать tenant/user binding для хозяйств.
- [ ] Проверить сценарии многоролевого использования внутри одного хозяйства.

---

## 7. Priority 3 — Web Front-Office Core

### 7.1 Shell and Navigation

- [ ] Реализовать role-aware `Front-Office` layout.
- [ ] Собрать верхнюю навигацию:
  - `Операционный центр`
  - `Поля`
  - `Сезоны`
  - `Техкарты`
  - `Задачи`
  - `Отклонения`
  - `Контекст`

### 7.2 Core Screens

- [ ] `/front-office`
- [ ] `/front-office/fields`
- [ ] `/front-office/fields/:id`
- [ ] `/front-office/seasons`
- [ ] `/front-office/seasons/:id`
- [ ] `/front-office/tech-maps`
- [ ] `/front-office/tech-maps/:id`
- [ ] `/front-office/tasks`
- [ ] `/front-office/tasks/:id`

### 7.3 Contextual Tabs

- [ ] `Evidence`
- [ ] `History`
- [ ] `Consultations`
- [ ] `Context`

### 7.4 UX State Completion

- [ ] Loading states
- [ ] Empty states
- [ ] Error states
- [ ] Permission states
- [ ] Weak evidence / risk banners

---

## 8. Priority 4 — Deviations and Consultations

### 8.1 Deviation Layer

- [ ] Реализовать реестр отклонений `Front-Office`.
- [ ] Реализовать карточку отклонения.
- [ ] Реализовать evidence attachment к deviation.
- [ ] Реализовать действие `escalate to tech council`.

### 8.2 Consultation Layer

- [ ] Реализовать объект консультации, а не чат без якоря.
- [ ] Связать консультацию с `task`, `field`, `season`, `deviation`.
- [ ] Реализовать timeline консультации.
- [ ] Добавить переходы из задачи, поля, сезона и deviation в консультацию.

---

## 9. Priority 5 — Front-Office Agent

### 9.1 Message Classification

- [ ] Зафиксировать классификацию входящих сообщений:
  - task-related;
  - observation;
  - deviation;
  - consultation;
  - context update;
  - noise.

### 9.2 Agent Actions

- [ ] Агент должен уметь логировать входящие сообщения.
- [ ] Агент должен уметь структурировать свободный текст.
- [ ] Агент должен уметь просить уточнение при неясном контексте.
- [ ] Агент должен уметь создавать draft и доводить его до привязанного operational object через `confirm / commit`.

### 9.3 Governance

- [ ] Зафиксировать, что агент не закрывает deviation и не меняет план.
- [ ] Зафиксировать, что агент выступает маршрутизатором, а не источником управленческого решения.

---

## 10. Priority 6 — Context and Memory

- [ ] Реализовать отдельный поток `ContextUpdated`.
- [ ] Реализовать карточки контекста для хозяйства, поля и сезона.
- [ ] Связать входящие документы и сообщения с контекстной памятью.
- [ ] Обеспечить поиск и повторное использование накопленного контекста в консультациях и задачах.

---

## 11. Priority 7 — Testing and Readiness

### 11.1 API Tests

- [ ] Контрактные тесты для `fields`, `tasks`, `tech-map`, `orchestrator`.
- [ ] Контрактные тесты для новых `deviation`, `consultation`, `context` endpoint-ов.

### 11.2 Telegram Smoke

- [ ] login / identify role
- [ ] receive task
- [ ] start task with evidence
- [ ] complete task with evidence
- [ ] report deviation
- [ ] request consultation

### 11.3 Web Smoke

- [ ] open operational center
- [ ] open field card
- [ ] open season card
- [ ] open tech map
- [ ] open task and perform action
- [ ] open deviation and escalate

### 11.4 E2E Business Scenarios

- [ ] задача пришла -> стартована -> завершена -> факт виден в сезоне
- [ ] отклонение зафиксировано -> ушло в разбор -> видно в карточке сезона
- [ ] консультация создана из задачи -> связана с объектом -> история сохранена
- [ ] свободное сообщение прошло через агента -> стало observation/deviation/context

---

## 12. Priority 8 — Release Readiness

- [ ] подготовить role-by-role demo сценарии;
- [ ] подготовить short training flow для хозяйства;
- [ ] зафиксировать минимальный operational SLA;
- [ ] подготовить checklist запуска пилотного хозяйства;
- [ ] подготовить список метрик внедрения.

---

## 13. Метрики выполнения backlog

Backlog считается закрытым не по количеству экранов, а по следующим признакам:

- `Telegram` реально пригоден для ежедневной работы;
- `Web UI` реально пригоден для обзора и контроля;
- user flows из `Priority 1` и `Priority 2` работают end-to-end;
- нет битых маршрутов и фальшивых CTA;
- свободная переписка больше не теряется как неструктурированный шум;
- deviation и consultation перестают жить "в чате" и становятся объектами системы.

---

## 14. Исполнимый порядок работ

### Sprint 1

- канонизация контрактов;
- закрытие route mismatch;
- минимальный Telegram ingress shell;
- минимальный role-aware web shell.

### Sprint 2

- поля, задачи, сезоны, техкарты;
- карточки;
- evidence flow;
- task lifecycle end-to-end.

### Sprint 3

- deviations;
- consultations;
- context updates;
- agent classification loop.

### Sprint 4

- стабилизация;
- smoke/e2e;
- onboarding and release readiness.

---

## 15. Ключевой вывод

Главная задача backlog не "нарисовать фронт", а собрать полноценный `Front-Office` контур, в котором:

- хозяйство может работать через `Telegram`;
- руководящие роли хозяйства могут контролировать ситуацию через `Web UI`;
- все действия привязаны к объектам и evidence;
- агент `Front-Office` превращает свободную коммуникацию в структурированную операционную модель.
