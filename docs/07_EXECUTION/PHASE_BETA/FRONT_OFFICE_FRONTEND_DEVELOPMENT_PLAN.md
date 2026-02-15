---
id: DOC-EXE-GEN-141
type: Phase Plan
layer: Execution
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---

# Front-Office Frontend Development Plan (Beta Closure)

## 1) Цель
- Довести Front-office контур до рабочего продуктового UI поверх существующего API.
- Сфокусироваться на операционном исполнении: поля, сезоны, техкарты, задачи, события оркестратора.

## 2) Scope (что делаем)

### 2.1 Навигация и роли (минимально необходимый каркас)
- Ввести role-aware layout для Front-office:
  - `AGRONOMIST`
  - `FIELD_MANAGER`
  - `OPERATIONS_MANAGER`
- Sidebar/Top-nav:
  - `Операционный центр`
  - `Поля`
  - `Сезоны`
  - `Техкарты`
  - `Задачи`
  - `События/История`

### 2.2 Страницы Front-office
- `/front-office` — Operational Center (сводка по активным сезонам/задачам/алертам).
- `/front-office/fields` — список полей + карточка поля.
- `/front-office/seasons` — список сезонов и текущие стадии.
- `/front-office/tech-maps` — список/статусы техкарт + переход в детали.
- `/front-office/tasks` — очередь задач (мои, в работе, просроченные).
- `/front-office/orchestrator/:seasonId` — стадия, доступные переходы, история событий.

### 2.3 Операционные действия (UI -> API)
- Задачи:
  - start/complete/cancel через `/api/tasks/:id/*`.
- Техкарты:
  - validate/activate через `/api/tech-map/*`.
- Оркестратор:
  - initialize/transition/event через `/api/orchestrator/*`.

## 3) API-гармонизация (обязательный блок)
- Привести web-запросы к реальным контрактам backend:
  - `tasks` -> `/api/tasks/my`
  - `fields` -> `/api/registry/fields`
  - `tech-map list` -> добавить route-handler, который использует `/api/tech-map/season/:seasonId` или отдельный backend list endpoint.
- Добавить типизированный слой `apps/web/lib/api/front-office.ts`.

## 4) План работ (4 спринт-недели)

### Week 1 — Foundation
- Role-aware layout + навигация Front-office.
- API client для fields/tasks/tech-map/orchestrator.
- Исправление текущих route mismatch в dashboard.

### Week 2 — Core Screens
- `fields`, `tasks`, `tech-maps` страницы.
- Действия start/complete/cancel и validate/activate с optimistic UI.

### Week 3 — Orchestrator UX
- `seasons` + `orchestrator/:seasonId`.
- Переходы стадий, события, история.
- Error handling и guardrails на невалидные переходы.

### Week 4 — Stabilization & Release Readiness
- E2E smoke для ключевых сценариев Front-office.
- UX polishing, loading/empty/error states.
- Документация пользовательских flow + короткие demo-сценарии.

## 5) Deliverables
- Рабочий Front-office раздел в `apps/web`.
- Синхронизированный API-contract layer без "битых" endpoint-ов.
- Набор smoke/e2e сценариев:
  - create/assign/start/complete task
  - validate/activate tech-map
  - orchestrator transition with visible history

## 6) Definition of Done
- Основные front-office страницы доступны и работают без ручных патчей.
- Все ключевые CTA выполняют реальный backend вызов и показывают результат.
- Нет прямых вызовов несуществующих endpoint-ов.
- Есть role-aware навигация для операционных ролей.
- Базовые e2e smoke-сценарии зеленые.

## 7) Out of Scope (в этот план не включено)
- Полный CMR UI Back-office.
- Полный HR кабинет.
- Продвинутый AI UX (Gamma-level explainability tuning) вне операционного контура.
