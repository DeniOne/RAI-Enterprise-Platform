---
id: DOC-ARV-FRONTEND-AUDIT-2026-03-16-FRONTEND-FORENSI-1TST
layer: Archive
type: Research
status: archived
version: 0.1.0
---
# Форензик-аудит фронтенда RAI Enterprise Platform

Дата аудита: 16.03.2026

Область аудита:

- `apps/web`
- `apps/api`
- `packages/prisma-client/schema.prisma`

## Краткий вердикт

- Фронтенд не является единым правдивым продуктом. Внутри `apps/web` одновременно живут четыре разных слоя: реально работающие контуры, частично рабочие контуры, декоративные экраны на локальных данных и legacy-маршруты с мёртвыми контрактами.
- В репозитории найдено `143` route-файла `page.tsx`. Из них минимум `41` route-файл явно отрисовывают заглушки с текстом `Content Placeholder // Phase Beta`, минимум `7` экранов держатся на локальных `MOCK_*`, найдено `24` жёстких вхождения `http://localhost:4000/api`, `43` silent catch, `20` вызовов `alert(...)`, `8` вызовов `window.location.reload()`.
- Реально рабочие контуры на уровне кода и контрактов: `party-assets`, основная `commerce`, большая часть `front-office`, часть `control-tower`, `strategy/forecasts`.
- Частично рабочие контуры: `consulting/plans`, `consulting/techmaps`, `consulting/yield`, `consulting/execution`, `front-office/context`, `portal/front-office`, `telegram`-связанные входы.
- Ложно-реалистичные или пустые контуры: `consulting/dashboard`, `consulting/advisory`, `consulting/budgets`, `consulting/deviations/detected`, `consulting/deviations/decisions`, `/(strategic)/legal`, большинство зон `economy`, `finance`, `gr`, `hr`, `knowledge`, `production`, `settings`, `strategy`.
- Самая опасная точка искажения продукта: успешный вход до сих пор ведёт в legacy-маршрут `/dashboard` через `apps/web/components/auth/LoginForm.tsx:51` и `apps/web/app/(app)/telegram-login/page.tsx:64`, а внутри этого маршрута создание задачи идёт в несуществующие контракты `/tasks` и `/fields` через `apps/web/lib/api.ts:45`, `apps/web/lib/api.ts:46`, `apps/web/lib/api.ts:49`.

## Методика

- Выполнен статический проход по пользовательским маршрутам `apps/web/app`.
- Для каждого ключевого экрана проверены:
  - источник данных;
  - наличие реального вызова в `apps/web/lib`;
  - наличие серверного контроллера в `apps/api`;
  - наличие вероятной записи в Prisma-модель в `packages/prisma-client/schema.prisma`.
- Отдельно проверены признаки искажения реальности:
  - локальные `MOCK_*`;
  - явные заглушки;
  - жёстко пришитый `localhost`;
  - `alert(...)` вместо нормальной обработки ошибок;
  - silent catch с подменой ошибки пустыми данными;
  - `window.location.reload()` вместо управляемого обновления состояния;
  - fallback в `localStorage`, который может маскировать сбой backend.

## Карта реальности по контурам

