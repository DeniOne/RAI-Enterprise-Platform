---
id: DOC-ARV-FRONTEND-AUDIT-2026-03-16-E2E-BREAKPOINT-M-18KL
layer: Archive
type: Research
status: archived
version: 0.1.0
---
# Карта разрывов E2E-цепочек

Дата: 16.03.2026

| № | Пользовательское действие | Ожидаемая цепочка | Фактический breakpoint | Persistence-статус | Доказательства |
| --- | --- | --- | --- | --- | --- |
| 1 | Логин основного пользователя | `login` → продуктовый shell → рабочие домены | После успеха идёт редирект в legacy `/dashboard` | Неясно для пользователя, но точка входа дефектна | `apps/web/components/auth/LoginForm.tsx:51` |
| 2 | Вход через `telegram-login` | `telegram auth` → shell с живыми потоками | После успеха идёт редирект в тот же legacy `/dashboard` | Неясно | `apps/web/app/(app)/telegram-login/page.tsx:64` |
| 3 | Создать задачу из legacy dashboard | форма → загрузка полей → `POST /tasks` → запись задачи | Поля грузятся через `GET /fields`, запись уходит в `POST /tasks`; backend таких контрактов не даёт | Не сохраняется | `apps/web/app/dashboard/tasks/create/page.tsx:40`, `apps/web/app/dashboard/tasks/create/page.tsx:51`, `apps/api/src/modules/task/task.controller.ts:49` |
| 4 | Открыть consulting dashboard | роут → реальные метрики → drill-down | Экран вообще не читает backend и рисует демо-метрики | Не применимо | `apps/web/app/consulting/dashboard/page.tsx:40`, `apps/web/app/consulting/dashboard/page.tsx:135` |
| 5 | Открыть consulting advisory | роут → `GET /consulting/advisory/:seasonId` → расчёт advisory | UI сидит на `MOCK_ADVISORY`, backend обойдён | Не сохраняется | `apps/web/app/consulting/advisory/page.tsx:8`, `apps/api/src/modules/consulting/consulting.controller.ts:111` |
| 6 | Открыть budgets screen | роут → список бюджетов → detail/update | UI на `MOCK_BUDGETS`, list-endpoint отсутствует | Не сохраняется | `apps/web/app/consulting/budgets/page.tsx:10`, `apps/api/src/modules/consulting/consulting.controller.ts:259` |
| 7 | Открыть deviations detected | роут → `GET /consulting/deviations` → живой список | UI использует локальный массив | Не сохраняется | `apps/web/app/consulting/deviations/detected/page.tsx:18` |
| 8 | Открыть deviations decisions | роут → реальные decisions/history/explainability | UI использует локальные `MOCK_DECISIONS` и mock explainability | Не сохраняется | `apps/web/app/consulting/deviations/decisions/page.tsx` |
| 9 | Открыть strategic legal | роут → `GET /legal/dashboard` / `GET /legal/requirements/:domain` | Страница сама возвращает локальный массив | Не применимо | `apps/web/app/(strategic)/legal/page.tsx:7`, `apps/api/src/modules/legal/controllers/legal.controller.ts:20` |
| 10 | Открыть strategic R&D | роут → `GET /rd/experiments` → список экспериментов | На backend нет `GET`-метода для `rd/experiments` | Неясно, требуется runtime-проверка, но контракт выглядит битым | `apps/web/lib/api/strategic.ts:61`, `apps/api/src/modules/rd/controllers/ExperimentController.ts:20` |
| 11 | Открыть front-office overview при падении backend | запрос overview/queues/threads/handoffs → UI ошибки | Ошибка подменяется пустыми значениями и нулями | Чтение ломается, UI это скрывает | `apps/web/app/(app)/front-office/page.tsx:16`, `apps/web/app/(app)/front-office/page.tsx:20` |
| 12 | Открыть список forecast scenarios при падении backend | `GET /ofs/strategy/forecasts/scenarios` → truthful error-state | UI подсовывает `localStorage` shadow-cache | Чтение искажено локальной тенью | `apps/web/app/(app)/strategy/forecasts/page.tsx` |
| 13 | Выполнить party lookup по BY/KZ | UI lookup → backend provider → результат | Backend возвращает `STUB` / `NOT_SUPPORTED` | Не сохраняется; функциональность фактически не подключена | `apps/api/src/modules/commerce/services/providers/by-kz-stub.provider.ts:17`, `apps/api/src/modules/commerce/services/providers/by-kz-stub.provider.ts:18` |
| 14 | Провести счёт / подтвердить оплату | write → backend → UI invalidation | UI делает `window.location.reload()` | Сохранение, вероятно, есть, но отладка и UX грубые | `apps/web/app/(app)/commerce/invoices/page.tsx:153`, `apps/web/app/(app)/commerce/payments/page.tsx:159` |
