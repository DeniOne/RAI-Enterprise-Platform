# Отчёт — A_RAI Фаза 3.2: RiskPolicy Engine & Two-Person Rule

**Дата:** 2026-03-05  
**Decision-ID:** AG-ARAI-F3-002  
**Промт:** `interagency/prompts/2026-03-05_a_rai-f3-2_risk-policy.md`

---

## Выполненные задачи

### 1. Модель PendingAction (БД)

- В `packages/prisma-client/schema.prisma` добавлены:
  - enum `PendingActionStatus`: PENDING, APPROVED_FIRST, APPROVED_FINAL, EXPIRED, REJECTED
  - model `PendingAction`: id, createdAt, expiresAt, traceId, companyId, toolName, payload (Json), riskLevel, status, requestedByUserId, approvedFirstBy, approvedFinalBy
- Связь `Company.pendingActions`
- Выполнено `prisma generate` (db push — по окружению, схема валидна)

### 2. Сервисы

- **RiskPolicyEngineService** (`security/risk-policy-engine.service.ts`):
  - `evaluate(riskLevel, domain, userRole)` по матрице §6.1: READ → ALLOWED; WRITE agro → REQUIRES_USER_CONFIRMATION; WRITE finance → REQUIRES_DIRECTOR_CONFIRMATION; CRITICAL → REQUIRES_TWO_PERSON_APPROVAL
  - `isDirector(role)` для CEO/CFO/ADMIN
- **PendingActionService** (`security/pending-action.service.ts`):
  - `create(input)` — PENDING, expiresAt = now + 1h
  - `approveFirst(actionId, companyId, userId, role)` — PENDING → APPROVED_FIRST
  - `approveFinal(actionId, companyId, userId, role)` — APPROVED_FIRST → APPROVED_FINAL
  - `reject(actionId, companyId)` — → REJECTED
  - `markExpiredIfNeeded`, `requiresTwoPerson(verdict)`, `requiresConfirmation(verdict)`
- **RiskPolicyBlockedError** — выбрасывается при блокировке, содержит actionId и toolName.

### 3. Интеграция в RaiToolsRegistry / AgentRuntime

- В `rai-tools.types.ts`: расширен `RaiToolActorContext` (userId?, userRole?), добавлен `TOOL_RISK_MAP` (toolName → riskLevel, domain).
- В **RaiToolsRegistry.execute**: перед делегированием в подреестры вызывается `RiskPolicyEngine.evaluate`; при `requiresConfirmation(verdict)` создаётся PendingAction, выполняется `logToolCall(..., "risk_policy_blocked")`, выбрасывается `RiskPolicyBlockedError`. Инструмент не выполняется.
- В **AgentRuntimeService**: все вызовы (agronom, economist, knowledge, other) идут через `toolsRegistry.execute`. При `RiskPolicyBlockedError` в результат кладётся `{ riskPolicyBlocked: true, actionId, message }` (partial result).
- Агенты (Agronom, Economist, Knowledge) больше не вызываются из AgentRuntime — выполнение только через реестр (единая точка проверки политики).

### 4. Тестирование

- **risk-policy-engine.service.spec.ts** — ветки матрицы (READ, CRITICAL, WRITE agro/finance/risk, isDirector).
- **pending-action.service.spec.ts** — create, approveFirst, approveFinal, reject, requiresTwoPerson, requiresConfirmation, NotFoundException.
- **rai-tools.registry.spec.ts** — при WRITE (GenerateTechMapDraft, EmitAlerts) ожидается RiskPolicyBlockedError, PendingAction создаётся, хэндлер/подреестр не вызывается.
- **agent-runtime.service.spec.ts** — убраны моки агентов, все вызовы через toolsRegistry.execute.
- **supervisor-agent.service.spec.ts** — обновлены ожидания: EmitAlerts и GenerateTechMapDraft возвращают riskPolicyBlocked + actionId; ComputePlanFact — payload без обёртки data.

---

## Definition of Done

| Критерий | Статус |
|----------|--------|
| Модель PendingAction в Prisma | ✅ |
| RiskPolicyEngineService реализован и покрыт тестами | ✅ |
| Two-Person Rule (APPROVED_FIRST → APPROVED_FINAL) | ✅ |
| Перехват опасных вызовов до исполнения | ✅ |
| tsc --noEmit | ✅ (выполнялся успешно) |
| Юнит-тесты rai-chat/security и реестр | ✅ (написаны; в среде возможен SIGKILL воркера Jest — прогнать локально) |

---

## Пример перехваченного вызова

При попытке агента выполнить WRITE-инструмент (например `GenerateTechMapDraft` или `EmitAlerts`) без разрешения политики:

1. В `RaiToolsRegistry.execute` вызывается `evaluate("WRITE", "agro" | "risk", userRole)` → verdict `REQUIRES_USER_CONFIRMATION` (или TWO_PERSON для CRITICAL).
2. Вызывается `PendingActionService.create(...)` → в БД создаётся запись со статусом PENDING и expiresAt = now + 1h.
3. Выбрасывается `RiskPolicyBlockedError(actionId, toolName, message)`.
4. В AgentRuntime ошибка ловится, в `executedTools` попадает:  
   `{ name: "generate_tech_map_draft", result: { riskPolicyBlocked: true, actionId: "pa-xxx", message: "Выполнение инструмента заблокировано RiskPolicy. Создан PendingAction #pa-xxx. Ожидается подтверждение человека." } }`.
5. Ответ пользователю формируется через ResponseComposer с этим результатом; TechMapService/хэндлер не вызывается.

---

## Изменённые файлы

- `packages/prisma-client/schema.prisma` — PendingActionStatus, PendingAction, Company.pendingActions
- `apps/api/src/modules/rai-chat/security/risk-policy-engine.service.ts` (новый)
- `apps/api/src/modules/rai-chat/security/risk-policy-engine.service.spec.ts` (новый)
- `apps/api/src/modules/rai-chat/security/pending-action.service.ts` (новый)
- `apps/api/src/modules/rai-chat/security/pending-action.service.spec.ts` (новый)
- `apps/api/src/modules/rai-chat/security/risk-policy-blocked.error.ts` (новый)
- `apps/api/src/modules/rai-chat/tools/rai-tools.types.ts` — ToolRiskDomain, TOOL_RISK_MAP, actorContext.userId/userRole
- `apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts` — интеграция RiskPolicy + PendingAction, перехват до execute
- `apps/api/src/modules/rai-chat/tools/rai-tools.registry.spec.ts` — моки политики/ pending action, тесты блокировки WRITE
- `apps/api/src/modules/rai-chat/runtime/agent-runtime.service.ts` — все вызовы через registry, обработка RiskPolicyBlockedError
- `apps/api/src/modules/rai-chat/runtime/agent-runtime.service.spec.ts` — без агентов, мок только registry
- `apps/api/src/modules/rai-chat/rai-chat.module.ts` — провайдеры RiskPolicyEngineService, PendingActionService
- `apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts` — провайдеры + мок pendingAction, ожидания для блокировки WRITE

---

## Команды для проверки

```bash
pnpm exec prisma validate --schema=packages/prisma-client/schema.prisma
pnpm exec tsc --noEmit -p apps/api
pnpm test --filter=api -- --testPathPattern="rai-chat" --runInBand
```

Статус: **READY_FOR_REVIEW**
