# REPORT — S5.4 Adapter Write Routing (S-Tier)
Дата: 2026-03-03
Статус: DONE
Ревью: APPROVED

## Что сделано
1. `DefaultMemoryAdapter.appendInteraction` переведен с legacy `MemoryManager.store` на прямую запись в `MemoryInteraction` через `PrismaService`.
2. В `MemoryContext` добавлен `userId`; сквозной прокид выполнен через `RaiChatController -> RaiChatService -> ExternalSignalsService -> MemoryAdapter`.
3. Запись S-Tier приведена к канону Carcass + Flex:
   - carcass: `companyId`, `sessionId`, `userId`, `content`
   - flex: `schemaKey`, `provenance`, `confidence`, `traceId`, `source`, `toolCalls`, `metadata`
4. Для `attrs` внедрена рекурсивная JSON-sanitization:
   - `undefined` и функции -> `null`
   - `Date` -> ISO string
   - `Map`/`Set` -> JSON-совместимый вид
   - циклические ссылки -> `"[Circular]"`
5. Запись `embedding` выполняется внутри `prisma.$transaction(...)` отдельным raw update для `vector(1536)` после создания `MemoryInteraction`.
6. Добавлена валидация embedding: допускаются только finite numbers; при ошибке транзакционный путь прерывается, частичная запись не считается успешной бизнес-операцией.

## Что проверено
- `pnpm exec tsc -p apps/api/tsconfig.json --noEmit` -> PASS
- `pnpm -C apps/api test -- --runInBand src/shared/memory/memory-adapter.spec.ts src/modules/rai-chat/rai-chat.service.spec.ts` -> PASS

## Покрытие тестами
- Проверка каноничной записи в `memoryInteraction.create`
- Проверка raw update embedding
- Проверка сквозной передачи `userId`
- Проверка nested/circular JSON sanitization без обнуления всего payload
- Проверка невалидного embedding
- Проверка ошибки raw update embedding
- Проверка отсутствия регресса в `RaiChatService`

## Замечания ревью
- Dual-write осознанно не внедрялся: `retrieve` уже отделен от legacy writer.
- `MemoryManager` остается в кодовой базе до следующих шагов Phase C, но больше не является writer для новых S-Tier interaction.

## Результат
- S5.4 закрывает маршрут записи raw logs в новую memory-схему без нарушения tenant isolation.
- Контур памяти теперь пишет `userId`, сохраняет embedding транзакционно и не теряет весь JSON payload из-за одного плохого поля.
