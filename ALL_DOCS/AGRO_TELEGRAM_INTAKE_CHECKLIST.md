---
id: DOC-EXE-07-EXECUTION-AGRO-TELEGRAM-INTAKE-CHECKLIS-TIIE
layer: Execution
type: Checklist
status: draft
version: 0.1.0
---
# Чек-лист: AGRO_DOMAIN Telegram Intake Storage & Actions (Institutional MVP)

## 1. Хлебало Prisma (Persistence)
- [x] Добавить модель `AgroEventDraft` в `prisma/schema.prisma`.
- [x] Прописать индексы для `tenantId`, `userId` и `expiresAt`.
- [x] Накатить миграцию: `npx prisma db push` (синхронизировано).
- [x] Убедиться, что `missingMust` корректно типизирован (String[]).

## 2. Слой Хранилища (Repository)
- [x] Создать `docs/02_DOMAINS/AGRO_DOMAIN/EVENTS/storage/event-draft.repository.ts`.
- [x] Реализовать `createDraft`: заёб инфы в базу.
- [x] Реализовать `getDraft`: достать черновик с проверкой прав (tenant/user).
- [x] Реализовать `updateDraft`: патч полей без порчи провененса.
- [x] Реализовать `markCommitted`: статусная метка.
- [x] Реализовать `deleteExpired`: зачистка старься.

## 3. Авто-уборка (Cleanup Job)
- [x] Создать `docs/02_DOMAINS/AGRO_DOMAIN/EVENTS/storage/event-draft.cleanup.ts`.
- [x] Настроить Cron (Nest @Scheduled) на раз в сутки.
- [x] Протестировать очистку старых заброшенных черновиков (> 7 дней).

## 4. API Эндпоинты & DTO
- [x] Создать `docs/02_DOMAINS/AGRO_DOMAIN/EVENTS/api/dtos.ts` (Confirm/Fix/Link).
- [x] Создать `docs/02_DOMAINS/AGRO_DOMAIN/EVENTS/api/event-actions.controller.ts`.
- [x] Реализовать `POST /api/agro/events/confirm`.
- [x] Реализовать `POST /api/agro/events/fix`.
- [x] Реализовать `POST /api/agro/events/link`.

## 5. Бизнес-логика (Service)
- [x] Создать `docs/02_DOMAINS/AGRO_DOMAIN/EVENTS/api/event-actions.service.ts`.
- [x] Реализовать `fix()`: применение патчей + каскадный линкинг + перевалидация MUST.
- [x] Реализовать `link()`: прямая привязка рефов (farm/field/task).
- [x] Реализовать `confirm()`:
    - [x] Проверка MUST.
    - [x] Формирование `CommittedEvent` с хешем.
    - [x] Вызов `EventCommitter`.
    - [x] Перевод черновика в финальный статус.

## 6. Интеграция с Telegram Intake
- [x] Обновить `telegram-intake.controller.ts`:
    - [x] Интеграция с репозиторием (создание черновика).
    - [x] Проброс `draftId` в UI-ответ (кнопки ✅✏️🔗).
- [x] Проверить, что кнопки несут ID нужного черновика.

## 7. Верификация (Честная проверка)
- [x] Тест: Попытка `confirm` без обязательных полей -> возврат `mustQuestions`.
- [x] Тест: `link` -> очистка `missingMust` -> `READY_FOR_CONFIRM`.
- [x] Тест: Успешный `confirm` -> создание `COMMITTED` записи.
- [x] Тест: `cleanup` сносит старьё.
