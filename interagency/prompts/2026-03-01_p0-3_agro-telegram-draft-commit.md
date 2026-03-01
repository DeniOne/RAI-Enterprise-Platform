# PROMPT — P0.3 Agro Telegram Draft→Commit (apps/api)
Дата: 2026-03-01  
Статус: active  
Приоритет: P0  
Decision-ID: AG-AGRO-DRAFT-COMMIT-001  

## Цель
Сделать боевой контур Agro Draft→Fix/Link→Confirm→Commit в `apps/api`, чтобы Telegram мог работать как “терминал поля” по закону Draft→Commit, а не как SPEC-ONLY в `docs/`.

## Контекст
- Чеклист P0.3: `docs/00_STRATEGY/STAGE 2/PROJECT_EXECUTION_CHECKLIST.md`
- Текущая “реализация” существует в `docs/02_DOMAINS/AGRO_DOMAIN/EVENTS/*` (как код-спека), но не является боевым модулем `apps/api`.
- Prisma модели уже есть: `packages/prisma-client/schema.prisma` (`AgroEventDraft`, `AgroEventCommitted`).

## Ограничения (жёстко)
- Admission/security gate: реализация допустима **только после подтверждения релевантного `Decision-ID` со статусом `ACCEPTED`**.
- Security / tenant isolation: `companyId` берётся только из контекста (auth/tenant), **не из payload**.
- MUST-gate обязателен: commit запрещён, пока `missingMust[]` не пуст.
- Не делать UI/полировку, только боевой backend-модуль + тесты.
- Не трогать `apps/telegram-bot` (транспорт) в рамках P0.3.
- Не делать `commit/push` и не обновлять чеклисты/memory-bank до внешнего ревью.
- Не менять Prisma schema/migrations, если не будет доказана несовместимость с существующими моделями `AgroEventDraft` / `AgroEventCommitted`.

## Задачи (что сделать)
- [ ] Подтвердить релевантный `Decision-ID` со статусом `ACCEPTED` и что scope решения покрывает перенос `Agro Draft→Commit` в `apps/api`.
- [ ] Сверить код-спеку в `docs/02_DOMAINS/AGRO_DOMAIN/EVENTS/*` с текущими моделями Prisma и примитивами `apps/api` (`PrismaModule`, `TenantContextService`, `@CurrentUser()`), чтобы зафиксировать целевую структуру модуля.
- [ ] Перенести контур из `docs/02_DOMAINS/AGRO_DOMAIN/EVENTS/*` в `apps/api/src/modules/agro-events/*` (с минимальной адаптацией под Nest/Prisma проекта).
- [ ] Реализовать операции: create draft (TTL+missingMust), `fix`, `link`, `confirm`, `commit` (с `provenanceHash`).
- [ ] Подключить модуль в `apps/api/src/app.module.ts`.
- [ ] Убрать любой хардкод tenant/companyId из контроллеров; tenant берём из `@CurrentUser()` / `TenantContextService`.
- [ ] Написать unit-тесты на MUST-gate: confirm без MUST → блок; link → READY; confirm → committed.

## Definition of Done (DoD)
- [ ] В `apps/api` есть модуль `agro-events`, который:
  - создаёт `AgroEventDraft` (TTL, `missingMust[]`),
  - поддерживает `fix/link/confirm` (и `create draft` как входную операцию),
  - коммитит `AgroEventCommitted` с `provenanceHash`,
  - не принимает `companyId` из payload,
  - имеет unit-тесты на MUST-gate.

## Тест-план (минимум)
- [ ] `jest`: сервис `confirm()` не вызывает commit при `missingMust.length>0`
- [ ] `jest`: `link()` при закрытии MUST переводит draft в `READY_FOR_CONFIRM`
- [ ] `jest`: `confirm()` при пустом MUST создаёт committed + переводит draft в `COMMITTED`

## Что вернуть на ревью
- Изменённые файлы (список)
- Результаты `npm test` (фрагмент вывода)
- Короткое описание API/методов (какие операции доступны)