| Контур | Реальность сегодня | Доказательства |
| --- | --- | --- |
| `party-assets` (`/parties`, `/assets/farms`, `/assets/fields`) | Работает на реальных API и Prisma-моделях | `apps/web/lib/party-assets-api.ts`, `apps/api/src/modules/commerce/party-assets.controller.ts:111`, `apps/api/src/modules/commerce/services/party.service.ts`, `packages/prisma-client/schema.prisma:5492` |
| `commerce` (`contracts`, `fulfillment`, `invoices`, `payments`) | Работает, но UX и наблюдаемость слабые | `apps/web/app/(app)/commerce/contracts/page.tsx`, `apps/api/src/modules/commerce/commerce.controller.ts`, `apps/api/src/modules/commerce/services/commerce-contract.service.ts`, `apps/api/src/modules/commerce/services/fulfillment.service.ts`, `packages/prisma-client/schema.prisma:5540`, `packages/prisma-client/schema.prisma:5725`, `packages/prisma-client/schema.prisma:5755` |
| `front-office` внутренний | В основном рабочий, но при ошибках часто маскируется под пустое состояние | `apps/web/lib/api/front-office-server.ts:32`, `apps/web/lib/api/front-office-server.ts:39`, `apps/web/app/(app)/front-office/page.tsx:16`, `apps/web/app/(app)/front-office/page.tsx:20`, `packages/prisma-client/schema.prisma:5885`, `packages/prisma-client/schema.prisma:5936`, `packages/prisma-client/schema.prisma:6026` |
| `front-office` внешний портал | Частично рабочий, требует runtime-проверки по auth и reply/read-цепочке | `apps/web/app/(app)/portal/front-office/page.tsx`, `apps/web/app/(app)/portal/front-office/threads/[threadKey]/page.tsx`, `apps/api/src/modules/front-office/front-office-external.controller.ts` |
| `control-tower` | Похоже на реальный контур с живыми контрактами, но нужны runtime-прогоны по внешним зависимостям | `apps/web/app/(app)/control-tower/page.tsx`, `apps/web/app/(app)/control-tower/agents/page.tsx`, `apps/api/src/modules/explainability/explainability-panel.controller.ts`, `apps/api/src/modules/explainability/agents-config.controller.ts` |
| `strategy/forecasts` | Работает, но читательская правда искажается fallback в `localStorage` | `apps/web/app/(app)/strategy/forecasts/page.tsx`, `apps/api/src/modules/finance-economy/ofs/application/strategy-forecasts.controller.ts`, `apps/api/src/modules/finance-economy/ofs/application/decision-evaluation.service.ts` |
| `consulting/plans` | Частично рабочий: реальный backend есть, фронт грубый и местами обманчивый | `apps/web/app/consulting/plans/page.tsx`, `apps/web/app/consulting/plans/[id]/page.tsx`, `apps/api/src/modules/consulting/consulting.controller.ts:209`, `apps/api/src/modules/consulting/consulting.service.ts`, `packages/prisma-client/schema.prisma:2239` |
| `consulting/techmaps` | Частично рабочий: генерация и переходы wired, но UX на `alert`/ручном рефреше | `apps/web/app/consulting/techmaps/page.tsx:62`, `apps/web/app/consulting/techmaps/[id]/page.tsx:101`, `apps/api/src/modules/tech-map/tech-map.controller.ts`, `apps/api/src/modules/tech-map/tech-map.service.ts` |
| `consulting/yield` | Работает на реальном сохранении | `apps/web/app/consulting/yield/page.tsx`, `apps/api/src/modules/consulting/consulting.controller.ts:298`, `apps/api/src/modules/consulting/yield.orchestrator.ts`, `apps/api/src/modules/consulting/yield.service.ts`, `packages/prisma-client/schema.prisma:4469` |
| `consulting/execution` | Частично рабочий: backend реальный, сам экран содержит остатки декоративной логики | `apps/web/app/consulting/execution/page.tsx`, `apps/api/src/modules/consulting/consulting.controller.ts:276`, `apps/api/src/modules/consulting/execution.service.ts` |
| `consulting/dashboard` | Декоративный, не привязан к backend | `apps/web/app/consulting/dashboard/page.tsx:40`, `apps/web/app/consulting/dashboard/page.tsx:54`, `apps/web/app/consulting/dashboard/page.tsx:135` |
| `consulting/advisory` | Фейковый экран на `MOCK_ADVISORY`, при том что backend-эндпоинт существует | `apps/web/app/consulting/advisory/page.tsx:8`, `apps/web/app/consulting/advisory/page.tsx:18`, `apps/api/src/modules/consulting/consulting.controller.ts:111` |
| `consulting/budgets` | Фейковый экран на `MOCK_BUDGETS`; реального списка бюджетов на backend нет | `apps/web/app/consulting/budgets/page.tsx:10`, `apps/web/app/consulting/budgets/page.tsx:16`, `apps/api/src/modules/consulting/consulting.controller.ts:259`, `apps/api/src/modules/consulting/consulting.controller.ts:270` |
| `consulting/deviations/detected` | Фейковый список отклонений на `MOCK_DEVIATIONS` | `apps/web/app/consulting/deviations/detected/page.tsx:18`, `apps/api/src/modules/consulting/consulting.controller.ts:167` |
| `consulting/deviations/decisions` | Фейковый реестр решений и explainability | `apps/web/app/consulting/deviations/decisions/page.tsx`, `apps/api/src/modules/consulting/consulting.controller.ts:173`, `apps/api/src/modules/consulting/consulting.controller.ts:198` |
| `/(strategic)/legal` | Полностью декоративный, backend legal-контур обходится | `apps/web/app/(strategic)/legal/page.tsx:7`, `apps/api/src/modules/legal/controllers/legal.controller.ts:20`, `apps/api/src/modules/legal/controllers/legal.controller.ts:27` |
| `/(strategic)/rd` | Скорее сломан, чем работает: фронт зовёт `GET /rd/experiments`, а backend даёт только `POST`-методы | `apps/web/lib/api/strategic.ts:61`, `apps/api/src/modules/rd/controllers/ExperimentController.ts:15`, `apps/api/src/modules/rd/controllers/ExperimentController.ts:20` |
| `dashboard` legacy | Сломан и при этом остаётся точкой входа после логина | `apps/web/components/auth/LoginForm.tsx:51`, `apps/web/app/(app)/telegram-login/page.tsx:64`, `apps/web/app/dashboard/tasks/create/page.tsx:40`, `apps/web/app/dashboard/tasks/create/page.tsx:51` |
| `economy`, `finance`, `gr`, `hr`, `knowledge`, `production`, `settings`, `strategy` | Массовые route-shell с явными заглушками | `apps/web/app/(app)/finance/invoices/page.tsx:9`, `apps/web/app/(app)/strategy/scenarios/page.tsx:9` и ещё 39 route-файлов с `Content Placeholder // Phase Beta` |

