---
id: DOC-ARV-FRONTEND-AUDIT-2026-03-16-CHECKLIST-TRUTH--9PGE
layer: Archive
type: Research
status: archived
version: 0.1.0
---
# CHECKLIST TRUTH RESET REPORT

Дата: 2026-03-18
Область: `STAGE_3_AGENT_DELEGATION_IMPLEMENTATION_PLAN.md` + `GENERAL_REMEDIATION_EXECUTION_CHECKLIST.md`
Критерий done: строго `код + проверка + артефакт`.

## 1) Что изменено

- Выполнен массовый Truth Reset по frontend-чеклисту: все пункты переведены в `[ ]` до появления полного evidence.
- В Stage 3 после reset повторно закрыты только подтверждённые пункты:
  - `TalkToAgent pool` (полная регистрация `TalkTo*` + governance checks)
  - `Sub-Agent Adapter` (delegation chain + usage aggregation)
  - `RBAC для инструментов связи` (role matrix + deny-by-default на governed tools)
  - `System Prompts JSON-Only` (prompt-level JSON contract + runtime enforcement)
  - `Presenter profiles` (Legal/Marketer как text-generation roles)
  - `Response Composer` (synthesis по `structuredOutputs[]`)
  - `Trust Score pipeline` (trust assessment + hidden knowledge cross-check)
  - `Token Metrics before/after` (отдельный reproducible benchmark report)
  - `UI промежуточные шаги делегации` (`intermediateSteps` -> user-facing work window)
  - `Stage 3 e2e test stand` (cross-domain scenario in API + UI smoke)
- Все снятия зафиксированы в ledger: `docs/00_STRATEGY/STAGE 2/CHECKLIST_EVIDENCE_LEDGER.md`.

## 2) Сводка статусов после reset

- Stage 3 checklist: `[x]=13`, `[ ]=0`.
- Frontend remediation checklist: `[x]=0`, `[ ]=175`.

## 3) Приоритизация долга (по влиянию)

1. **P0: Frontend checklist evidence automation**
Эффект закрытия: фронтовый чеклист снова сможет закрываться фактами из CI, без ручной «договорной» зелени.

2. **P1: Закрепить full `src/modules/rai-chat` прогон в CI как обязательный gate**
Эффект закрытия: предотвращает silent regressions в runtime orchestration при будущих изменениях.

## 4) Текущие подтверждённые gaps

- Открытых пунктов в Stage 3 чеклисте после повторной верификации не осталось.
- Публичный before/after артефакт выпущен: `docs/00_STRATEGY/STAGE 2/STAGE_3_TOKEN_METRICS_BEFORE_AFTER_2026-03-18.md`.
- User-facing делегация подтверждена: `intermediateSteps` отображаются в UI, покрыто тестом.

## 5) Артефакты проверки

- Type-check: `pnpm -C apps/api exec tsc -p tsconfig.json --noEmit`.
- Targeted unit suites:
  - `runtime/agent-runtime.service.spec.ts`
  - `agent-platform/agent-prompt-assembly.service.spec.ts`
  - `__tests__/ai-chat-store.spec.ts`
  - `tools/rai-tools.registry.spec.ts`
  - `intent-router/intent-router.service.spec.ts`
  - `supervisor-agent.service.spec.ts`
  - `supervisor-forensics.service.spec.ts`
  - `composer/response-composer.service.spec.ts`
  - `agent-runtime-config.service.spec.ts`
- Full rai-chat contour:
  - `pnpm -C apps/api test -- --runInBand src/modules/rai-chat`
  - Текущий статус: `PASS` (`57/57` suites, `311/311` tests).

## 6) Статус тестовых расхождений

- Закрыты регрессии по Stage 3 delegation:
  - read-only `tech_map` запросы не форсят draft-intent;
  - `TalkTo*` покрыты role-matrix и deny-by-default governance;
  - `data_scientist` path не выполняется без explicit tool-call intent;
  - runtime агрегирует usage по delegation chain и нормализует `structuredOutputs`.
