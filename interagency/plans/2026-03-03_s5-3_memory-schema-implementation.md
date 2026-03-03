# PLAN — S5.3 Memory Schema Implementation (Carcass + Flex Prisma)
Дата: 2026-03-03  
Статус: active (ACCEPTED)  

## Результат (какой артефакт получим)
- Обновленный `packages/prisma-client/schema.prisma` с 3 новыми моделями: `MemoryInteraction`, `MemoryEpisode`, `MemoryProfile`.
- Сгенерированный Prisma Client (`db push`).
- Базовые DTO/Zod-схемы для работы с Memory (добавлены в `shared/memory`).

## Границы (что входит / что НЕ входит)
- **Входит**: Новые физические таблицы. Удовлетворение Carcass + Flex канонов (attrs, companyId, provenance).
- **Не входит**: Удаление старой таблицы `MemoryEntry` (остается для обратной совместимости, пока мы не мигрируем сервис извлечения). Рефакторинг `RaiChatService` на запись в новые таблицы (это в Phase C: S5.4).

## Риски (что может пойти не так)
- Поломка текущей работы чата.
  - *Решение*: Модели добавляются "рядом" (Side-by-side). Legacy-память продолжает работу.
- Схемы могут противоречить Prisma Client.
  - *Решение*: Запуск `db push` с проверкой генерации, без нарушения связей (Relations). Для `companyId` и `userId` используем скалярные поля без `@relation`, чтобы не перегружать кору.

## План работ
- [ ] Записать модели `MemoryInteraction`, `MemoryEpisode`, `MemoryProfile` в `schema.prisma`.
- [ ] Оставить `MemoryEntry` без изменений.
- [ ] Запустить `npx prisma db push` (или `npm run db:push`) для наката схемы.
- [ ] Сгенерировать клиент (`npm run db:client`).
- [ ] Добавить базовые типы/DTO в папку `apps/api/src/shared/memory/` (schemaKey/provenance/confidence).
- [ ] Обновить `INDEX.md`.

## DoD
- [ ] 3 новые модели присутствуют в БД.
- [ ] TS не ругается, Prisma Client обновлен.