## Паттерны ложной реализованности

### 1. Полированные экраны на локальных данных

- `apps/web/app/consulting/advisory/page.tsx:8` и `apps/web/app/consulting/advisory/page.tsx:18` держат страницу на `MOCK_ADVISORY`, но визуально это полноценная аналитика.
- `apps/web/app/consulting/budgets/page.tsx:10` и `apps/web/app/consulting/budgets/page.tsx:16` делают то же самое для бюджетов.
- `apps/web/app/consulting/deviations/detected/page.tsx:18` и `apps/web/app/consulting/deviations/decisions/page.tsx` показывают отклонения и решения без реального backend-чтения.
- `apps/web/app/consulting/dashboard/page.tsx:54` прямо обещает «оперативную сводку ... в реальном времени», но страница собрана из жёстко прошитых метрик, `tick`-анимации и демонстрационных процентов.

### 2. Заглушки в пользовательских доменах

- Найдено `41` route-файл с явным текстом `Content Placeholder // Phase Beta`.
- Это не скрытая разработческая зона, а пользовательские домены верхнего уровня: `economy`, `finance`, `gr`, `hr`, `knowledge`, `production`, `settings`, `strategy`, `ofs`.
- Для пользователя такой маршрут выглядит как «раздел продукта существует», хотя по сути это пустой контейнер.

### 3. Пустое состояние вместо ошибки

- `apps/web/app/(app)/front-office/page.tsx:16`-`20` глотает ошибки и превращает сбой backend в нулевые счётчики и пустые списки.
- `apps/web/app/(app)/front-office/context/page.tsx` и `apps/web/app/(app)/front-office/deviations/page.tsx` делают то же самое через `.catch(() => [])`.
- В сумме по `apps/web` найдено `43` silent catch. Это системный паттерн, а не локальная ошибка.

### 4. Локальная тень поверх backend-правды

- `apps/web/app/(app)/strategy/forecasts/page.tsx` хранит сценарии ещё и в `localStorage` и при сбое загрузки backend подсовывает пользователю локальную тень.
- Это опасный UX-обман: пользователь видит сценарии и не понимает, что чтение с сервера уже сломано.

### 5. Средозависимость на `localhost`

- В `apps/web` найдено `24` вхождения `http://localhost:4000/api`.
- Критические места: `apps/web/lib/api/front-office-server.ts:4`, `apps/web/lib/api/auth-server.ts:8`, `apps/web/lib/api/strategic.ts:3`, `apps/web/app/dashboard/page.tsx:13`, `apps/web/app/api/auth/login/route.ts:9`.
- Это ломает переносимость, делает поведение зависимым от локальной среды и резко повышает стоимость ручного QA.

## Анализ поломанных E2E-цепочек

