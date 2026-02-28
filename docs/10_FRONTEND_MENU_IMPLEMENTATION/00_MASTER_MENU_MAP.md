# MASTER MENU MAP (Факт -> План реализации)

## Легенда статусов

- `READY` — страница и базовый функционал есть.
- `PARTIAL` — страница есть, но функционал неполный/заглушка.
- `MISSING` — пункта в роутинге нет.

## 1. Управление Урожаем (`/consulting/*`)

| Пункт меню | Путь | Статус | Комментарий |
|---|---|---|---|
| Обзор | `/consulting/dashboard` | READY | Страница есть |
| CRM (группа) | `/consulting/crm/*` | READY | Добавлены сценарии error/permission и smart routing (entity/severity) для crm/farms/counterparties |
| Реестр хозяйств | `/consulting/crm/farms` | READY | KPI по severity, поиск по хозяйствам, smart routing `entity|severity`, переход в карточку хозяйства `/consulting/crm/farms/:farmId` |
| Контрагенты | `/consulting/crm/counterparties` | READY | Полный контур управления (см. [Master Doc](file:///root/RAI_EP/docs/10_FRONTEND_MENU_IMPLEMENTATION/11_BUTTON_Контрагенты_Master.md)): холдинги/юрлица, фильтры, карточка с CRUD, SLA и валидация |
| Планы Урожая | `/consulting/plans` | READY | Базовая страница есть |
| Планы: черновики/активные/архив | `/consulting/plans/*` | READY | Подроуты созданы |
| Техкарты | `/consulting/techmaps` | READY | Базовая страница есть |
| Техкарты: design/active/frozen/archive | `/consulting/techmaps/*` | READY | Подроуты созданы |
| Исполнение (хаб) | `/consulting/execution` | READY | Есть |
| Исполнение: агроном | `/consulting/execution/agronomist` | READY | Есть |
| Исполнение: менеджер | `/consulting/execution/manager` | READY | Есть |
| Отклонения (хаб) | `/consulting/deviations` | READY | Есть |
| Отклонения: detected/analysis/decisions | `/consulting/deviations/*` | READY | Есть |
| Результат и эффект (группа) | `/consulting/results/*` | READY | Создан хаб и ключевые подроуты |
| Advisory | `/consulting/advisory` | READY | Есть |
| Бюджеты | `/consulting/budgets` | READY | Есть |
| Урожай | `/consulting/yield` | READY | Есть |

## 1.5 Коммерция (`/commerce/*`)

| Пункт меню | Путь | Статус | Комментарий |
|---|---|---|---|
| Коммерция (корень) | `/commerce` | READY | Добавлен раздел в sidebar, root редиректит на `/commerce/contracts` |
| Договоры | `/commerce/contracts` | READY | Подключен `GET /commerce/contracts`, есть loading/empty/error, `entity/severity`, `data-focus` |
| Исполнение договоров | `/commerce/fulfillment` | READY | Подключен `GET /commerce/fulfillment`, есть loading/empty/error, `entity/severity`, `data-focus` |
| Документы | `/commerce/invoices` | READY | Подключен `GET /commerce/invoices`, есть loading/empty/error, `entity/severity`, `data-focus` |
| Оплаты | `/commerce/payments` | READY | Подключен `GET /commerce/payments`, есть loading/empty/error, `entity/severity`, `data-focus` |

## 2. Стратегия (`/strategy/*`)

| Пункт меню | Путь | Статус | Комментарий |
|---|---|---|---|
| Стратегия (главная) | `/strategy` | READY | Есть |
| Стратегический обзор | `/strategy/overview` | MISSING | Не создано |
| Портфель | `/strategy/portfolio` | MISSING | Не создано |
| Карта рисков | `/strategy/risks` | MISSING | Не создано |
| Сценарии | `/strategy/scenarios` | MISSING | Не создано |
| Журнал решений | `/strategy/log` | MISSING | Не создано |

## 3. Экономика (`/economy/*`)

| Пункт меню | Путь | Статус | Комментарий |
|---|---|---|---|
| Экономика (главная) | `/economy` | PARTIAL | Страница-заглушка есть |
| crop/aggregation/unit/safety/forecast | `/economy/*` | MISSING | Подроутов нет |

## 4. Финансы (`/finance/*`)

| Пункт меню | Путь | Статус | Комментарий |
|---|---|---|---|
| Финансы (главная) | `/finance` | PARTIAL | Страница-заглушка |
| cashflow/performance/invoices/reporting | `/finance/*` | MISSING | Подроутов нет |

## 5. GR (`/gr/*`)

| Пункт меню | Путь | Статус | Комментарий |
|---|---|---|---|
| GR (главная) | `/gr` | PARTIAL | Заглушка |
| regulatory/limits/contracts/compliance/decisions | `/gr/*` | MISSING | Подроутов нет |

## 6. Производство (`/production/*`)

| Пункт меню | Путь | Статус | Комментарий |
|---|---|---|---|
| Производство (главная) | `/production` | PARTIAL | Заглушка |
| procurement/storage/manufacturing/quality/logistics/analytics | `/production/*` | MISSING | Подроутов нет |

## 7. Знания (`/knowledge/*`)

| Пункт меню | Путь | Статус | Комментарий |
|---|---|---|---|
| Знания (главная) | `/knowledge` | PARTIAL | Есть, но неполный функционал |
| base/cases/patterns/evolution | `/knowledge/*` | MISSING | Подроутов нет |

## 8. Настройки (`/settings/*`)

| Пункт меню | Путь | Статус | Комментарий |
|---|---|---|---|
| Настройки (главная) | `/settings` | MISSING | Раздел в меню есть, роутинга нет |
| users/access/audit/integrations/params | `/settings/*` | MISSING | Нет страниц |

## 9. Исследования (`/exploration/*`)

| Пункт меню | Путь | Статус | Комментарий |
|---|---|---|---|
| Исследования (главная) | `/exploration` | IN_PROGRESS | Готов UI scaffold: route/layout/showcase + triage form + detail pages `/exploration/cases/:id` и `/exploration/war-room/:sessionId`; backend дополнен API-метриками и унифицированными Swagger-описаниями |
| Стратегические исследования | `/exploration/strategic` | IN_PROGRESS | Route и фильтрация SEU готовы; требуется board-гейты и e2e-покрытие |
| Растворение ограничений | `/exploration/constraints` | IN_PROGRESS | Route и фильтрация CDU готовы; требуется timebox/SLA контроль и e2e-покрытие |


## Приоритет реализации (рекомендуемый)

1. `Управление Урожаем` — закрыть CRM + результаты (критичный business flow).
2. `Финансы` + `Экономика` — подключить реальные API-панели вместо заглушек.
3. `Стратегия` — витрина управленческих решений и риск-портфеля.
4. `GR` + `Производство` + `Знания` + `Настройки` — поэтапно.

