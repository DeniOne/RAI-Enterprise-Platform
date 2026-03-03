# PROMPT — S5.3 Memory Schema Implementation (Carcass + Flex Prisma)
Дата: 2026-03-03  
Статус: active  
Приоритет: P1  

## Цель
Реализовать физическую схему данных для памяти Agents OS в `schema.prisma` в строгом соответствии с `MEMORY_CANON.md` (AG-MEMORY-CANON-001). Заменить/дополнить существующую структуру `MemoryEntry` на 3-уровневую модель.

## Контекст
- Канон закреплен в `MEMORY_CANON.md`.
- Требуется реализовать Каркас (Carcass) и Гибкую часть (Flex JSONB).
- Основание: [RAI_AGENT_OS_IMPLEMENTATION_PLAN.md](file:///root/RAI_EP/docs/00_STRATEGY/STAGE%202/RAI_AGENT_OS_IMPLEMENTATION_PLAN.md) пункт 5.3.

## Задачи (что сделать)
1. **Обновить `schema.prisma`**:
   - `MemoryInteraction` (S-Tier): сырой лог (message, response, toolCalls).
   - `MemoryEpisode` (M-Tier): консолидированный эпизод.
   - `MemoryProfile` (L-Tier): профиль пользователя/тенанта.
2. **Carcass атрибуты**: Каждая модель должна иметь `id`, `companyId` (Tenant Isolation), `userId`/`sessionId`, `createdAt`, `updatedAt`. Векторное поле `embedding` для поиска.
3. **Flex атрибуты**: Поле `attrs` (JSONB) с обязательными метаданными `schemaKey`, `provenance`, `confidence`.
4. **Миграции**: Выполнить `db push` (или создать миграцию `db migrate`) и перегенерировать Prisma Client.
5. **Types/DTO**: Создать или обновить TS-интерфейсы в `apps/api/src/shared/memory/` для работы с новыми моделями.

## Ограничения и запреты (Security & Canon)
- Жесткая изоляция тенантов (`companyId`). Убедиться, что связи Company - Memory корректно прописаны.
- `schemaKey` обязателен и гарантируется на уровне TS/Zod схем.

## Definition of Done (DoD)
- [ ] Описаны модели `MemoryInteraction`, `MemoryEpisode`, `MemoryProfile` в `schema.prisma`.
- [ ] Prisma Client перегенерирован без ошибок типов.
- [ ] Создан абстрактный тип/DTO(Zod) для сохранения в эти сущности в API.
- [ ] Обновлен (или создан) план реализации.

## Что вернуть на ревью
- План реализации `interagency/plans/2026-03-03_s5-3_memory-schema-implementation.md`
