# Phase Beta Contour Analysis (2026-02-08)

## 1) Executive Summary
- Backend по Phase Beta в целом реализован, но покрытие по контурам неравномерное.
- Back-office: есть рабочие API по реестрам, финансам, legal/GR, но часть CMR-функций остается на уровне заглушек.
- Front-office: ядро API есть (поля, задачи, техкарты, оркестратор), но полноценный продуктовый web-интерфейс отсутствует.
- Frontend сейчас не отражает заявленный scope Beta (нет role-based кабинетов, нет CMR UI, нет полноценного front-office workflow UI).

## 2) Back-Office (Contour 1) — фактическое состояние

### 2.1 Реестры и орг-структура
- `POST/GET/DELETE /api/registry/clients/holdings/*`, `PUT /api/registry/clients/:id/holding`
  - файл: `apps/api/src/modules/client-registry/client-registry.controller.ts`
- `POST/GET /api/registry/identities/roles`, `GET /api/registry/identities/profiles`, `PUT /api/registry/identities/profiles/:id/status`
  - файл: `apps/api/src/modules/identity-registry/identity-registry.controller.ts`
- Вывод: базовые реестры реализованы.

### 2.2 CMR (Consulting Control Plane)
- `POST /api/cmr/reviews`
- `POST /api/cmr/reviews/:id/response`
- `GET /api/cmr/risks/assess`
- `GET /api/cmr/decisions`
  - файл: `apps/api/src/modules/cmr/cmr.controller.ts`
- Риск/пробел: `reviews/:id/response` возвращает placeholder, `decisions` возвращает пустой массив (фактическая бизнес-логика не завершена на уровне API-контракта).

### 2.3 HR
- `GET /api/hr/pulse/surveys`
- `POST /api/hr/pulse/submit`
  - файл: `apps/api/src/modules/hr/development/pulse.controller.ts`
- Вывод: есть минимальный API-срез по pulse, но полноценного web-контура HR (foundation/incentive/development) не видно.

### 2.4 Finance & Economy
- `GET /api/ofs/finance/dashboard`
  - файл: `apps/api/src/modules/finance-economy/ofs/application/ofs.controller.ts`
- Вывод: CFO dashboard endpoint есть и используется web-dashboard.

### 2.5 Legal & GR
- `GET /api/legal/dashboard`, `GET /api/legal/requirements/:domain`, `POST /api/legal/check/:id`
  - файл: `apps/api/src/modules/legal/controllers/legal.controller.ts`
- `GET /api/gr/regulators`, `GET /api/gr/interactions`, `GET /api/gr/signals`
  - файл: `apps/api/src/modules/legal/controllers/gr.controller.ts`
- Вывод: legal/GR контур в API присутствует.

## 3) Front-Office (Contour 2) — фактическое состояние

### 3.1 Поля и исполнение
- `POST/GET /api/registry/fields`
  - файл: `apps/api/src/modules/field-registry/field-registry.controller.ts`
- Вывод: базовый реестр полей реализован.

### 3.2 Операционные задачи
- `GET /api/tasks/my`, `GET /api/tasks/:id`
- `POST /api/tasks/:id/start|complete|cancel`
  - файл: `apps/api/src/modules/task/task.controller.ts`
- Вывод: task lifecycle API реализован.

### 3.3 Техкарты
- `POST /api/tech-map/generate`
- `GET /api/tech-map/:id/validate`
- `GET /api/tech-map/:id`
- `GET /api/tech-map/season/:seasonId`
- `POST /api/tech-map/:id/activate`
  - файл: `apps/api/src/modules/tech-map/tech-map.controller.ts`
- Вывод: техкарты есть как API, но нет полноценного web-builder/workbench.

### 3.4 APL/Orchestrator
- `GET /api/orchestrator/stages`
- `GET /api/orchestrator/seasons/:id/stage|transitions|history`
- `POST /api/orchestrator/seasons/:id/initialize|transition|event`
  - файл: `apps/api/src/modules/agro-orchestrator/agro-orchestrator.controller.ts`
- Вывод: lifecycle orchestration API реализован.

## 4) Frontend — реальное покрытие

### 4.1 Что есть
- `apps/web/app/dashboard/page.tsx` (сводный dashboard, advisory block, finance block, tech-map cards).
- `apps/web/app/dashboard/tasks/create/page.tsx` (создание задачи).
- `apps/web/app/dashboard/tech-maps/[id]/page.tsx` (просмотр техкарты).
- `apps/web/app/strategic/*` (стратегический экран + legal/rd views).

### 4.2 Чего нет (критично)
- Нет role-based UX (кабинеты/меню руководителя, менеджера, агронома, оператора).
- Нет CMR интерфейса (очередь deviation review, согласования, риск-матрица, decision log).
- Нет полноценного front-office workflow UI (операционный центр полей/сезонов/оркестратора).
- Нет единой навигационной модели для Back-office vs Front-office контуров.

### 4.3 Технические рассинхроны web -> api
- Dashboard использует `GET /api/tasks`, `GET /api/fields`, `GET /api/seasons`, `GET /api/tech-map` (без параметров), при этом фактические REST-контракты иные (`/tasks/my`, `/registry/fields`, tech-map list route отсутствует).
- Файл: `apps/web/app/dashboard/page.tsx`
- Вывод: часть карточек может показывать нули не из-за пустых данных, а из-за несоответствия маршрутов.

## 5) Заключение
- Проблема не в отсутствии backend-функций как таковых, а в том, что frontend не доведен до продуктового уровня Beta.
- Для закрытия разрыва нужно выделить отдельный фронтенд-поток: role UX + CMR UI + Front-office workflow UI + контрактная синхронизация с API.
