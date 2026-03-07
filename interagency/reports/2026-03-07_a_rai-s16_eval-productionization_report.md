# Отчёт — A_RAI S16 Eval Productionization

**Промт:** `interagency/prompts/2026-03-07_a_rai-s16_eval-productionization.md`  
**Дата:** 2026-03-07  
**Статус:** READY_FOR_REVIEW

## Изменённые файлы

- `packages/prisma-client/schema.prisma`
- `packages/prisma-client/migrations/20260307133000_eval_run_productionization/migration.sql`
- `apps/api/src/modules/rai-chat/eval/golden-test-runner.service.ts`
- `apps/api/src/modules/rai-chat/eval/golden-test-runner.service.spec.ts`
- `apps/api/src/modules/rai-chat/eval/golden-data/agronom-golden-set.json`
- `apps/api/src/modules/rai-chat/eval/golden-data/economist-golden-set.json`
- `apps/api/src/modules/rai-chat/eval/golden-data/knowledge-golden-set.json`
- `apps/api/src/modules/rai-chat/eval/golden-data/monitoring-golden-set.json`
- `apps/api/src/modules/explainability/agent-config-guard.service.ts`
- `apps/api/src/modules/explainability/agent-config-guard.service.spec.ts`
- `apps/api/src/modules/explainability/agent-prompt-governance.service.ts`
- `apps/api/src/modules/explainability/agent-prompt-governance.service.spec.ts`
- `docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_STAGE_2_CLAIMS.md`
- `interagency/INDEX.md`

## Как теперь устроен eval run contract

- Единица eval: persisted `EvalRun` на конкретный candidate change.
- В `EvalRun` теперь есть:
  - `companyId`, `changeRequestId`, `role`, `agentName`
  - `promptVersion`, `modelName`, `candidateConfig`
  - `corpusSummary`
  - `caseResults`
  - `verdict`
  - `verdictBasis`
- `corpusSummary` фиксирует:
  - `totalCases`
  - `executableCases`
  - `passed`
  - `failed`
  - `skipped`
  - `coveragePct`
  - `regressions`
- `caseResults` дают review-grade basis по каждому кейсу:
  - `caseId`
  - `status`
  - `reasons`
  - `expectedIntent`
  - `expectedTools`

## Что стало source of truth для eval evidence

- `GoldenTestRunnerService` теперь формирует не только агрегат pass/fail, но и case-level evidence с policy-driven verdict basis.
- `AgentConfigGuardService.evaluateChange()` пишет persisted `EvalRun` в БД и возвращает этот же contract наверх.
- `AgentPromptGovernanceService.createChangeRequest()` сохраняет `evalRunId` в change request и привязывает eval evidence к конкретному governed workflow.

## Семантика verdict

- `APPROVED`
  - нет failed cases
  - coverage достаточное для канонического корпуса
- `ROLLBACK`
  - есть regressions / failed cases
- `REVIEW_REQUIRED`
  - нет regressions, но coverage degraded или run недостаточно репрезентативен

Это убирает старую косметическую модель, где success/fail/degraded выглядели почти одинаково.

## Что усилено в agent-specific coverage

- `AgronomAgent`
  - multiple `tech_map_draft`
  - multiple `compute_deviations`
- `EconomistAgent`
  - `compute_plan_fact`
  - `simulate_scenario`
  - `compute_risk_assessment`
- `KnowledgeAgent`
  - несколько `query_knowledge`
- `MonitoringAgent`
  - `get_weather_forecast`
  - `emit_alerts`

Покрытие всё ещё не претендует на full product realism, но уже не выглядит pure-stub-only для текущего governance scope.

## Какие тесты доказывают productionization

- `golden-test-runner.service.spec.ts`
  - approved path возвращает corpus summary и verdict basis
  - invalid/failing case ведёт к `ROLLBACK`
  - degraded coverage ведёт к `REVIEW_REQUIRED`
  - capability/tool mismatch реально участвует в verdict
- `agent-config-guard.service.spec.ts`
  - candidate-specific eval run пишется как persisted evidence
  - degraded eval не маскируется под success path в governance gate
- `agent-prompt-governance.service.spec.ts`
  - `createChangeRequest` связывает eval evidence с `change request`

## Результаты проверок

- `pnpm --filter @rai/prisma-client run db:generate` — **PASS**
- `pnpm --filter api exec tsc --noEmit` — **PASS**
- `pnpm --filter api test -- --runInBand golden-test-runner.service.spec.ts agent-config-guard.service.spec.ts agent-prompt-governance.service.spec.ts` — **PASS**

## Вывод по claim

- После этого пакета claim `GoldenTestSet / EvalRun` можно переводить из `PARTIAL` в `CONFIRMED`.
- Основание: eval стал persisted, candidate-specific, reviewable и governance-linked quality gate, а не только локальной helper-проверкой вокруг prompt workflow.
