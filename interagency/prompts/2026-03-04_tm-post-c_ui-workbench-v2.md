# PROMPT — TM-POST-C: UI TechMap Workbench v2
Дата: 2026-03-04  
Статус: active  
Приоритет: P1  
Decision-ID: AG-TM-POST-C-007

## Цель

Обновить `TechMapWorkbench.tsx` для работы с реальной доменной моделью: визуализация DAG операций (зависимости между операциями по `MapOperation.dependencies`), UI загрузки доказательств (`Evidence`), и UI workflow изменений (`ChangeOrder`). Переход от заглушки к функциональному рабочему столу агронома.

## Контекст

- Текущий `TechMapWorkbench.tsx` (155 строк) — базовая заглушка: плоский список `Operation[]` без зависимостей, нет Evidence UI, нет ChangeOrder UI.
- DAG операций реализован в backend (TM-2): `MapOperation.dependencies: Json` (массив `{operationId, dependencyType, lagDays}`). Нужна визуализация.
- Evidence модель реализована (TM-3): `EvidenceService.attachEvidence`, тип файла, geoPoint, checksum.
- ChangeOrder workflow реализован (TM-3): `DRAFT → PENDING_APPROVAL → APPROVED/REJECTED`.
- FSM-состояния техкарты (`DRAFT / ACTIVE / FROZEN / ARCHIVED`) уже обрабатываются в `TechMapWorkbench` через `ui-policy.ts`.
- Компонент — часть `apps/web/`, Next.js, TypeScript, Vanilla CSS (нет Tailwind — только clsx + существующие CSS-классы).

Опорные документы:
- `apps/web/components/consulting/TechMapWorkbench.tsx` — текущая версия
- `apps/api/src/modules/tech-map/` — backend-домен (DAG, Evidence, ChangeOrder)
- `docs/02_DOMAINS/AGRO_DOMAIN/CORE/techmap-services-api.tm4-tm5.md` — API сервисов
- `lib/consulting/ui-policy.ts` — политика переходов FSM

## Ограничения (жёстко)

- **Security**: никакого `companyId` из props/URL — только из `AuthorityContext` (уже передаётся как `authority`). 
- **Нет прямых Prisma-вызовов** во фронтенде — только через API-эндпоинты (`/api/tech-map/*`).
- **Не переписывать** FSM-логику (`ui-policy.ts`, `getEntityTransitions`) — только использовать.
- **Не добавлять** новые npm-зависимости для визуализации графа (никакого d3, reactflow и т.п.) — только HTML/CSS/SVG или Canvas.
- **Стиль**: придерживаться существующей дизайн-системы (clsx, bg-white/bg-gray-50, rounded-2xl, text-xs/text-sm — как в текущем компоненте).
- **Нет миграций БД** в scope этого промта.
- **Server components / RSC**: `TechMapWorkbench` остаётся `'use client'` компонентом.

## Задачи (что сделать)

### 1. Обновить типы интерфейса
- [ ] Расширить `Operation` интерфейс: добавить `dependencies?: Array<{operationId: string; dependencyType: 'FS'|'SS'|'FF'; lagDays: number}>`, `operationType?: string`, `bbchWindowStart?: number`, `bbchWindowEnd?: number`, `isCritical?: boolean`
- [ ] Добавить интерфейс `ChangeOrderSummary`: `{id: string; status: 'DRAFT'|'PENDING_APPROVAL'|'APPROVED'|'REJECTED'; reason: string; deltaCoastRub?: number; createdAt: string}`
- [ ] Добавить интерфейс `EvidenceSummary`: `{id: string; evidenceType: string; fileUrl?: string; capturedAt: string}`
- [ ] Обновить `TechMapWorkbenchProps.techMap` — добавить `changeOrders?: ChangeOrderSummary[]`, `areaHa?: number`, `cropZoneId?: string`

### 2. DAG-визуализация операций
- [ ] Компонент `OperationDagView` (в том же файле или отдельный `OperationDagView.tsx`):
  - Отображает операции в хронологическом порядке (по `bbchWindowStart` или серийно)
  - Критический путь (`isCritical: true`) — выделен цветом (красная/янтарная рамка)
  - Зависимости между операциями — стрелки (SVG lines или CSS-псевдоэлементы)
  - При `isFrozen` — режим read-only (pointer-events: none)