| Цепочка | Где выглядит рабочей | Реальная точка отказа | Итог |
| --- | --- | --- | --- |
| Вход → `/dashboard` → создание задачи | После логина пользователь уходит на `dashboard` | `apps/web/lib/api.ts:45`-`49` используют `/tasks` и `/fields`, а backend даёт `/tasks/my` и `/registry/fields` (`apps/api/src/modules/task/task.controller.ts:49`, `apps/api/src/modules/task/task.controller.ts:105`) | Создание задачи в legacy-зоне выглядит реализованным, но цепочка невалидна |
| Открытие `consulting/dashboard` | Верхняя навигация ведёт на `apps/web/components/navigation/TopNav.tsx:235` | Экран вообще не читает backend, а рисует демо-метрики (`apps/web/app/consulting/dashboard/page.tsx:40`, `apps/web/app/consulting/dashboard/page.tsx:135`) | Полностью ложный центр управления |
| Открытие `consulting/advisory` | Визуально это риск-центр с приоритетами | Страница сидит на `MOCK_ADVISORY`, backend обойдён | Аналитика не соответствует продуктовой правде |
| Открытие `consulting/budgets` | UI обещает бюджетный контур | На backend нет списка бюджетов; есть только создание бюджета из плана и transitions/sync | Экран не может стать правдивым без отдельного backend-чтения |
| Открытие `consulting/deviations/*` | Пользователь видит реестры отклонений и решений | На фронте `MOCK_DEVIATIONS` и `MOCK_DECISIONS`, backend-контур обходится | Важный контур управления риском на деле декоративен |
| Открытие `/(strategic)/legal` | Стратегическая legal-проекция выглядит как агрегированная реальность | `getLegalRequirements` в самой странице возвращает локальный массив, backend legal не вызывается | Продукт сообщает выдуманную нормативную картину |
| Открытие `/(strategic)/rd` | Экран позиционируется как контекст R&D | Фронт зовёт `GET /rd/experiments`, backend контроллер не даёт `GET`-метода | Высокая вероятность runtime-падения |
| Открытие `front-office` при backend-сбое | Домашний экран остаётся «чистым» | `.catch(() => null)` и fallback в нули маскируют сетевой/серверный сбой | QA тратит время на поиск «почему пусто», а не «почему упало» |
| Работа со сценариями в `strategy/forecasts` | Пользователь видит список сценариев даже при проблемах сервера | При неуспешном чтении используется `localStorage` shadow-cache | Данные выглядят сохранёнными и синхронными, хотя backend уже не источник истины |
| Поиск контрагента по BY/KZ | UI предлагает lookup по юрисдикциям | Для BY/KZ backend возвращает `source: "STUB"` и `status: "NOT_SUPPORTED"` | Пользователь видит форму реального автопоиска, но часть юрисдикций фактически не подключена |

## Проверка целостности сохранения данных

| Поток | Статус сохранения | Вероятные сущности/таблицы | Вывод |
| --- | --- | --- | --- |
| Создание/обновление harvest plan | Сохраняется корректно | `HarvestPlan`, `apps/api/src/modules/consulting/consulting.service.ts`, `packages/prisma-client/schema.prisma:2239` | Реальный backend-контур есть |
| Генерация и переходы tech-map | Частично подтверждено, требует runtime-проверки side-effect-цепочки | `tech-map` module, связанные сущности tech map и operations | Код wiring реальный, но статикой нельзя доказать весь побочный эффект |
| Сохранение yield | Сохраняется корректно | `HarvestResult`, `apps/api/src/modules/consulting/yield.service.ts`, `packages/prisma-client/schema.prisma:4469` | Один из немногих чистых E2E-контуров |
| Создание parties/farms/asset roles | Сохраняется корректно | `Party`, `AssetPartyRole`, `Field`, `Account`, `apps/api/src/modules/commerce/services/party.service.ts`, `apps/api/src/modules/commerce/services/asset-role.service.ts` | Реальный контур master-data |
| Contracts/invoices/payments | Сохраняется корректно | `CommerceContract`, `Invoice`, `Payment`, `PaymentAllocation` | Реальный коммерческий контур |
| Front-office drafts/threads/handoffs | Скорее сохраняется корректно, требует runtime-проверки reply/read-потока | `FrontOfficeDraft`, `FrontOfficeThread`, `FrontOfficeThreadMessage`, `FrontOfficeHandoffRecord` | Кодовая база выглядит зрелой |
| Front-office consultations | Сохраняется частично | только `AuditLog`, без отдельной модели консультации | Бизнес-семантика не закодирована как first-class entity |
| Front-office context updates | Сохраняется частично | только `AuditLog`, без отдельной модели context update | История есть, предметной сущности нет |
| Strategy forecast scenarios/history/feedback | Сохраняется корректно, но чтение на фронте может врать | `StrategyForecastRun`, сценарные записи OFS-модуля, `localStorage` shadow-cache на UI | Backend реальный, фронт может скрывать сбой загрузки |
| Legacy dashboard task create | Не сохраняется | мёртвые вызовы `/tasks` и `/fields` | Поломанный write-flow |
| Consulting advisory/budgets/deviations mock-экраны | Не сохраняется | локальный React state | Это не продуктовые потоки, а демо-сцены |

