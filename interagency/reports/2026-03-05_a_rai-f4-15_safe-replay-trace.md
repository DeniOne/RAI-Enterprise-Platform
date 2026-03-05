# Отчёт — Safe Replay Trace (F4.15)

**Промт:** `interagency/prompts/2026-03-05_a_rai-f4-15_safe-replay-trace.md`  
**Дата:** 2026-03-05  
**Статус:** READY_FOR_REVIEW

## Изменённые файлы

- `apps/api/src/modules/rai-chat/tools/rai-tools.types.ts` — `replayMode?: boolean` в RaiToolActorContext
- `apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts` — при `replayMode` и riskLevel !== READ возврат mock без вызова handler
- `apps/api/src/modules/rai-chat/supervisor-agent.service.ts` — опция `options?: { replayMode?: boolean }` в orchestrate, передача в actorContext; в replay не вызывается commitInteraction; в writeAiAuditEntry сохранение `metadata.replayInput` (message, workspaceContext) для обычного прогона
- `apps/api/src/modules/rai-chat/safe-replay.service.ts` — новый
- `apps/api/src/modules/rai-chat/safe-replay.service.spec.ts` — новый
- `apps/api/src/modules/rai-chat/rai-chat.module.ts` — провайдер и экспорт SafeReplayService
- `apps/api/src/modules/explainability/explainability-panel.module.ts` — импорт RaiChatModule
- `apps/api/src/modules/explainability/explainability-panel.controller.ts` — `POST /rai/explainability/trace/:traceId/replay` с RolesGuard и @Roles(UserRole.ADMIN)

## Реализовано

- **replayMode в контексте:** RaiToolActorContext.replayMode; при true WRITE/CRITICAL инструменты не выполняются, возвращается `{ replayed: true, mock: true }`.
- **READ-инструменты в replay:** вызываются как обычно.
- **ReplayInput в AiAuditEntry:** при обычном прогоне в metadata пишется `replayInput: { message, workspaceContext }` (JSON-serializable).
- **SafeReplayService:** по traceId + companyId загружается первый AiAuditEntry, проверка тенанта; при отсутствии replayInput — 400 REPLAY_INPUT_UNAVAILABLE; сборка RaiChatRequestDto и вызов SupervisorAgent.orchestrate(..., { replayMode: true }); ответ — replayTraceId и response.
- **Эндпоинт:** POST /rai/explainability/trace/:traceId/replay, только ADMIN (RolesGuard + @Roles(UserRole.ADMIN)), companyId из TenantContext.

## Результаты проверок

### tsc — noEmit (apps/api)
```
PASS
```

### jest (целевые тесты)
```
PASS  rai-tools.registry.spec.ts  (в т.ч. replayMode: WRITE mock, READ executes)
PASS  safe-replay.service.spec.ts  4 tests
```

## DoD

- [x] WRITE в replay блокируются/мокаются
- [x] Эндпоинт для запуска реплея по traceId реализован
- [x] Unit: RaiToolsRegistry в replay возвращает мок для WRITE и не вызывает handler
- [x] Unit: RaiToolsRegistry в replay вызывает READ-инструменты
- [x] Unit: эндпоинт/runReplay инициализирует новый трейс по старому инпуту
