# S18 — BudgetController Runtime Authority

Дата: 2026-03-07
Статус: READY_FOR_REVIEW
Промт: `interagency/prompts/2026-03-07_a_rai-s18_budget-controller-runtime.md`

## Что изменено

- `apps/api/src/modules/rai-chat/security/budget-controller.service.ts`
  - сохранён существующий tech-map budget guard (`validateTransaction`);
  - добавлен runtime budget governor поверх persisted `agentRegistry.maxTokens`;
  - введены outcomes `ALLOW / DEGRADE / DENY`;
  - decision теперь детерминированно рассчитывается по requested tools и owner-agent budget.
- `apps/api/src/modules/rai-chat/runtime/agent-runtime.service.ts`
  - budget decision применяется до fan-out;
  - `DEGRADE` реально урезает execution set;
  - `DENY` реально останавливает runtime до вызова tool handlers;
  - на `DEGRADE`/`DENY` пишется incident через `IncidentOpsService` (`SystemIncidentType.UNKNOWN` + subtype `BUDGET_RUNTIME_*`).
- `apps/api/src/modules/rai-chat/composer/response-composer.service.ts`
  - response теперь включает `runtimeBudget`.
- `apps/api/src/modules/rai-chat/supervisor-agent.service.ts`
  - `runtimeBudget` доезжает в `AiAuditEntry.metadata`, то есть budget decision виден в trace/audit source of truth.
- `apps/api/src/modules/rai-chat/dto/rai-chat.dto.ts`
  - добавлен `RuntimeBudgetDto`.

## Где встроен enforcement

- Каноническая точка authority: `Supervisor -> AgentRuntime.run(...)`.
- Enforcement выполняется до `planByToolCalls(...)` и до fan-out.
- Semantics:
  - `ALLOW`: runtime исполняется без изменений.
  - `DEGRADE`: часть tool calls отбрасывается до execution.
  - `DENY`: execution не начинается, `executedTools = []`.
- Replay path не искажается:
  - `BudgetController` возвращает `ALLOW` c `source = replay_bypass`;
  - лишних budget incidents/side effects не создаётся.

## Observability / audit

- Response contract теперь содержит `runtimeBudget`.
- `AiAuditEntry.metadata.runtimeBudget` фиксирует budget decision в persisted trace.
- `IncidentOpsService` получает budget signals:
  - `BUDGET_RUNTIME_DEGRADED`
  - `BUDGET_RUNTIME_DENIED`

## Producer-side proof

- `apps/api/src/modules/rai-chat/security/budget-controller.service.spec.ts`
  - `ALLOW`
  - `DEGRADE`
  - `DENY`
  - replay bypass
- `apps/api/src/modules/rai-chat/runtime/agent-runtime.service.spec.ts`
  - runtime реально исполняет `DEGRADE`
  - runtime реально блокирует execution на `DENY`
  - budget incident пишется на degraded/denied path
- `apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts`
  - `runtimeBudget` доезжает до response
  - `runtimeBudget` persist’ится в audit metadata

## Claims sync

- Claim `BudgetController — полноценный governor токенов и деградации в основном runtime-потоке` переведён из `PARTIAL` в `CONFIRMED`.

## Проверки

- `pnpm --filter api exec tsc --noEmit` — PASS
- `pnpm --filter api test -- --runInBand apps/api/src/modules/rai-chat/security/budget-controller.service.spec.ts apps/api/src/modules/rai-chat/runtime/agent-runtime.service.spec.ts apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts` — PASS

## Остаточный риск

- Runtime governor уже встроен в основной execution spine, но budget model пока intentionally coarse-grained: она опирается на persisted `maxTokens` per agent и deterministic per-tool cost map, а не на live token accounting конкретной LLM-сессии. Для текущего claim этого достаточно, потому что authority стала реальной и поведенческой, а не декоративной.
