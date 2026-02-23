# MASTER MENU MAP (Факт -> План реализации)

## Легенда статусов

- `READY` — страница и базовый функционал есть.
- `PARTIAL` — страница есть, но функционал неполный/заглушка.
- `MISSING` — пункта в роутинге нет.

## 1. Управление Урожаем (`/consulting/*`)

| Пункт меню | Путь | Статус | Комментарий |
|---|---|---|---|
| Обзор | `/consulting/dashboard` | READY | Страница есть |
| CRM (группа) | `/consulting/crm/*` | READY | Созданы базовые страницы раздела |
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

## Приоритет реализации (рекомендуемый)

1. `Управление Урожаем` — закрыть CRM + результаты (критичный business flow).
2. `Финансы` + `Экономика` — подключить реальные API-панели вместо заглушек.
3. `Стратегия` — витрина управленческих решений и риск-портфеля.
4. `GR` + `Производство` + `Знания` + `Настройки` — поэтапно.


