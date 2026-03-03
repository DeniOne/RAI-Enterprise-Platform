# PLAN — S5.4 Adapter Write Routing (S-Tier)
Дата: 2026-03-03
Статус: active (ACCEPTED)
Decision-ID: AG-MEMORY-CANON-001

## Результат
- `DefaultMemoryAdapter.appendInteraction` пишет S-Tier сырые логи напрямую в `memoryInteraction` через `PrismaService`.
- Запись формируется по канону Carcass + Flex: `companyId`, `sessionId`, `content`, `embedding`, `attrs.schemaKey`, `attrs.provenance`, `attrs.confidence`.
- Юнит-тесты адаптера проверяют каноничный вызов `prisma.memoryInteraction.create`.

## Границы
- Входит: только маршрут записи S-Tier в новой схеме.
- Входит: обновление `DefaultMemoryAdapter` и `memory-adapter.spec.ts`.
- Не входит: перепись `retrieve` на новые M/L-tier сервисы, миграция профиля, удаление `MemoryManager`.
- Не входит: любые Prisma-миграции и изменения `schema.prisma`, так как S5.3 уже закрыт.

## Текущее состояние
- `appendInteraction` сейчас делегирует запись в legacy `MemoryManager.store`.
- `retrieve` уже идет через `EpisodicRetrievalService`, то есть контур чтения отделен от legacy writer.
- Новая Prisma-схема `MemoryInteraction` уже существует и задеплоена в рамках S5.3.

## Решение по dual-write
- Dual-write не нужен и не планируется.
- Обоснование: текущий `retrieve` уже не зависит от legacy `MemoryManager.store`; сохранение двойной записи создаст расхождение между S-Tier и retrieval-контуром, а также лишний IO-шум.
- Legacy `MemoryManager` не удаляется, но выводится из цепочки новых записей. Его удаление и очистка зависимостей остаются за отдельной задачей после полного завершения Phase C.

## Риски
- Возможен контрактный разрыв, если какие-то неучтенные потребители still rely on legacy side effects `MemoryManager.store`.
- Возможна несовместимость payload с фактической Prisma-моделью `memoryInteraction`.
- Возможен регресс в тестах `RaiChatService`, если адаптер изменит наблюдаемое поведение на уровне исключений или trace logging.

## План работ
- [ ] Проверить фактический контракт модели `MemoryInteraction` в Prisma и сопоставить его с `MemoryContext` + `MemoryInteraction`.
- [ ] Заинжектить `PrismaService` в `DefaultMemoryAdapter` без нарушения Infrastructure Isolation.
- [ ] Переписать `appendInteraction` с вызова `memoryManager.store` на `prisma.memoryInteraction.create`.
- [ ] Сформировать каноничный `content` для S-Tier записи из `userMessage` и `agentResponse`.
- [ ] Сформировать `attrs` с минимумом: `schemaKey = "memory.interaction.v1"`, `provenance = "system"`, `confidence = 1`, `toolCalls`, `traceId`, `source`.
- [ ] Гарантировать Tenant Isolation: `companyId` брать только из `ctx.companyId`, `sessionId` только из `ctx.sessionId`, без доверия к пользовательскому payload.
- [ ] Сохранить fail-safe поведение: ошибки записи логируются и не ломают основной chat flow.
- [ ] Обновить `memory-adapter.spec.ts` под новый путь записи и добавить проверки ключевых полей `create`.
- [ ] Прогнать релевантные тесты памяти и `RaiChatService`.

## Критерии приемки
- [ ] `DefaultMemoryAdapter.appendInteraction` больше не вызывает `MemoryManager.store`.
- [ ] Есть прямой вызов `prisma.memoryInteraction.create` с каноничным набором полей Carcass + Flex.
- [ ] Решение об отказе от dual-write явно соблюдено в коде и тестах.
- [ ] `apps/api/src/shared/memory/memory-adapter.spec.ts` проходит.
- [ ] Существующие тесты `apps/api/src/modules/rai-chat/rai-chat.service.spec.ts` не ломаются.

## Артефакты на ревью
- `apps/api/src/shared/memory/default-memory-adapter.service.ts`
- `apps/api/src/shared/memory/memory-adapter.spec.ts`
- при необходимости: `apps/api/src/shared/prisma/prisma.service.ts` только для чтения контракта, без изменений
