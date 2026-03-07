# Отчёт — A_RAI R12 Prompt Governance Reality

**Промт:** `interagency/prompts/2026-03-07_a_rai-r12_prompt-governance-reality.md`  
**Дата:** 2026-03-07  
**Статус:** READY_FOR_REVIEW

## Изменённые файлы

- `packages/prisma-client/schema.prisma`
- `apps/api/src/modules/rai-chat/eval/golden-test-runner.service.ts`
- `apps/api/src/modules/rai-chat/eval/golden-data/economist-golden-set.json`
- `apps/api/src/modules/rai-chat/eval/golden-data/knowledge-golden-set.json`
- `apps/api/src/modules/rai-chat/eval/golden-data/monitoring-golden-set.json`
- `apps/api/src/modules/explainability/agent-config-guard.service.ts`
- `apps/api/src/modules/adaptive-learning/services/canary.service.ts`
- `apps/api/src/modules/explainability/dto/agent-config.dto.ts`
- `apps/api/src/modules/explainability/agent-management.service.ts`
- `apps/api/src/modules/explainability/agents-config.controller.ts`
- `apps/api/src/modules/explainability/explainability-panel.module.ts`
- `apps/api/src/modules/explainability/agent-prompt-governance.service.ts`
- `apps/api/src/modules/explainability/agent-prompt-governance.service.spec.ts`
- `apps/api/src/modules/explainability/agent-management.service.spec.ts`

## Что было декоративным и чем заменено

- Было:
  - `PromptChange RFC` существовал как документ и набор разрозненных кусков;
  - `POST /rai/agents/config` напрямую писал production config;
  - canary/rollback жили отдельно от agent prompt/config workflow;
  - `GoldenTestSet` был по сути agronom/router-centric и слабо agent-aware.
- Стало:
  - введён единый backend workflow `change request -> eval verdict -> canary start -> canary review -> promote / rollback`;
  - production activation больше не идёт через прямой config write из controller;
  - production activation больше не доступен через публичный service-level write в management service;
  - `toggle true` как обход activation path заблокирован;
  - `GoldenTestRunnerService` переведён с router-centric smoke на agent/candidate-specific eval logic.

## Канонический workflow / state machine

- Persisted state: Prisma-модель `AgentConfigChangeRequest`
- Ключевые состояния:
  - `EVAL_FAILED`
  - `READY_FOR_CANARY`
  - `CANARY_ACTIVE`
  - `APPROVED_FOR_PRODUCTION`
  - `PROMOTED`
  - `ROLLED_BACK`
- Обязательный путь safe evolution:
  1. `POST /rai/agents/config` создаёт change request, считает `targetVersion`, запускает eval и пишет audit trail
  2. Только `READY_FOR_CANARY` может перейти в `CANARY_ACTIVE`
  3. `canary review` либо переводит change в `APPROVED_FOR_PRODUCTION`, либо в `ROLLED_BACK` и при наличии model record уводит модель в `QUARANTINED`
  4. Только `APPROVED_FOR_PRODUCTION` может быть promoted в production config
  5. После promote доступен явный rollback с восстановлением previous snapshot

## Что теперь обязательно для activation

- Прямой `POST /rai/agents/config` больше не активирует боевой config; он создаёт governed change request.
- `toggleAgent(..., true)` больше не включает агента напрямую и возвращает блокировку с требованием пройти `eval -> canary -> promote`.
- `AgentManagementService.upsertAgentConfig()` больше не пишет production config и возвращает блокировку.
- Production write в `AgentConfiguration` происходит только через `AgentPromptGovernanceService.promoteApprovedChange()` -> `AgentManagementService.applyPromotedAgentConfig()`.

## Source Of Truth

- Source of truth для safe evolution workflow: `AgentConfigChangeRequest` + `AgentPromptGovernanceService`
- Source of truth для production runtime config: `AgentConfiguration`, но только после governed promotion
- `AgentConfigGuardService` теперь используется как eval/quarantine gate внутри workflow, а не как единственный декоративный фильтр
- `AgentConfigGuardService.evaluateChange()` теперь передаёт в eval сам candidate (`role`, `promptVersion`, `modelName`, `maxTokens`, `capabilities`, `isActive`)

## Проверки

### Prisma Client

- `pnpm prisma:generate` — **PASS**
- `pnpm prisma:build-client` — **PASS**

### TypeScript

- `pnpm --dir apps/api exec tsc --noEmit` — **PASS**

### Targeted Jest

- `pnpm --dir apps/api test -- --runInBand src/modules/explainability/agent-prompt-governance.service.spec.ts src/modules/rai-chat/eval/golden-test-runner.service.spec.ts src/modules/explainability/agent-management.service.spec.ts` — **PASS**

### Producer-side evidence

- `AgentPromptGovernanceService` tests подтверждают:
  - config change без approved eval получает `EVAL_FAILED` и `REJECTED`
  - canary degradation ведёт к `ROLLED_BACK` и quarantine outcome
  - approved change проходит controlled activation path до `PROMOTED`
- `AgentManagementService` test подтверждает:
  - direct enable blocked, требуется governed workflow
  - direct service-level production write через `upsertAgentConfig()` заблокирован
- `GoldenTestRunnerService` tests подтверждают:
  - eval candidate без required capability получает `ROLLBACK`
  - eval больше не зависит от `IntentRouter.classify()` и проверяет agent-specific capability/budget/activation constraints

## Какие подпункты R12 теперь закрыты

- [x] Есть единый backend workflow safe evolution для agent prompt/model/config changes
- [x] Изменение config/prompt/model не активируется в production в обход eval verdict
- [x] Canary/rollback участвуют в workflow исполняемо
- [x] `GoldenTestSet` / `EvalRun` стали agent-aware для канонического scope
- [x] Есть audit evidence на critical transitions workflow
- [x] Есть producer-side тесты на approve/block/rollback path

## Что ещё не закрыто полностью

- [ ] HTTP-level smoke по новым governance endpoints не прогонялся
- [ ] Нет отдельной UI-интеграции под новый workflow; backend path готов, UI ещё должен на него перейти
