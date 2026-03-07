# Отчёт — A_RAI S13 Autonomy/Policy Incidents & Runbooks

**Промт:** `interagency/prompts/2026-03-07_a_rai-s13_autonomy-policy-incidents-runbooks.md`  
**Дата:** 2026-03-07  
**Статус:** READY_FOR_REVIEW

## Изменённые файлы

- `packages/prisma-client/schema.prisma`
- `packages/prisma-client/migrations/20260307113000_autonomy_policy_incidents_runbooks/migration.sql`
- `packages/prisma-client/migrations/20260307114500_agent_config_change_requests/migration.sql`
- `apps/api/src/modules/rai-chat/incident-ops.service.ts`
- `apps/api/src/modules/rai-chat/incident-ops.service.spec.ts`
- `apps/api/src/modules/rai-chat/incidents-governance.controller.ts`
- `apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts`
- `apps/api/src/modules/rai-chat/tools/rai-tools.registry.spec.ts`
- `apps/api/src/modules/rai-chat/rai-chat.module.ts`
- `apps/api/src/modules/explainability/agent-prompt-governance.service.ts`
- `apps/api/src/modules/explainability/agent-prompt-governance.service.spec.ts`

## Incident Taxonomy

- Новые live incident types:
  - `AUTONOMY_QUARANTINE`
  - `AUTONOMY_TOOL_FIRST`
  - `POLICY_BLOCKED_CRITICAL_ACTION`
  - `PROMPT_CHANGE_ROLLBACK`
- В `SystemIncident` добавлен explicit lifecycle `status`:
  - `OPEN`
  - `RESOLVED`
  - `RUNBOOK_EXECUTED`
- Добавлена persisted модель `IncidentRunbookExecution` для runbook/fallback audit trail.

## Где именно incidents создаются в runtime

- `RaiToolsRegistry.execute()`:
  - `QUARANTINE` block -> `AUTONOMY_QUARANTINE`
  - `TOOL_FIRST` forced PendingAction -> `AUTONOMY_TOOL_FIRST`
  - `RiskPolicy` blocked critical action -> `POLICY_BLOCKED_CRITICAL_ACTION`
- `AgentPromptGovernanceService.reviewCanary()`:
  - governed rollback -> `PROMPT_CHANGE_ROLLBACK`

Все инциденты пишутся в существующий `SystemIncident` contour и несут live `companyId`, `traceId` (где применимо), severity и lifecycle status.

## Runbook / Fallback Model

- Новый endpoint: `POST /rai/incidents/:id/runbook`
- Исполняемые actions:
  - `REQUIRE_HUMAN_REVIEW`
    - переводит incident в `RUNBOOK_EXECUTED`
    - пишет `IncidentRunbookExecution`
    - пишет audit evidence `INCIDENT_RUNBOOK_EXECUTED`
  - `ROLLBACK_CHANGE_REQUEST`
    - требует `details.changeRequestId`
    - разрешён только для incident type `PROMPT_CHANGE_ROLLBACK`
    - восстанавливает previous config snapshot или удаляет текущий config
    - обновляет `AgentConfigChangeRequest` в `ROLLED_BACK`
    - пишет `IncidentRunbookExecution`
    - пишет audit evidence

## Governance Feed / Counters

- `getIncidentsFeed()` теперь отдаёт explicit `status`.
- `getGovernanceCounters()` теперь считает отдельно:
  - `autonomyPolicyIncidents`
  - `promptChangeRollback`
- Existing `byType` остаётся live source of truth.

## Guardrails

- Tenant isolation сохранена: все read/write для incident feed, resolve и runbook идут с `companyId` из trusted context.
- Новый incident subsystem не создавался: расширен существующий `SystemIncident` + governance controller.
- Runbook исполняется только для incidents в статусе `OPEN`.
- Runbook rollback не выполняется без `changeRequestId` в incident details и запрещён для incident types вне `PROMPT_CHANGE_ROLLBACK`.

## Проверки

### Prisma Client

- `pnpm prisma:generate` — **PASS**
- `pnpm prisma:build-client` — **PASS**

### Migration

- Добавлена Prisma migration: `packages/prisma-client/migrations/20260307113000_autonomy_policy_incidents_runbooks/migration.sql`
- Добавлена Prisma migration: `packages/prisma-client/migrations/20260307114500_agent_config_change_requests/migration.sql`
- Она покрывает:
  - новые enum values `SystemIncidentType`
  - новый enum `SystemIncidentStatus`
  - новый enum `IncidentRunbookAction`
  - новый enum `IncidentRunbookExecutionStatus`
  - колонку `system_incidents.status`
  - таблицу `incident_runbook_executions`
- Вторая migration покрывает schema drift, используемый rollback path:
  - enum `AgentConfigChangeScope`
  - enum `AgentConfigChangeStatus`
  - enum `AgentCanaryStatus`
  - enum `AgentRollbackStatus`
  - enum `AgentProductionDecision`
  - таблицу `agent_config_change_requests`

### TypeScript

- `pnpm --dir apps/api exec tsc --noEmit` — **PASS**

### Targeted Jest

- `pnpm --dir apps/api test -- --runInBand src/modules/rai-chat/incident-ops.service.spec.ts src/modules/rai-chat/tools/rai-tools.registry.spec.ts src/modules/explainability/agent-prompt-governance.service.spec.ts` — **PASS** (`25 tests`)

## Producer-side evidence

- `IncidentOpsService` tests подтверждают:
  - explicit incident status в feed/resolve lifecycle
  - autonomy/policy counters считаются отдельно
  - runbook execution пишет audit evidence
  - rollback runbook восстанавливает previous config
  - повторный runbook на не-`OPEN` incident запрещён
  - rollback runbook на не-`PROMPT_CHANGE_ROLLBACK` incident запрещён
- `RaiToolsRegistry` tests подтверждают:
  - `QUARANTINE` block создаёт autonomy incident
  - `TOOL_FIRST` forced PendingAction создаёт autonomy incident
- `AgentPromptGovernanceService` tests подтверждают:
  - prompt-change rollback path остаётся живым и пишет incident через existing governance contour

## Какие пункты production-readiness теперь можно считать закрытыми

- [x] Пишутся autonomy/policy incidents
- [x] Есть runbook/fallback action для критичных инцидентов
- [x] Governance feed показывает live incidents
- [x] Counters/governance summary учитывают autonomy/policy incidents отдельно

## Что ещё не закрыто полностью

- [ ] HTTP-level smoke по новым governance runbook endpoints не прогонялся
- [ ] UI под новые runbook actions не доработан; backend source of truth уже готов
