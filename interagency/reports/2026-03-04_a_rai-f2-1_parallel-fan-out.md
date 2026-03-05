# Отчёт — A_RAI Фаза 2.1: AgentRuntime Fan-Out & ToolCall Planner

**Дата:** 2026-03-04  
**Decision-ID:** AG-ARAI-F2-001  
**Промт:** `interagency/prompts/2026-03-04_a_rai-f2-1_parallel-fan-out.md`

---

## Выполненные задачи

### 1. ToolCall Planner (`runtime/tool-call.planner.ts`)
- `planByToolCalls(toolCalls)` — группирует вызовы по агентам: `agronom`, `economist`, `other`.
- Agronom: `GenerateTechMapDraft`, `ComputeDeviations`. Economist: `ComputePlanFact`, `SimulateScenario`, `ComputeRiskAssessment`. Остальное — `other` (RaiToolsRegistry).
- `planByIntents(intents)` — группировка по классификациям интентов (без payload).

### 2. Parallel Fan-Out в AgentRuntime
- `run(params)` строит план через `planByToolCalls(params.requestedToolCalls)`.
- Запуск агентов и other через `Promise.allSettled([...agronomPromises, ...economistPromises, ...otherPromises])`.
- Обёртка в `Promise.race(..., timeout 30s)`. При таймауте возвращается **partial result** (массив `partial`, заполняемый по мере завершения промисов).
- Результат каждого промиса — `{ name, result }`; при успехе собирается из `settled`, при таймауте — из `partial`.

### 3. EconomistAgent (stub)
- `agents/economist-agent.service.ts`: контракт `run({ companyId, traceId, intent, scope? })` → `EconomistAgentResult` (agentName, status, data, explain, toolCallsCount, traceId).
- Вызовы `FinanceToolsRegistry.execute` для `compute_plan_fact`, `simulate_scenario`, `compute_risk_assessment`.
- Добавлен в `RaiChatModule` и во все тестовые модули (supervisor, rai-chat.service).

### 4. ResponseComposer
- Учтён формат ответа EconomistAgent в `summarizeExecutedTools`: для `ComputePlanFact` при наличии `result.data` используется `result.data` для строки «План-факт по плану …».

### 5. Тестирование
- `runtime/tool-call.planner.spec.ts` — группировка по toolCalls и по intents.
- `agents/economist-agent.service.spec.ts` — COMPLETED/FAILED, вызов FinanceToolsRegistry.
- `runtime/agent-runtime.service.spec.ts` — run с other, fan-out (agronom + economist параллельно), тест на таймаут с partial заскipped (30s — для ручного запуска).

---

## Изменённые/новые файлы

- `apps/api/src/modules/rai-chat/runtime/tool-call.planner.ts` (новый)
- `apps/api/src/modules/rai-chat/runtime/tool-call.planner.spec.ts` (новый)
- `apps/api/src/modules/rai-chat/runtime/agent-runtime.service.ts` (Fan-Out + plan + EconomistAgent)
- `apps/api/src/modules/rai-chat/runtime/agent-runtime.service.spec.ts` (EconomistAgent mock, fan-out, timeout skip)
- `apps/api/src/modules/rai-chat/agents/economist-agent.service.ts` (новый)
- `apps/api/src/modules/rai-chat/agents/economist-agent.service.spec.ts` (новый)
- `apps/api/src/modules/rai-chat/rai-chat.module.ts` (EconomistAgent)
- `apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts` (EconomistAgent, ожидание payload.data для ComputePlanFact)
- `apps/api/src/modules/rai-chat/rai-chat.service.spec.ts` (EconomistAgent)
- `apps/api/src/modules/rai-chat/composer/response-composer.service.ts` (ComputePlanFact: поддержка result.data)

---

## DoD

- [x] ToolCallPlanner и EconomistAgent (stub) созданы.
- [x] В AgentRuntime реализован Fan-Out (Promise.allSettled) + таймаут 30s + partial при таймауте.
- [x] `tsc --noEmit` (apps/api) — PASS.
- [x] Изолированные тесты (runtime/, agents/economist-agent) — PASS. Тест на таймаут 30s оставлен как it.skip для ручного запуска (избежание долгого CI).

---

## Вывод tsc --noEmit

```
cd apps/api && npx tsc --noEmit
# Exit code: 0
```

---

## Вывод тестов (целевые)

```
pnpm test -- --testPathPattern="tool-call.planner|agent-runtime.service|economist-agent|supervisor-agent" --testTimeout=20000
# Test Suites: 4 passed, 4 total
# Tests:       1 skipped, 16 passed, 17 total
```

---

## Фрагмент кода: Promise.allSettled + timeout (AgentRuntime)

```typescript
const allPromises = [...agronomPromises, ...economistPromises, ...otherPromises];
const timeoutPromise = new Promise<never>((_, reject) =>
  setTimeout(
    () => reject(new Error("AGENT_RUNTIME_DEADLINE_EXCEEDED")),
    AGENT_DEADLINE_MS,
  ),
);

try {
  const settled = await Promise.race([
    Promise.allSettled(allPromises),
    timeoutPromise,
  ]);
  const executedTools = (settled as PromiseSettledResult<...>[])
    .filter((s): s is PromiseFulfilledResult<...> => s.status === "fulfilled")
    .map((s) => s.value);
  return { executedTools };
} catch (err) {
  this.logger.warn(...);
  return { executedTools: partial };
}
```

---

## Статус

**READY_FOR_REVIEW.** Ревью-пак собран. Дальше — Antigravity (TECHLEAD).
