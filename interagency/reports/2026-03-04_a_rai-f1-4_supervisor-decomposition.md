# Отчёт — A_RAI Фаза 1.4: Декомпозиция SupervisorAgent

**Дата:** 2026-03-04  
**Decision-ID:** AG-ARAI-F1-004  
**Промт:** `interagency/prompts/2026-03-04_a_rai-f1-4_supervisor-decomposition.md`

---

## Выполненные задачи

### 1. MemoryCoordinatorService (`memory/memory-coordinator.service.ts`)
- Вынесены вызовы `memoryAdapter.retrieve` (с `withTimeout`, `buildTextEmbedding`) и `memoryAdapter.getProfile`.
- Вынесены `memoryAdapter.append` и `updateProfile` (санитизация, fire-and-forget).
- Контракт: `recallContext(request, actorContext, userId?)` → `RecallResult` (recall + profile); `commitInteraction(request, responseText, actorContext, threadId, userId?)` → void.

### 2. ResponseComposerService (`composer/response-composer.service.ts`)
- Вынесена сборка `RaiChatResponseDto`: text, widgets (через `RaiChatWidgetBuilder`), toolCalls, suggestedActions, memoryUsed, advisory.
- Генерация `text` (склейка ответов тулов, памяти, профиля, advisory).
- Генерация `suggestedActions` и `buildMemoryUsed`/`summarizeExecutedTools`/`extractProfileSummary`.

### 3. AgentRuntimeService (`runtime/agent-runtime.service.ts`)
- Вынесена логика `executeToolCalls` (в т.ч. вызов AgronomAgent для GenerateTechMapDraft/ComputeDeviations).
- Обёртка таймаута 30 с на весь цикл (Promise.race, при превышении — `{ executedTools: [] }`).

### 4. Рефакторинг SupervisorAgent
- Оставлена только оркестрация: `recallContext` → `classify`/`buildAutoToolCall` → `agentRuntime.run` → `externalSignalsService.process` → `responseComposer.buildResponse` → `writeAiAuditEntry` → `memoryCoordinator.commitInteraction` → return.
- Объём `supervisor-agent.service.ts`: ~120 строк (было ~385).

### 5. Модуль и тесты
- В `RaiChatModule` зарегистрированы `MemoryCoordinatorService`, `AgentRuntimeService`, `ResponseComposerService`.
- Обновлены `supervisor-agent.service.spec.ts`, `rai-chat.service.spec.ts` (добавлены новые провайдеры и моки).
- Исправлен `rai-chat.controller.spec.ts` (второй аргумент `user` в `handleChat`).
- Добавлены юнит-тесты: `memory-coordinator.service.spec.ts`, `response-composer.service.spec.ts`, `agent-runtime.service.spec.ts`.

---

## Изменённые файлы

- `apps/api/src/modules/rai-chat/memory/memory-coordinator.service.ts` (новый)
- `apps/api/src/modules/rai-chat/memory/memory-coordinator.service.spec.ts` (новый)
- `apps/api/src/modules/rai-chat/composer/response-composer.service.ts` (новый)
- `apps/api/src/modules/rai-chat/composer/response-composer.service.spec.ts` (новый)
- `apps/api/src/modules/rai-chat/runtime/agent-runtime.service.ts` (новый)
- `apps/api/src/modules/rai-chat/runtime/agent-runtime.service.spec.ts` (новый)
- `apps/api/src/modules/rai-chat/supervisor-agent.service.ts` (рефакторинг)
- `apps/api/src/modules/rai-chat/rai-chat.module.ts` (провайдеры)
- `apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts` (моки)
- `apps/api/src/modules/rai-chat/rai-chat.service.spec.ts` (провайдеры)
- `apps/api/test/modules/rai-chat/rai-chat.controller.spec.ts` (сигнатура handleChat)

---

## DoD

- [x] Разнесены 3 сервиса (MemoryCoordinator, ResponseComposer, AgentRuntime).
- [x] SupervisorAgent < 150 строк.
- [x] `tsc --noEmit` — PASS.
- [x] `jest` по модулю rai-chat — PASS (68 тестов).

---

## Вывод tsc --noEmit

```
pnpm exec tsc --noEmit -p apps/api
# Exit code: 0
```

---

## Вывод тестов

```
pnpm test -- --testPathPattern="rai-chat" --runInBand
# Test Suites: 16 passed, 16 total
# Tests:       68 passed, 68 total
```

---

## Фрагмент orchestrate (SupervisorAgent)

```typescript
async orchestrate(request, companyId, userId?): Promise<RaiChatResponseDto> {
  const traceId = request.clientTraceId ?? `tr_${randomUUID()}`;
  const threadId = request.threadId ?? `th_${randomUUID()}`;
  const actorContext: RaiToolActorContext = { companyId, traceId };

  const recallResult = await this.memoryCoordinator.recallContext(request, actorContext, userId);
  const classification = this.intentRouter.classify(request.message, request.workspaceContext);
  const autoToolCall = this.intentRouter.buildAutoToolCall(request.message, request, classification);
  const requestedToolCalls = [...(request.toolCalls ?? [])];
  if (autoToolCall && !requestedToolCalls.some((t) => t.name === autoToolCall.name))
    requestedToolCalls.unshift({ name: autoToolCall.name, payload: autoToolCall.payload as Record<string, unknown> });

  const executionResult = await this.agentRuntime.run({ requestedToolCalls, actorContext });
  const externalSignalResult = await this.externalSignalsService.process({ companyId, traceId, threadId, userId, signals: request.externalSignals, feedback: request.advisoryFeedback });
  const response = await this.responseComposer.buildResponse({ request, executionResult, recallResult, externalSignalResult, traceId, threadId, companyId });

  this.writeAiAuditEntry({ companyId, traceId, toolNames: executionResult.executedTools.map((t) => t.name), intentMethod: classification.method });
  this.memoryCoordinator.commitInteraction(request, response.text, actorContext, threadId, userId);
  return response;
}
```

---

**Статус:** READY_FOR_REVIEW