## Отчёт по рассинхрону API-контрактов

| Фронтенд ожидает | Реальность backend | Степень риска | Доказательства |
| --- | --- | --- | --- |
| `GET /tasks` | Есть только `GET /tasks/my`, `GET /tasks/:id` и transitions | Критический | `apps/web/lib/api.ts:45`, `apps/api/src/modules/task/task.controller.ts:49`, `apps/api/src/modules/task/task.controller.ts:105` |
| `POST /tasks` | Backend create-метода нет | Критический | `apps/web/lib/api.ts:46`, `apps/api/src/modules/task/task.controller.ts` |
| `GET /fields` | Реальный endpoint — `GET /registry/fields` | Критический | `apps/web/lib/api.ts:49`, `apps/web/lib/api/front-office-server.ts:32` |
| `GET /rd/experiments` | Контроллер `rd/experiments` даёт только `POST`-операции | Высокий | `apps/web/lib/api/strategic.ts:61`, `apps/api/src/modules/rd/controllers/ExperimentController.ts:20` |
| Legal summary на strategic | Front вообще не зовёт legal backend | Высокий | `apps/web/app/(strategic)/legal/page.tsx:7`, `apps/api/src/modules/legal/controllers/legal.controller.ts:20`, `apps/api/src/modules/legal/controllers/legal.controller.ts:27` |
| Advisory screen consulting | Backend advisory есть, UI его игнорирует | Высокий | `apps/web/app/consulting/advisory/page.tsx:8`, `apps/api/src/modules/consulting/consulting.controller.ts:111` |
| Deviations/decisions consulting | Реальные endpoints существуют, но экраны на моках | Высокий | `apps/web/app/consulting/deviations/detected/page.tsx:18`, `apps/web/app/consulting/deviations/decisions/page.tsx`, `apps/api/src/modules/consulting/consulting.controller.ts:167` |
| Budgets screen | Фронт рисует список, backend list-endpoint не даёт | Высокий | `apps/web/app/consulting/budgets/page.tsx:10`, `apps/api/src/modules/consulting/consulting.controller.ts:259`, `apps/api/src/modules/consulting/consulting.controller.ts:270` |
| `api.assets.fields()` → `/api/assets/fields` | Реальный backend-контракт — `/assets/fields` | Средний | `apps/web/lib/api.ts:364`, `apps/api/src/modules/commerce/party-assets.controller.ts:111` |
| `api.assets.objects()` → `/api/assets/objects` | Реальный backend-контракт — `/assets/objects` | Средний | `apps/web/lib/api.ts:365`, `apps/api/src/modules/commerce/party-assets.controller.ts:117` |

## Кластеры первопричин

### 1. Два продукта в одном фронтенде

- В кодовой базе сосуществуют новый продуктовый каркас и legacy-`dashboard`.
- После логина пользователь всё ещё попадает в legacy-зону.
- Эффект: одна и та же система показывает разную «правду» в зависимости от точки входа.

### 2. Слабая дисциплина контрактов

- Фронт вызывает несуществующие endpoints (`/tasks`, `/fields`, `GET /rd/experiments`).
- Реальные backend-модули часто не используются там, где уже есть.
- Эффект: визуально богатый UI не гарантирует существование цепочки ниже.

### 3. Доставка заглушек в пользовательскую навигацию

- `41` route-файл — явные заглушки.
- Отдельные экраны не просто пустые, а притворяются аналитикой и операционным контуром.
- Эффект: продукт искажает ожидания владельца и QA.

### 4. Слабое проявление ошибок

- `43` silent catch и `20` `alert(...)`.
- Во многих местах ошибка заменяется на пустой список или нулевую статистику.
- Эффект: человек не видит сбой, а видит «данных нет».

### 5. Неправильный владелец состояния

- `strategy/forecasts` хранит читательскую правду в `localStorage` наряду с backend.
- Ряд legacy-страниц живёт на локальных константах.
- Эффект: UI становится вторым источником истины и перестаёт быть доверенным отражением системы.

### 6. Бизнес-семантика зашита в `AuditLog`

- `front-office` консультации и обновления контекста сохраняются как события аудита, а не как first-class сущности.
- Эффект: система умеет помнить факт, но не умеет полноценно работать с предметной сущностью.

### 7. Средозависимость вместо конфигурации

- `24` хардкода `http://localhost:4000/api`.
- Эффект: любой прогон вне локальной среды становится лотереей.

## Приоритетный план ремонта

### P0 — немедленно

