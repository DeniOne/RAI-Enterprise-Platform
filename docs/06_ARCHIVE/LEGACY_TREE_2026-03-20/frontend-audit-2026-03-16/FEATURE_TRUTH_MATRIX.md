---
id: DOC-ARV-FRONTEND-AUDIT-2026-03-16-FEATURE-TRUTH-MA-P90M
layer: Archive
type: Research
status: archived
version: 0.1.0
---
# Матрица правды по видимым функциям

Дата: 16.03.2026

| Зона | Пользовательская поверхность | Статус | Что реально происходит | Доказательства |
| --- | --- | --- | --- | --- |
| Master data | `/parties`, `/parties/[id]` | Работает | Чтение и запись идут через реальные endpoints и Prisma | `apps/web/lib/party-assets-api.ts`, `apps/api/src/modules/commerce/party.controller.ts`, `apps/api/src/modules/commerce/services/party.service.ts` |
| Master data | `/assets/farms`, `/assets/fields`, `/assets/objects` | Работает | Реальный реестр активов и ролей | `apps/api/src/modules/commerce/party-assets.controller.ts:111`, `apps/api/src/modules/commerce/party-assets.controller.ts:117` |
| Commerce | `/commerce/contracts` | Работает | Реальный список и создание договоров | `apps/web/app/(app)/commerce/contracts/page.tsx`, `apps/api/src/modules/commerce/services/commerce-contract.service.ts` |
| Commerce | `/commerce/invoices` | Частично работает | Реальная запись есть, обновление состояния грубое | `apps/web/app/(app)/commerce/invoices/page.tsx:153`, `apps/api/src/modules/commerce/services/fulfillment.service.ts` |
| Commerce | `/commerce/payments` | Частично работает | Реальная запись есть, обновление состояния грубое | `apps/web/app/(app)/commerce/payments/page.tsx:159`, `apps/api/src/modules/commerce/services/fulfillment.service.ts` |
| Front-office | `/front-office` | Частично работает | Backend живой, ошибки маскируются нулями и пустыми списками | `apps/web/app/(app)/front-office/page.tsx:16`, `apps/web/app/(app)/front-office/page.tsx:20` |
| Front-office | `/front-office/tasks`, `/front-office/tasks/[id]` | Работает с риском | Реальное чтение задач есть | `apps/web/lib/api/front-office-server.ts:39`, `apps/api/src/modules/task/task.controller.ts:49` |
| Front-office | `/front-office/threads/*` | Работает с риском | Поток сообщений и handoff-модели есть, нужна runtime-проверка reply/read | `packages/prisma-client/schema.prisma:5936`, `packages/prisma-client/schema.prisma:5998`, `packages/prisma-client/schema.prisma:6026` |
| Front-office | `/front-office/context` | Частично работает | Консультации и context updates читаются из `AuditLog`, а не из предметных таблиц | `apps/api/src/modules/front-office/front-office.service.ts:395`, `apps/api/src/modules/front-office/front-office.service.ts:452` |
| Control Tower | `/control-tower`, `/control-tower/agents` | Частично работает | Контракты backend существуют, но есть сильная зависимость от runtime-сервисов | `apps/api/src/modules/explainability/explainability-panel.controller.ts`, `apps/api/src/modules/explainability/agents-config.controller.ts` |
| Planning | `/consulting/plans` | Частично работает | Реальный backend есть, фронт использует `alert` и грубую обработку | `apps/web/app/consulting/plans/page.tsx`, `apps/api/src/modules/consulting/consulting.controller.ts:209` |
| Tech Map | `/consulting/techmaps` | Частично работает | Генерация и transitions wired, UX слабый | `apps/web/app/consulting/techmaps/page.tsx:62`, `apps/web/app/consulting/techmaps/[id]/page.tsx:101` |
| Yield | `/consulting/yield` | Работает | Запись идёт через orchestrator и `HarvestResult` | `apps/api/src/modules/consulting/yield.orchestrator.ts`, `apps/api/src/modules/consulting/yield.service.ts` |
| Execution | `/consulting/execution` | Частично работает | Реальные запросы есть, но экран содержит остатки декоративной логики | `apps/web/app/consulting/execution/page.tsx`, `apps/api/src/modules/consulting/consulting.controller.ts:276` |
| Consulting shell | `/consulting/dashboard` | Ложно реализовано | Жёстко прошитые метрики и демонстрационная сводка | `apps/web/app/consulting/dashboard/page.tsx:40`, `apps/web/app/consulting/dashboard/page.tsx:135` |
| Advisory | `/consulting/advisory` | Ложно реализовано | Локальный `MOCK_ADVISORY` вместо backend | `apps/web/app/consulting/advisory/page.tsx:8`, `apps/web/app/consulting/advisory/page.tsx:18` |
| Budgets | `/consulting/budgets` | Ложно реализовано | Локальный `MOCK_BUDGETS`, backend list отсутствует | `apps/web/app/consulting/budgets/page.tsx:10`, `apps/api/src/modules/consulting/consulting.controller.ts:259` |
| Deviations | `/consulting/deviations/detected` | Ложно реализовано | Локальный `MOCK_DEVIATIONS` | `apps/web/app/consulting/deviations/detected/page.tsx:18` |
| Decisions | `/consulting/deviations/decisions` | Ложно реализовано | Локальный `MOCK_DECISIONS` и mock explainability | `apps/web/app/consulting/deviations/decisions/page.tsx` |
| Strategy | `/strategy/forecasts` | Работает с риском | Backend реальный, но есть shadow-cache в `localStorage` | `apps/web/app/(app)/strategy/forecasts/page.tsx`, `apps/api/src/modules/finance-economy/ofs/application/strategy-forecasts.controller.ts` |
| Strategic Projection | `/(strategic)/legal` | Ложно реализовано | UI сам возвращает локальный массив требований | `apps/web/app/(strategic)/legal/page.tsx:7` |
| Strategic Projection | `/(strategic)/rd` | Контрактно сломано | UI читает несуществующий `GET /rd/experiments` | `apps/web/lib/api/strategic.ts:61`, `apps/api/src/modules/rd/controllers/ExperimentController.ts:20` |
| Legacy | `/dashboard` | Сломано | Это старый shell, оставшийся точкой входа и использующий мёртвые контракты | `apps/web/components/auth/LoginForm.tsx:51`, `apps/web/app/dashboard/tasks/create/page.tsx:40`, `apps/web/app/dashboard/tasks/create/page.tsx:51` |
| Пустые домены | `economy`, `finance`, `gr`, `hr`, `knowledge`, `production`, `settings`, `strategy` | Заглушка | Route-файлы отрисовывают `Content Placeholder // Phase Beta` | `apps/web/app/(app)/finance/invoices/page.tsx:9`, `apps/web/app/(app)/strategy/scenarios/page.tsx:9` |
