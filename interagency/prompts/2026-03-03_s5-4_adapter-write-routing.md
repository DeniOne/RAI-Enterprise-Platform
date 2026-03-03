# PROMPT — S5.4 Adapter Write Routing (S-Tier)
Дата: 2026-03-03  
Статус: active  
Приоритет: P0  

## Цель
Реализовать физическую запись взаимодействий (S-Tier) в новую модель `MemoryInteraction` внутри `DefaultMemoryAdapter`. Обеспечить бесшовный переход от старой таблицы `MemoryEntry` (легаси) к новой схеме.

## Контекст
- Архитектурный канон утвержден в `MEMORY_CANON.md` (AG-MEMORY-CANON-001).
- Схемы `MemoryInteraction`, `MemoryEpisode`, `MemoryProfile` уже задеплоены в Prisma (S5.3).
- В данный момент `DefaultMemoryAdapter.appendInteraction` перенаправляет вызовы старому `MemoryManager`.
- В рамках Phase C (Memory Integration) необходимо перевести запись сырых логов (S-Tier) на новые таблицы.

## Задачи (что сделать)
1. **Обновить `DefaultMemoryAdapter`**:
   - Метод `appendInteraction` должен теперь писать в таблицу `memoryInteraction` через `PrismaService`.
   - Необходимо формировать обязательные Flex-атрибуты в поле `attrs` (schemaKey: `memory.interaction.v1`, provenance: `system`, confidence: 1.0 и т.д.).
2. **Dual-Write (Опционально, на усмотрение плана)**:
   - Если требуется обратная совместимость для старых цепочек извлечения (retrieve), метод может временно писать и в старую, и в новую таблицы. Если старый `MemoryManager` можно безопасно отрубить от записи — отключить старую запись.
   - *Важно: план должен явно указать решение по dual-write.*
3. **Обновление тестов**:
   - Переписать/дополнить `memory-adapter.spec.ts`, чтобы он проверял вызов `prismaService.memoryInteraction.create` с правильными каноничными полями (включая `companyId`).

## Ограничения и запреты (Security & Canon)
- **Tenant Isolation**: При записи `companyId` берется ТОЛЬКО из `MemoryContext`, передаваемого в адаптер.
- **Никаких миграций**: В этой задаче мы не переходим на M-Tier (Эпизоды) и L-Tier (Профили). Только S-Tier (raw logs).
- `MemoryManager` не удалять полностью, пока `retrieve` не будет полностью переписан на EpisodicRetrievalService + новые таблицы.

## Definition of Done (DoD)
- [ ] План интеграции написан и утвержден.
- [ ] `DefaultMemoryAdapter.appendInteraction` пишет в `MemoryInteraction`.
- [ ] Опциональный dual-write описан и реализован/отклонен с обоснованием.
- [ ] Юнит-тесты обновлены и проходят без ошибок.
- [ ] Ни один существующий тест `RaiChatService` не сломан.

## Что вернуть на ревью
- План реализации `interagency/plans/2026-03-03_s5-4_adapter-write-routing.md`