1. Убрать редиректы после логина на `/dashboard` и перевести вход в единый актуальный shell.
   - Почему важно: сейчас пользователь попадает в заведомо дефектный контур.
   - Ожидаемый эффект: резкое снижение ложных багов уже на первом экране.
2. Удалить или отключить `api.tasks.list`, `api.tasks.create`, `api.fields.list` legacy-использование.
   - Почему важно: это мёртвые контракты.
   - Ожидаемый эффект: исчезнут заведомо битые write-flow.
3. Снять из пользовательской навигации `consulting/dashboard`, `consulting/advisory`, `consulting/budgets`, `consulting/deviations/*` до реального wiring.
   - Почему важно: сейчас это источник системной дезинформации.
   - Ожидаемый эффект: продукт перестанет обещать несуществующее.
4. Заменить silent catch на явные состояния ошибки в `front-office` и связанных серверах.
   - Почему важно: пустые экраны скрывают реальные сбои.
   - Ожидаемый эффект: QA начнёт видеть причину, а не симптом.
5. Убрать жёсткий `localhost` из server/client API-хелперов.
   - Почему важно: среда ломает продукт сильнее, чем код.
   - Ожидаемый эффект: воспроизводимость между средами.
6. Пометить заглушки явным баннером `Stub / Не реализовано / Нет backend`.
   - Почему важно: placeholder не должен выглядеть как рабочая функция.
   - Ожидаемый эффект: снижение ложных ожиданий владельца и тестировщика.
7. Запретить `alert(...)` и `window.location.reload()` в пользовательских write-flow.
   - Почему важно: это тупиковый UX и плохая диагностика.
   - Ожидаемый эффект: управляемое состояние после записи и понятные ошибки.

### P1 — базовая надёжность

1. Переписать `consulting/advisory` на реальный `GET /consulting/advisory/:seasonId`.
   - Почему важно: backend уже существует, а экран врёт.
   - Ожидаемый эффект: один из ключевых аналитических экранов станет правдивым.
2. Добавить backend list/read для budget-экрана либо убрать экран из продукта.
   - Почему важно: сейчас UI некуда читать бюджеты.
   - Ожидаемый эффект: исчезнет системная дыра между UX и предметной моделью.
3. Переписать `consulting/deviations/*` на реальные endpoints отклонений и решений.
   - Почему важно: риск-менеджмент сейчас декоративный.
   - Ожидаемый эффект: управленческие решения начнут опираться на живые данные.
4. Сделать `front-office` консультации и context updates first-class сущностями, а не только audit-событиями.
   - Почему важно: сейчас предметная семантика размыта.
   - Ожидаемый эффект: появятся корректные фильтры, статусы, ownership и трассировка.
5. Исправить `strategic/rd`: либо добавить `GET /rd/experiments`, либо сменить фронт-контракт.
   - Почему важно: текущий экран вероятно падает.
   - Ожидаемый эффект: устраняется чистый контрактный разрыв.
6. Перестроить `strategy/forecasts` так, чтобы `localStorage` был только локальным черновиком, а не fallback-истиной.
   - Почему важно: сейчас чтение может врать.
   - Ожидаемый эффект: пользователь всегда понимает, что пришло с сервера.
7. Ввести централизованный слой `requestId` + видимый баннер backend-ошибки.
   - Почему важно: сейчас трассировка дорогая.
   - Ожидаемый эффект: ускорение ручной диагностики.

### P2 — структурное оздоровление

1. Удалить legacy-shell `dashboard` после миграции точек входа.
   - Почему важно: параллельные shell-ы множат ложные состояния.
   - Ожидаемый эффект: единый продуктовый путь пользователя.
2. Ввести реестр `Feature Truth` в коде и документации.
   - Почему важно: статус фичи сейчас нигде не закреплён формально.
   - Ожидаемый эффект: прозрачный релизный контур.
3. Генерировать клиентские контракты из backend-описания и ронять сборку при несовпадении.
   - Почему важно: текущие разрывы должны стать невозможными.
   - Ожидаемый эффект: контрактная дисциплина на уровне сборки.
4. Разнести demo/stub-маршруты в отдельный namespace, недоступный основной навигации.
   - Почему важно: сейчас demo и production визуально смешаны.
   - Ожидаемый эффект: честная граница между демонстрацией и продуктом.
5. Завести smoke-набор по критическим write-flow.
   - Почему важно: ручной QA сейчас ловит дефекты слишком поздно.
   - Ожидаемый эффект: раннее обнаружение контрактных и persistence-поломок.

