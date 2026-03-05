# Отчёт — A_RAI F2-3: Eval Quality (AgentScoreCard, GoldenTestSet, PromptChange RFC)

**Дата:** 2026-03-05  
**Промт:** `interagency/prompts/2026-03-04_a_rai-f2-3_eval-quality.md`  
**Decision-ID:** AG-ARAI-F2-003

---

## Выполнено

### 1. AgentScoreCard (схема БД и сервис)

- Модель `AgentScoreCard` добавлена в `packages/prisma-client/schema.prisma`:
  - Поля: `id`, `createdAt`, `agentName`, `promptVersion`, `modelVersion`, `periodFrom`, `periodTo`, `toolFailureRate`, `hallucinationFlagRate`, `avgConfidence`, `avgLatencyMs`, `avgTokensUsed`, `acceptanceRate`.
- `pnpm -C packages/prisma-client run db:generate` — выполнен, клиент сгенерирован.
- Создан `apps/api/src/modules/rai-chat/eval/agent-scorecard.service.ts`:
  - `saveScoreCard(data)` — запись метрик.
  - `getScoreCardByVersion(agentName, promptVersion)` — выборка по версии промта.

### 2. GoldenTestSet и EvalRun

- Директория `apps/api/src/modules/rai-chat/eval/golden-data/`, файл `agronom-golden-set.json` — 3 примера (`id`, `requestText`, `expectedIntent`, `expectedToolCalls`).
- Сервис `apps/api/src/modules/rai-chat/eval/golden-test-runner.service.ts`:
  - `runEval(agentName, testSet)` → `EvalRunResult` (passed, failed, regressions, verdict).
  - `loadGoldenSet(agentName)` — загрузка JSON для AgronomAgent.
  - Стаб-проверки: валидация структуры кейса (id, requestText, expectedToolCalls).

### 3. PromptChange RFC

- Создан `docs/00_STRATEGY/STAGE 2/PROMPT_CHANGE_RFC.md` с 6 шагами: RFC → EvalRun → Rollback-гвард (regressions > 0) → Canary rollout → 7 дней мониторинга → авто-rollback при росте rejectionRate > 5%.

### 4. Интеграция

- `AgentScoreCardService` и `GoldenTestRunnerService` зарегистрированы в `RaiChatModule` (providers).

---

## Проверки

| Проверка | Результат |
|----------|-----------|
| `prisma generate` (packages/prisma-client) | PASS |
| `tsc --noEmit` (apps/api) | PASS (exit code 0) |
| Jest: `rai-chat/eval/*.spec.ts` | 2 suites, 5 tests PASS |

---

## Изменённые файлы

- `packages/prisma-client/schema.prisma` — модель AgentScoreCard
- `apps/api/src/modules/rai-chat/eval/agent-scorecard.service.ts` (новый)
- `apps/api/src/modules/rai-chat/eval/agent-scorecard.service.spec.ts` (новый)
- `apps/api/src/modules/rai-chat/eval/golden-test-runner.service.ts` (новый)
- `apps/api/src/modules/rai-chat/eval/golden-test-runner.service.spec.ts` (новый)
- `apps/api/src/modules/rai-chat/eval/golden-data/agronom-golden-set.json` (новый)
- `docs/00_STRATEGY/STAGE 2/PROMPT_CHANGE_RFC.md` (новый)
- `apps/api/src/modules/rai-chat/rai-chat.module.ts` — добавлены провайдеры eval

---

## DoD

- [x] Модель AgentScoreCard в Prisma, типы сгенерированы
- [x] Инфраструктура GoldenTestSet и EvalRun (стаб-проверки)
- [x] Документ PROMPT_CHANGE_RFC.md
- [x] `tsc --noEmit` — PASS
- [x] Целевые тесты rai-chat/eval — PASS

**Примечание:** `db push` не выполнялся (требуется подключённая БД). Схема валидна; миграцию можно выполнить отдельно при деплое.
