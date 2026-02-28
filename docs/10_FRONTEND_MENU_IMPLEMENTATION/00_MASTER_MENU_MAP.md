# MASTER MENU MAP (Факт -> План реализации)

## Легенда статусов

- `READY` — страница и базовый функционал есть.
- `PARTIAL` — страница есть, но функционал неполный/заглушка.
- `MISSING` — пункта в роутинге нет.

## 1. Управление Урожаем (`/consulting/*`)

| Пункт меню | Путь | Статус | Комментарий |
|---|---|---|---|
| Обзор | `/consulting/dashboard` | READY | Страница реализована |
| CRM (группа) | `/consulting/crm/*` | READY | Группа разделов crm/farms/counterparties/fields |
| Реестр хозяйств | `/assets/farms` | READY | Физический роут в `(app)/assets/farms`. Редирект или прямой линк из навигации. |
| Контрагенты | `/parties` | READY | Физический роут в `(app)/parties`. Полный цикл управления. |
| Поля | `/assets/fields` | READY | Физический роут в `(app)/assets/fields`. |
| Объекты | `/assets/objects` | READY | Физический роут в `(app)/assets/objects`. |
| Планы Урожая | `/consulting/plans` | READY | Хаб и подроуты `/drafts`, `/active`, `/archive` готовы. |
| Техкарты | `/consulting/techmaps` | READY | Хаб и подроуты `/design`, `/active`, `/frozen`, `/archive` готовы. |
| Исполнение | `/consulting/execution` | READY | Хаб и контуры `/agronomist`, `/manager` готовы. |
| Отклонения | `/consulting/deviations` | READY | Хаб и подроуты `/detected`, `/analysis`, `/decisions` готовы. |
| Результат и эффект | `/consulting/results` | READY | Хаб и подроуты `/actual`, `/plan-fact`, `/performance` готовы. |
| Advisory | `/consulting/advisory` | READY | Страница реализована. |
| Бюджеты | `/consulting/budgets` | READY | Страница реализована. |
| Урожай | `/consulting/yield` | READY | Страница реализована. |

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
| Стратегия (главная) | `/strategy` | MISSING | Папка `(app)/strategy` есть, но `page.tsx` отсутствует. |
| Стратегический обзор | `/strategy/overview` | READY | Физический роут создан. |
| Портфель | `/strategy/portfolio` | READY | Физический роут создан. |
| Карта рисков | `/strategy/risks` | READY | Физический роут создан. |
| Сценарии | `/strategy/scenarios` | READY | Физический роут создан. |
| Журнал решений | `/strategy/log` | READY | Физический роут создан. |

## 3. Экономика (`/economy/*`)

| Пункт меню | Путь | Статус | Комментарий |
|---|---|---|---|
| Экономика (главная) | `/economy` | READY | `page.tsx` и `layout.tsx` на месте. |
| crop/aggregation/unit/safety/forecast | `/economy/*` | READY | Все подроуты физически созданы. |

## 4. Финансы (`/finance/*`)

| Пункт меню | Путь | Статус | Комментарий |
|---|---|---|---|
| Финансы (главная) | `/finance` | READY | `page.tsx` и `layout.tsx` на месте. |
| cashflow/performance/invoices/reporting | `/finance/*` | READY | Все подроуты физически созданы. |

## 5. GR (`/gr/*`)

| Пункт меню | Путь | Статус | Комментарий |
|---|---|---|---|
| GR (главная) | `/gr` | READY | `page.tsx` и `layout.tsx` на месте. |
| regulatory/limits/contracts/compliance/decisions | `/gr/*` | READY | Все подроуты физически созданы. |

## 6. Производство (`/production/*`)

| Пункт меню | Путь | Статус | Комментарий |
|---|---|---|---|
| Производство (главная) | `/production` | READY | `page.tsx` и `layout.tsx` на месте. |
| procurement/storage/manufacturing/quality/logistics/analytics | `/production/*` | READY | Все подроуты физически созданы. |

## 7. Знания (`/knowledge/*`)

| Пункт меню | Путь | Статус | Комментарий |
|---|---|---|---|
| Знания (главная) | `/knowledge` | READY | `page.tsx` на месте. |
| base/cases/patterns/evolution | `/knowledge/*` | READY | Все подроуты физически созданы. |

## 8. Настройки (`/settings/*`)

| Пункт меню | Путь | Статус | Комментарий |
|---|---|---|---|
| Настройки (главная) | `/settings` | MISSING | Раздел в меню есть, роутинга нет |
| users/access/audit/integrations/params | `/settings/*` | MISSING | Нет страниц |

## 9. Исследования (`/exploration/*`)

| Пункт меню | Путь | Статус | Комментарий |
|---|---|---|---|
| Исследования (главная) | `/exploration` | READY | `page.tsx` и `layout.tsx` на месте. |
| Стратегические исследования | `/exploration/strategic` | READY | Физический роут создан. |
| Растворение ограничений | `/exploration/constraints` | READY | Физический роут создан. |
| Исследовательские кейсы | `/exploration/cases/:id` | READY | Подроут для деталей кейсов. |
| War Room Sessions | `/exploration/war-room/:id` | READY | Подроут для сессий. |


## Приоритет реализации (рекомендуемый)

1. `Управление Урожаем` — закрыть CRM + результаты (критичный business flow).
2. `Финансы` + `Экономика` — подключить реальные API-панели вместо заглушек.
3. `Стратегия` — витрина управленческих решений и риск-портфеля.
4. `GR` + `Производство` + `Знания` + `Настройки` — поэтапно.