## Самый быстрый путь к дебагабельности

1. На каждый write-flow показывать три статуса: `запрос отправлен`, `backend подтвердил`, `данные перечитаны`.
2. Добавить единый `requestId` в UI, API и audit/outbox.
3. Ввести баннер статуса фичи: `Работает`, `Частично`, `Stub`, `Demo`, `Отключено`.
4. Заменить silent catch на компонент ошибки с кодом endpoint и `requestId`.
5. Запретить `window.location.reload()` в продуктивных сценариях и заменить на управляемую invalidation-логику.
6. Добавить экран `Feature Status Map`, собирающий реальный статус контуров из конфигурации.
7. На все формы сохранения повесить post-write verification checkpoint: перечитать запись по `id` и сравнить ключевые поля.
8. Для `front-office` вывести явный индикатор: данные пришли с backend или экран показывает fallback.
9. Для `strategy/forecasts` отделить `черновик браузера` от `сценария сервера` визуально и в данных.
10. Для всех stub-провайдеров, например BY/KZ lookup, показывать явный статус `Не подключено`, а не оставлять поведение на догадку.

## Финальная таблица правды

| Area | Reality Today | Main Risk | Fix Priority |
| --- | --- | --- | --- |
| `party-assets` | Рабочий контур | Ограниченная диагностика lookup/stub-провайдеров | P1 |
| `commerce` | Рабочий контур | Слабое обновление состояния после записи | P1 |
| `front-office core` | Частично рабочий | Сбои маскируются под пустое состояние | P0 |
| `front-office context` | Частично рабочий | Бизнес-сущности растворены в `AuditLog` | P1 |
| `control-tower` | Вероятно рабочий | Требует runtime-проверки по внешним зависимостям | P1 |
| `strategy/forecasts` | Рабочий с риском | `localStorage` маскирует backend-сбой | P1 |
| `consulting/plans` | Частично рабочий | Грубый UX, `alert`, ручные обновления | P1 |
| `consulting/techmaps` | Частично рабочий | Переходы трудно дебажить | P1 |
| `consulting/yield` | Рабочий | Нужна явная post-write верификация на UI | P1 |
| `consulting/dashboard` | Декорация | Полное искажение продуктовой правды | P0 |
| `consulting/advisory` | Декорация | Пользователь принимает решения по выдуманным данным | P0 |
| `consulting/budgets` | Декорация | Бюджетный контур выглядит существующим без backend-чтения | P0 |
| `consulting/deviations/*` | Декорация | Риск-контур кажется рабочим, но им не является | P0 |
| `strategic/legal` | Декорация | Нормативная картина выдумана на фронте | P0 |
| `strategic/rd` | Контрактно сломан | Возможное runtime-падение | P1 |
| `dashboard` legacy | Сломанный shell | Пользователь попадает в мёртвую ветку сразу после входа | P0 |
| `economy/finance/gr/hr/knowledge/production/settings/strategy` | Заглушки | Большой объём ложных ожиданий | P0 |

## Топ-20 исправлений с наибольшим эффектом для QA и отладки

1. Перевести post-login маршрут с `/dashboard` на единый актуальный shell.
2. Удалить мёртвые клиентские контракты `/tasks` и `/fields`.
3. Скрыть из навигации `consulting/dashboard`.
4. Скрыть из навигации `consulting/advisory`.
5. Скрыть из навигации `consulting/budgets`.
6. Скрыть из навигации `consulting/deviations/detected`.
7. Скрыть из навигации `consulting/deviations/decisions`.
8. Заменить silent catch в `front-office` на явные error-state-компоненты.
9. Убрать `localhost` из `front-office-server`, `auth-server`, `strategicApi`, legacy-страниц и `app/api/*`-проксей.
10. Внедрить единый `requestId` и показывать его в UI при ошибке.
11. Ввести глобальные бейджи правдивости фичи: `Работает / Частично / Stub / Demo`.
12. Убрать `alert(...)` из `consulting/plans` и `consulting/techmaps`.
13. Убрать `window.location.reload()` из коммерческих write-flow.
14. Переписать `consulting/advisory` на живой backend endpoint.
15. Добавить read-endpoint списка бюджетов либо удалить budget-screen.
16. Перевести `consulting/deviations/*` на реальные endpoints.
17. Исправить контракт `strategic/rd`.
18. Разделить `strategy/forecasts` на backend-truth и browser-draft.
19. Сделать `front-office` консультации и context updates предметными сущностями.
20. Ввести smoke-проверки критических write-flow: party create, contract create, invoice post, payment confirm, plan create, tech-map generate, yield save.

