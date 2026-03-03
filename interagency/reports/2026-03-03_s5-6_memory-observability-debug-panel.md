# REPORT — S5.6 Memory Observability Debug Panel
Дата: 2026-03-03
Статус: DONE
Ревью: APPROVED

## Что сделано
1. В `RaiChatResponseDto` добавлено typed поле `memoryUsed`.
2. `SupervisorAgent` теперь формирует безопасный observability summary по:
   - top episode context
   - profile context
   - confidence / source
3. `AiChatStore` сохраняет `memoryUsed` вместе с assistant message.
4. В `AiChatPanel` добавлена debug-плашка `Memory Used`.
5. Плашка gated через governance-capability (`canApprove`), то есть отображается только в привилегированном режиме.

## Что проверено
- `pnpm exec tsc -p apps/api/tsconfig.json --noEmit` -> PASS
- `pnpm -C apps/api test -- --runInBand src/modules/rai-chat/supervisor-agent.service.spec.ts src/modules/rai-chat/rai-chat.service.spec.ts` -> PASS
- `pnpm -C apps/web test -- --runInBand __tests__/ai-chat-store.spec.ts` -> PASS

## Безопасность
- В UI не выводится raw payload памяти.
- В response возвращается только explainability summary (`kind`, `label`, `confidence`, `source`).
- Плашка скрыта от непривилегированного режима.

## Результат
- Memory-layer стал прозрачнее и пригоден для enterprise/debug usage.
- Пользователь с нужным доступом видит, какой episode/profile context реально был использован агентом.
