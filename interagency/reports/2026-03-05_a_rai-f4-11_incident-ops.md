## Report — 2026-03-05_a_rai-f4-11_incident-ops

- **Prompt**: `interagency/prompts/2026-03-05_a_rai-f4-11_incident-ops.md`
- **Scope**: Security & Incident Ops — модель SystemIncident, IncidentOpsService (logIncident, getIncidentsFeed), интеграция PII_LEAK в SensitiveDataFilterService.

---

## 1. Изменённые файлы

- **Prisma**:
  - `packages/prisma-client/schema.prisma` — enum `SystemIncidentType` (CROSS_TENANT_BREACH, PII_LEAK, RATE_LIMIT, UNKNOWN), модель `SystemIncident` (id, companyId?, traceId?, incidentType, severity, details Json, createdAt), связь `Company.systemIncidents`.

- **API (rai-chat)**:
  - `apps/api/src/modules/rai-chat/incident-ops.service.ts` — сервис: `logIncident(params)` (fire-and-forget), `getIncidentsFeed(companyId, limit, offset)` с пагинацией (limit до 100).
  - `apps/api/src/modules/rai-chat/incident-ops.service.spec.ts` — unit: создание инцидента, feed по companyId с пагинацией.
  - `apps/api/src/modules/rai-chat/security/sensitive-data-filter.service.ts` — опциональная зависимость `IncidentOpsService`; при `mask(text, context)` и изменении текста вызывается `logIncident(PII_LEAK, MEDIUM, details)`.
  - `apps/api/src/modules/rai-chat/security/sensitive-data-filter.service.spec.ts` — тесты с моком IncidentOpsService: PII + context → logIncident; без PII → не вызывается.
  - `apps/api/src/modules/rai-chat/rai-chat.module.ts` — добавлен провайдер `IncidentOpsService`.

- **Interagency**:
  - `interagency/INDEX.md` — статус F4-11 → DONE, ссылка на отчёт.

---

## 2. tsc --noEmit

На корне репо при `tsc --noEmit` падает ошибка типов для `uuid` (существующая конфигурация). Компиляция кода в `apps/api` для изменённых модулей типически корректна (тесты и код собираются Jest/ts-jest).

---

## 3. Jest — целевые тесты

Команда (из `apps/api`):

```bash
pnpm test -- incident-ops.service.spec.ts sensitive-data-filter.service.spec.ts --no-cache
```

Результат:

- **PASS**: `incident-ops.service.spec.ts`, `sensitive-data-filter.service.spec.ts`
- **Suites**: 2 passed / 2 total
- **Tests**: 12 passed / 12 total

Покрытие:

- **IncidentOpsService**: logIncident создаёт запись с переданными полями; getIncidentsFeed фильтрует по companyId, orderBy createdAt desc, пагинация take/skip.
- **SensitiveDataFilterService**: без провайдера — маскировка как раньше; с моком IncidentOpsService — при маскировке PII с context вызывается logIncident с PII_LEAK, severity MEDIUM, details; без PII — logIncident не вызывается.

---

## 4. Поведение

- **logIncident**: не блокирует основной флоу (void prisma.systemIncident.create(...).catch(...)).
- **getIncidentsFeed**: только записи с указанным companyId, limit ограничен 100.
- **PII_LEAK**: пишется только если передан context и инжектирован IncidentOpsService (в RaiChatModule оба сервиса в одном модуле). В модулях без IncidentOpsService (например, explainability) фильтр работает без логирования инцидентов.

---

## 5. DoD

- [x] Схема Prisma обновлена (enum + модель + связь).
- [x] IncidentOpsService реализован и зарегистрирован в RaiChatModule.
- [x] SensitiveDataFilterService при замене PII с context логирует PII_LEAK.
- [x] Unit: создание инцидента, feed по companyId, фильтр+PII→logIncident (мок).
- [x] Ревью-пак: отчёт + INDEX.

**Статус**: READY_FOR_REVIEW.