## Топ-10 UX-элементов, создающих ложную уверенность

1. `consulting/dashboard` с текстом про «реальное время» при полностью жёстко прошитых метриках.
2. `consulting/advisory` как polished-аналитика на `MOCK_ADVISORY`.
3. `consulting/budgets` как рабочий реестр бюджетов без backend list-endpoint.
4. `consulting/deviations/detected` как реестр живых отклонений на локальном массиве.
5. `consulting/deviations/decisions` как журнал решений и explainability на локальном массиве.
6. `front-office` домашний экран, который подменяет backend-сбой пустыми счётчиками.
7. `strategy/forecasts`, показывающий browser-shadow как будто это серверная правда.
8. `strategic/legal`, который рисует нормативный контекст без вызова legal backend.
9. `legacy dashboard`, куда пользователь попадает после успешного логина.
10. `41` placeholder-маршрут, доступный как настоящие домены продукта.

## Топ-10 самых подозрительных мест, где данные выглядят сохранёнными, но правда неоднозначна

1. `dashboard/tasks/create` — отправка в несуществующий `POST /tasks`.
2. `dashboard/tasks/create` — загрузка полей через несуществующий `GET /fields`.
3. `front-office consultations` — сохраняются только как `AuditLog`, а не как предметная сущность.
4. `front-office context updates` — сохраняются только как `AuditLog`.
5. `strategy/forecasts` — после сбоя чтения пользователь продолжает видеть `localStorage`-данные.
6. `consulting/advisory` — выглядит как сохранённая аналитика, но вообще не читает backend.
7. `consulting/budgets` — выглядит как бюджетный реестр, но backend list-контур отсутствует.
8. `consulting/deviations/detected` — выглядит как persisted feed, но это локальный массив.
9. `consulting/deviations/decisions` — выглядит как журнал решений, но это локальный массив.
10. `party lookup` по BY/KZ — UI похож на реальный lookup, но backend возвращает `STUB`/`NOT_SUPPORTED`.

## Минимальный каркас правдивости продукта

### Как маркировать stub-фичи

- На каждом экране иметь обязательный флаг `featureTruthStatus`.
- Допустимые значения: `live`, `partial`, `stub`, `demo`, `disabled`.
- `stub` и `demo` должны автоматически включать заметный баннер на странице и в навигации.

### Как показывать провал сохранения

- Любая форма после отправки проходит три состояния: `отправлено`, `подтверждено backend`, `подтверждено перечитыванием`.
- Без успешного reread экран не имеет права показывать финальный success-state.

### Как поднимать backend-ошибки в UI

- Ошибка должна отображать endpoint, `requestId`, короткое описание и действие повторного запроса.
- Пустой список запрещён как универсальный fallback для ошибок сети и сервера.

### Как отличать реальное поведение от demo во время тестирования

- Для demo/stub-контуров использовать отдельный namespace маршрутов, например `/demo/*`.
- Для браузерных черновиков использовать отдельную подпись `Локальный черновик браузера`.
- Для данных с сервера использовать `Обновлено backend: <timestamp>`.

## Лёгкий regression-checklist для ручного тестирования

1. Вход по основному логину не должен вести на legacy-`/dashboard`.
2. После входа все API-базовые URL должны разрешаться без `localhost`-зависимости.
3. Создание контрагента должно завершаться открытием карточки и повторным чтением сущности.
4. Создание хозяйства должно создавать роль оператора и открывать карточку хозяйства.
5. Создание договора должно отражаться в списке без полного перезагрузочного обхода.
6. Проведение счёта должно менять статус без `window.location.reload()`.
7. Подтверждение оплаты должно менять статус без `window.location.reload()`.
8. Создание harvest plan должно отражаться в списке и карточке плана.
9. Генерация tech-map должна приводить к открытию созданной техкарты.
10. Сохранение yield должно подтверждаться перечитыванием `HarvestResult`.
11. `front-office` overview при backend-сбое должен показывать ошибку, а не нулевые счётчики.
12. `strategy/forecasts` при отключённом backend не должен подменять правду `localStorage`-сценариями без маркировки.
13. `consulting/advisory`, `consulting/budgets`, `consulting/deviations/*` не должны быть доступны пользователю до реального wiring.
14. `strategic/legal` и `strategic/rd` должны либо читать реальные endpoints, либо быть явно помечены как неготовые.
15. Для BY/KZ lookup UI должен явно писать, что провайдер не подключён.
