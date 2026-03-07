# REPORT — A_RAI S21 Runtime Spine Integration Proof

Дата: 2026-03-07
Промт: `interagency/prompts/2026-03-07_a_rai-s21_runtime-spine-integration.md`
Статус: READY_FOR_REVIEW

## Что сделано

- Добавлен интеграционный suite [runtime-spine.integration.spec.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts), который поднимает реальный execution spine:
  - `SupervisorAgent`
  - `MemoryCoordinatorService`
  - `AgentRuntimeService`
  - `RaiToolsRegistry`
  - `AgentRegistryService`
  - `AgentRuntimeConfigService`
  - `BudgetControllerService`
  - `TraceSummaryService`
  - `IncidentOpsService`
- Harness использует in-memory Prisma mock только как persistence layer. Оркестрация, budget/runtime authority, governed registry checks, audit/trace side effects и response composition проходят через реальные сервисы.
- Обновлён production-readiness gate: пункт `Есть integration tests на runtime spine` поднят в `[x]`.

## Почему этот harness честный

- Точка входа во всех сценариях — `SupervisorAgent.orchestrate(...)`, а не прямой вызов отдельного сервиса.
- `SupervisorAgent` реально вызывает `AgentRuntimeService.run(...)`, который:
  - читает budget authority через `BudgetControllerService`;
  - использует `RaiToolsRegistry.execute(...)`;
  - возвращает `runtimeBudget` в response path.
- `RaiToolsRegistry` реально читает effective governed state через `AgentRuntimeConfigService` + `AgentRegistryService`.
- `TraceSummaryService` и `AiAuditEntry` пишут side effects в persistence mock после реального runtime path.

## Доказанные сценарии

### 1. Happy path

- `Supervisor -> Runtime -> Registry -> Audit/Trace`.
- Инструмент `compute_deviations` реально исполняется через `AgroToolsRegistry`.
- Проверено:
  - tenant context доезжает до доменного сервиса (`companyId` из trusted context);
  - создаётся `TraceSummary`;
  - создаётся `AiAuditEntry`;
  - forensic phases присутствуют в audit metadata.

### 2. Guarded path: budget deny

- Для `agronomist` лимит `maxTokens` принудительно снижен ниже стоимости `generate_tech_map_draft`.
- `AgentRuntimeService` останавливает execution до вызова tool handler.
- Проверено:
  - доменный WRITE handler не вызывается;
  - response содержит `runtimeBudget.outcome = DENY`;
  - пишется budget incident (`BUDGET_RUNTIME_DENIED`);
  - audit/trace side effects всё равно сохраняются.

### 3. Governed runtime path

- Persisted tool binding для `knowledge -> query_knowledge` выключен.
- `RaiToolsRegistry` блокирует tool по effective registry state до исполнения handler.
- Проверено:
  - runtime возвращает `agentConfigBlocked`;
  - `AiAuditEntry` и `TraceSummary` всё равно формируются;
  - блокировка идёт через governed runtime authority, а не через ad-hoc мок.

## Изменённые файлы

- [runtime-spine.integration.spec.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts)
- [A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md](/root/RAI_EP/docs/00_STRATEGY/STAGE%202/A_RAI_MULTIAGENT_PRODUCTION_READINESS_CHECKLIST.md)
- [interagency/INDEX.md](/root/RAI_EP/interagency/INDEX.md)
- [2026-03-07_a_rai-s21_runtime-spine-integration_report.md](/root/RAI_EP/interagency/reports/2026-03-07_a_rai-s21_runtime-spine-integration_report.md)

## Верификация

### `tsc --noEmit`

PASS (`pnpm --filter api exec tsc --noEmit`)

### Targeted jest

PASS (`CI=1 pnpm --filter api test -- --runInBand --detectOpenHandles src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts`)

Результат:

```text
PASS src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts
  Runtime spine integration
    ✓ проходит happy-path через Supervisor -> Runtime -> Registry -> Audit/Trace
    ✓ останавливает runtime на budget deny, не исполняет tool и пишет incident + audit/trace
    ✓ учитывает effective registry state и блокирует tool до исполнения handler
```

## Вывод по readiness-gate

Пункт `Есть integration tests на runtime spine` теперь можно честно считать закрытым: появился таргетированный integration proof на канонический путь `Supervisor -> Runtime -> Registry/Governance/Budget/Policy -> Audit/Trace`, а не ещё один набор изолированных unit tests.