- [ ] Переключатель вида: «Список» / «График» (простой toggle-кнопка)

### 3. Evidence Upload UI
- [ ] Компонент `EvidencePanel` (отдельный файл `EvidencePanel.tsx`):
  - Для каждой операции — кнопка «Прикрепить доказательство» (только если `!isFrozen && operation.evidenceRequired`)
  - `<input type="file">` — hidden, активируется кнопкой
  - Upload через `POST /api/tech-map/evidence` — fetch с `FormData`
  - Показывает список приложенных `EvidenceSummary` (тип + дата)
  - При ошибке — inline-сообщение (нет модалок)
- [ ] `evidenceRequired` операции — визуально помечены иконкой 📎 или значком `!`

### 4. ChangeOrder Panel
- [ ] Компонент `ChangeOrderPanel` (отдельный файл `ChangeOrderPanel.tsx`):
  - Список `changeOrders` с цветовым статусом: DRAFT=серый, PENDING=жёлтый, APPROVED=зелёный, REJECTED=красный
  - Кнопка «Создать запрос на изменение» → simple form: `reason: string`, `changeType: select` (SHIFT_DATE / CHANGE_INPUT / CHANGE_RATE / CANCEL_OP / ADD_OP)
  - Submit через `POST /api/tech-map/change-order`
  - Блокируется при `isFrozen`

### 5. Обновить основной Workbench
- [ ] Интегрировать `OperationDagView`, `EvidencePanel`, `ChangeOrderPanel` в `TechMapWorkbench`
- [ ] Header: добавить `areaHa` и `cropZoneId` в информационную строку
- [ ] Lazy-render панелей (через `useState` accordion — не грузить всё сразу)

### 6. Тесты
- [ ] `TechMapWorkbench.spec.tsx` — ≥ 4 unit-теста (RTL):
  - render без props (graceful empty)
  - FROZEN режим: все кнопки disabled
  - критическая операция — отображается с нужным классом
  - ChangeOrder panel — не рендерится при isFrozen

## Definition of Done (DoD)

- [ ] `pnpm --filter web exec tsc --noEmit` — PASS (нет TypeScript ошибок)
- [ ] `pnpm --filter web test --testPathPattern="TechMapWorkbench"` — ≥ 4 тестов PASS
- [ ] Компонент рендерится без ошибок при `operations: []` (пустые данные)
- [ ] Компонент рендерится без ошибок при `operations` с зависимостями
- [ ] FROZEN-режим: все интерактивные элементы заблокированы (pointer-events: none или disabled)
- [ ] Нет прямых Prisma/DB вызовов — только fetch к API
- [ ] Нет новых npm-зависимостей в `package.json`
- [ ] Evidence-upload UI видим при `evidenceRequired: true`
- [ ] ChangeOrder list разворачивается при наличии `changeOrders`

## Тест-план (минимум)

- [ ] `pnpm --filter web exec tsc --noEmit`
- [ ] `pnpm --filter web test --testPathPattern="TechMapWorkbench"` — unit RTL-тесты
- [ ] Ручной smoke (dev-server): открыть страницу с `TechMapWorkbench`, передать mock-данные с зависимостями → проверить рендер DAG
- [ ] Ручная проверка FROZEN-режима: все элементы неинтерактивны
- [ ] Ручная проверка: пустые `operations: []` → нет JS-ошибок в консоли

## Что вернуть на ревью

- `apps/web/components/consulting/TechMapWorkbench.tsx` — обновлённый
- `apps/web/components/consulting/OperationDagView.tsx` — новый
- `apps/web/components/consulting/EvidencePanel.tsx` — новый
- `apps/web/components/consulting/ChangeOrderPanel.tsx` — новый
- `apps/web/components/consulting/TechMapWorkbench.spec.tsx` — тесты
- `tsc --noEmit` output
- Скриншот/запись рендера с mock-данными (если возможно)
