---
id: DOC-EXE-BRANCH-TRUST-GATE-IMPLEMENTATION-SPRINT-20260321
layer: Execution
type: Phase Plan
status: draft
version: 0.1.14
owners: [@techlead]
last_updated: 2026-03-21
claim_id: CLAIM-EXE-BRANCH-TRUST-GATE-IMPLEMENTATION-SPRINT-20260321
claim_status: asserted
verified_by: manual
last_verified: 2026-03-21
evidence_refs: docs/07_EXECUTION/SEMANTIC_INGRESS_AND_GOVERNED_HANDOFF_PHASE_PLAN.md;docs/00_STRATEGY/STAGE 2/RAI_AI_ANTIHALLUCINATION_ARCHITECTURE.md;docs/00_STRATEGY/STAGE 2/RAI_AGENT_RUNTIME_GOVERNANCE.md;apps/api/src/modules/rai-chat/supervisor-agent.service.ts;apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts;apps/api/src/modules/rai-chat/supervisor-forensics.service.ts;apps/api/src/modules/rai-chat/truthfulness-engine.service.ts;apps/api/src/modules/rai-chat/truthfulness-engine.service.spec.ts;apps/api/src/modules/rai-chat/composer/response-composer.service.ts;apps/api/src/modules/rai-chat/composer/response-composer.service.spec.ts;apps/api/src/modules/rai-chat/trace-summary.service.ts;apps/api/src/modules/rai-chat/trace-summary.service.spec.ts;apps/api/src/modules/rai-chat/runtime-governance/runtime-governance-policy.service.ts;apps/api/src/modules/rai-chat/runtime-governance/runtime-governance-policy.service.spec.ts;apps/api/src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts;apps/api/src/modules/rai-chat/eval/branch-trust.eval.spec.ts;apps/api/src/modules/explainability/explainability-panel.service.ts;apps/api/src/modules/explainability/explainability-panel.service.spec.ts;apps/api/src/modules/explainability/dto/trace-summary.dto.ts;apps/api/src/modules/explainability/dto/trace-forensics.dto.ts;apps/api/src/modules/explainability/dto/truthfulness-dashboard.dto.ts;apps/api/src/shared/rai-chat/rai-chat.dto.ts;apps/api/src/modules/rai-chat/agent-platform/agent-platform.types.ts;apps/api/src/shared/rai-chat/branch-trust.types.ts;apps/web/lib/api.ts;apps/web/app/(app)/control-tower/page.tsx;apps/web/app/(app)/control-tower/trace/[traceId]/page.tsx;apps/web/__tests__/control-tower-page.spec.tsx;apps/web/__tests__/control-tower-trace-page.spec.tsx;packages/prisma-client/schema.prisma
---
# Branch Trust Gate Implementation Sprint Plan

## CLAIM
id: CLAIM-EXE-BRANCH-TRUST-GATE-IMPLEMENTATION-SPRINT-20260321
status: asserted
verified_by: manual
last_verified: 2026-03-21

## 0. Цель спринта

Этот sprint document превращает архитектурный блок `Branch Trust Gate` из phase-plan в исполнимый пакет работ.

Целевой результат спринта:

- branch-results от агентов типизированы одинаково;
- оркестратор присваивает каждой ветке trust verdict;
- composer не выдаёт сомнительные ветки за подтверждённый факт;
- telemetry показывает, сколько веток было `VERIFIED / PARTIAL / UNVERIFIED / CONFLICTED / REJECTED`;
- trust-проверка укладывается в согласованный latency budget.

Эффект спринта:

- anti-hallucination контур становится рабочим runtime-механизмом, а не только архитектурной идеей;
- сложные multi-source ответы начинают быть проверяемыми;
- команда получает понятные PR-срезы вместо абстрактной “большой задачи”.

## 1. Границы спринта

Входит в этот спринт:

- shared contracts для branch-trust слоя;
- branch-level trust assessment;
- selective cross-check path;
- user-facing composition rules;
- telemetry и governance для trust-path;
- unit/integration/eval покрытие для первого аналитического сценария.

Не входит в этот спринт:

- полный рефактор всего semantic ingress;
- массовая миграция всех доменов;
- universal second-pass verifier на каждый branch;
- production rollout новых trust-rules на все slice без selective enablement.

## 2. Канонический результат спринта

После завершения спринта система должна уметь пройти такой путь:

```text
multi-source question
  -> owner-agent + supporting branches
  -> typed branch JSON payloads
  -> branch trust assessment
  -> selective cross-check при low trust / conflict
  -> composer по branch verdict
  -> honest user-facing answer
```

Базовый демонстрационный сценарий:

`Покажи сколько было вылито селитры на поле 2 у Казьминский и сколько это стоило`

Ожидаемый эффект:

- агро-факт и финансовая стоимость собираются как два branch-result;
- конфликт между источниками не скрывается;
- ответ остаётся человеком понятным, но строится из проверенных branch verdict.

## 3. PR-срезы

## 3.1 PR A — Shared Contracts и branch trust types

### Scope

Создать и зафиксировать единый contract-layer для branch trust.

### Файлы

- новый shared contract file в `apps/api/src/shared/rai-chat/`
- [agent-platform.types.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/agent-platform/agent-platform.types.ts)
- [rai-chat.dto.ts](/root/RAI_EP/apps/api/src/shared/rai-chat/rai-chat.dto.ts)

### Изменения

- ввести типы:
  - `BranchResultContract`
  - `BranchTrustAssessment`
  - `BranchVerdict`
- закрепить обязательные поля:
  - `scope`
  - `derived_from`
  - `evidence_refs`
  - `assumptions`
  - `data_gaps`
  - `freshness`
  - `confidence`
- развести:
  - raw branch result
  - trust assessment
  - user-facing composition payload

### Checklist

- [x] типы добавлены в shared layer
- [x] `AgentExecutionResult` умеет нести branch trust артефакты
- [x] branch contract не конфликтует с текущим `structuredOutput`
- [x] базовые DTO проходят типизацию и сборку

### Acceptance

- есть один канонический набор branch trust типов;
- новые типы не требуют повторного изобретения полей в `SupervisorAgent` и `Composer`.

### Ожидаемый эффект

- trust-layer получает общий язык данных;
- снижается риск schema drift между агентами, оркестратором и UI.

## 3.2 PR B — `TruthfulnessEngine` как reusable branch-trust input layer

### Scope

Расширить текущий truthfulness-контур так, чтобы он давал reusable inputs для branch-level trust.

### Файлы

- [truthfulness-engine.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/truthfulness-engine.service.ts)
- [truthfulness-engine.service.spec.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/truthfulness-engine.service.spec.ts)

### Изменения

- выделить helper-слой:
  - `classifyBranchEvidence(...)`
  - `buildBranchTrustInputs(...)`
  - `resolveEvidenceStatus(...)`
- сохранить current trace-level расчёт:
  - `bsScorePct`
  - `evidenceCoveragePct`
  - `invalidClaimsPct`
- перестать держать `TruthfulnessEngine` только как post-trace scoring utility

### Checklist

- [x] evidence classification вынесена в reusable методы
- [x] branch-level inputs можно использовать без ожидания full trace summary
- [x] trace-level scoring остаётся совместимым с текущим runtime
- [x] существующие truthfulness-тесты не деградируют

### Acceptance

- один и тот же evidence-канон используется и для branch trust, и для trace quality;
- нет дублирующих классификаторов "доверия" в соседних слоях.

### Ожидаемый эффект

- текущая логика доверия не выбрасывается, а становится фундаментом inline verification;
- anti-hallucination контур становится архитектурно цельнее.

## 3.3 PR C — `SupervisorAgent` как orchestrator trust gate

### Scope

Вставить first-class trust stage в orchestration spine.

### Файлы

- [supervisor-agent.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/supervisor-agent.service.ts)
- [supervisor-agent.service.spec.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts)

### Изменения

- добавить явную стадию `branch trust assessment` между execution и composer
- перевести текущий скрытый cross-check в типизированный selective path
- запускать cross-check только при:
  - `low-trust`
  - `UNVERIFIED`
  - `CONFLICTED`
  - explicit high-risk policy
- агрегировать branch verdict в orchestration result

### Checklist

- [x] trust stage встроен в основной orchestration path
- [x] happy path не получает обязательный second-pass
- [x] cross-check не запускается без trust signal
- [x] branch verdictы передаются дальше в composer и telemetry

### Acceptance

- `SupervisorAgent` явно управляет trust-переходом;
- trust cross-check перестаёт быть неявным побочным поведением.

### Ожидаемый эффект

- оркестратор начинает принимать решение не только “что ответить”, но и “каким branch-данным можно доверять”.

## 3.4 PR D — `ResponseComposer` и honest composition rules

### Scope

Перевести финальную композицию ответа на branch verdict rules.

### Файлы

- [response-composer.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/composer/response-composer.service.ts)
- [response-composer.service.spec.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/composer/response-composer.service.spec.ts)

### Изменения

- запретить composer выдавать `UNVERIFIED / CONFLICTED / REJECTED` как подтверждённый факт
- добавить user-facing шаблоны для:
  - confirmed fact
  - partial fact with limitations
  - conflict disclosure
  - insufficient evidence
- строить финальный ответ из branch verdict и typed facts, а не из summary prose branch-ов

### Checklist

- [x] composer видит branch verdict
- [x] `PARTIAL` всегда сопровождается disclosure ограничений
- [x] `CONFLICTED` приводит к честному описанию расхождения
- [x] подтверждённый факт собирается только из разрешённых веток

### Acceptance

- пользователь больше не получает гладкий ответ поверх конфликтующих или неподтверждённых branch-данных.

### Ожидаемый эффект

- качество и честность финального ответа становятся заметно выше для пользователя;
- explainability ответа улучшается без ручного forensic-разбора.

## 3.5 PR E — Telemetry, governance и eval closure

### Scope

Добавить наблюдаемость и управляемость trust-path.

### Файлы

- [trace-summary.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/trace-summary.service.ts)
- [runtime-governance-policy.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/runtime-governance/runtime-governance-policy.service.ts)
- [runtime-governance-policy.types.ts](/root/RAI_EP/apps/api/src/shared/rai-chat/runtime-governance-policy.types.ts)
- integration/eval тесты runtime-контура

### Изменения

- добавить trust telemetry:
  - `verifiedBranchCount`
  - `partialBranchCount`
  - `unverifiedBranchCount`
  - `conflictedBranchCount`
  - `rejectedBranchCount`
- вести latency accounting для trust-gate path
- закрепить budgets:
  - `happy path`: `100-300 ms`
  - `multi-source read`: `300-800 ms`
  - `cross-check triggered`: `1000-1500 ms`
- подготовить explainability/read-model к отображению branch verdict

### Checklist

- [x] trace summary умеет хранить trust-агрегаты
- [x] governance policy умеет хранить trust/latency budget
- [x] есть integration coverage для multi-source trust flow
- [x] есть eval corpus для conflict disclosure и selective cross-check

### Acceptance

- trust-path наблюдаем и измерим;
- performance tradeoff между скоростью и достоверностью фиксируется не в чате, а в telemetry.

### Ожидаемый эффект

- команда сможет управлять safety-контуром через данные, а не через ощущения;
- product/runtime не скатится в always-on медленный verifier.

## 3.6 Пост-спринтовое замыкание UI/read-model слоя

### Scope

Довести trust telemetry до реально потребляемого explainability/UI слоя.

### Файлы

- [truthfulness-dashboard.dto.ts](/root/RAI_EP/apps/api/src/modules/explainability/dto/truthfulness-dashboard.dto.ts)
- [explainability-panel.service.ts](/root/RAI_EP/apps/api/src/modules/explainability/explainability-panel.service.ts)
- [api.ts](/root/RAI_EP/apps/web/lib/api.ts)
- [page.tsx](/root/RAI_EP/apps/web/app/(app)/control-tower/page.tsx)
- [page.tsx](/root/RAI_EP/apps/web/app/(app)/control-tower/trace/[traceId]/page.tsx)

### Изменения

- добавить в `dashboard` read-model агрегированный `branchTrust` блок:
  - verdict counts
  - `known/pending` trace coverage
  - `cross-check` trace count
  - budget compliance и latency aggregates
- вывести trust aggregates в `Control Tower`
- вывести trust summary и branch verdict cards в trace forensics page
- зафиксировать новый consumer-layer тестами `web`

### Checklist

- [x] `dashboard` read-model отдаёт `branchTrust` aggregates
- [x] `Control Tower` показывает trust counts, budget compliance и trust latency
- [x] trace forensics page показывает trust summary и verdict cards
- [x] web tests подтверждают rendering trust consumption-layer

### Acceptance

- trust telemetry видна оператору без чтения raw JSON;
- explainability показывает не только persisted поля, но и понятный verdict surface;
- post-sprint closure закрывает реальное потребление trust-path в UI.

## 3.7 Пост-спринтовый tenant-facing `AI chat / work windows` слой

### Файлы

- [response-composer.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/composer/response-composer.service.ts)
- [response-composer.service.spec.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/composer/response-composer.service.spec.ts)
- [rai-chat.dto.ts](/root/RAI_EP/apps/api/src/shared/rai-chat/rai-chat.dto.ts)
- [ai-chat-store.ts](/root/RAI_EP/apps/web/lib/stores/ai-chat-store.ts)
- [ai-work-window-types.ts](/root/RAI_EP/apps/web/components/ai-chat/ai-work-window-types.ts)
- [AiChatPanel.tsx](/root/RAI_EP/apps/web/components/ai-chat/AiChatPanel.tsx)
- [ai-chat-store.spec.ts](/root/RAI_EP/apps/web/__tests__/ai-chat-store.spec.ts)
- [ai-signals-strip.spec.tsx](/root/RAI_EP/apps/web/__tests__/ai-signals-strip.spec.tsx)
- [structured-result-window.spec.tsx](/root/RAI_EP/apps/web/__tests__/structured-result-window.spec.tsx)

### Изменения

- перевести `ResponseComposer` на canonical trust windows/signal payload с intent `branch_trust_summary`
- расширить `RaiWorkWindowDto` под backend trust window intent
- оставить в `ai-chat-store` только fallback-генерацию trust windows для backward compatibility
- вывести verdict/disclosure в assistant bubble, `signals strip` и `work windows`
- закрыть прежний `web tsc` drift в `ai-chat-store` и его tests тем же пакетом

### Checklist

- [x] `ResponseComposer` возвращает canonical trust windows и signals в составе chat response
- [x] `ai-chat-store` не дублирует backend trust windows и оставляет только fallback-path
- [x] assistant bubble показывает verdict/disclosure без ухода в `Control Tower`
- [x] `pnpm --filter api exec tsc --noEmit --pretty false`, targeted composer spec, `pnpm --filter web exec tsc --noEmit --pretty false` и targeted `jest` подтверждают новый chat trust layer

### Acceptance

- пользователь видит подтверждённость ответа в `AI chat`, а не только в explainability/operator UI;
- trust surface приходит как canonical backend payload и не зависит от одного web-клиента;
- web-клиент перестаёт терять trust verdict между chat response и work-window UI.

## 3.8 Post-sprint first-class `trustSummary` contract

### Файлы

- [branch-trust.types.ts](/root/RAI_EP/apps/api/src/shared/rai-chat/branch-trust.types.ts)
- [rai-chat.dto.ts](/root/RAI_EP/apps/api/src/shared/rai-chat/rai-chat.dto.ts)
- [response-composer.service.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/composer/response-composer.service.ts)
- [response-composer.service.spec.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/composer/response-composer.service.spec.ts)
- [ai-chat-store.ts](/root/RAI_EP/apps/web/lib/stores/ai-chat-store.ts)
- [api.ts](/root/RAI_EP/apps/web/lib/api.ts)
- [ai-chat-store.spec.ts](/root/RAI_EP/apps/web/__tests__/ai-chat-store.spec.ts)

### Изменения

- ввести shared user-facing contract `UserFacingTrustSummary` рядом с branch trust типами
- добавить `trustSummary` в `RaiChatResponseDto` как first-class backend field
- перевести `ResponseComposer` на canonical backend-generation `trustSummary`
- поднять `trustSummary` и chat-response shape в typed client contracts `apps/web/lib/api.ts`
- перевести `ai-chat-store` на приоритет backend `trustSummary` с branch-derived fallback только для backward compatibility
- закрепить тестами приоритет backend summary над локальной агрегацией

### Checklist

- [x] `UserFacingTrustSummary` добавлен в shared contract-layer
- [x] `RaiChatResponseDto` возвращает `trustSummary` как first-class поле
- [x] `ResponseComposer` строит canonical backend `trustSummary`
- [x] `apps/web/lib/api.ts` экспортирует typed `RaiChatResponseDto` и `UserFacingTrustSummaryDto` для trust consumer-слоя
- [x] `ai-chat-store` использует backend `trustSummary` как основной источник и оставляет fallback только для старого payload
- [x] `pnpm --filter api exec jest --runInBand src/modules/rai-chat/composer/response-composer.service.spec.ts`, `pnpm --filter api exec tsc --noEmit --pretty false`, `pnpm --filter web exec jest --runInBand __tests__/ai-chat-store.spec.ts __tests__/ai-signals-strip.spec.tsx __tests__/structured-result-window.spec.tsx` и `pnpm --filter web exec tsc --noEmit --pretty false` подтверждают новый summary-контракт

### Acceptance

- assistant bubble, work windows и следующие клиенты читают один backend summary-контракт вместо повторной локальной агрегации;
- trust verdict/disclosure не расходятся между разными consumer-слоями;
- compile-time типы `api.ts` и store используют один DTO-язык для `trustSummary`, поэтому `web` не маскирует drift через `unknown`;
- backward compatibility сохраняется для payload, где `trustSummary` ещё отсутствует.

## 3.9 Post-sprint chat transport consolidation

### Файлы

- [api.ts](/root/RAI_EP/apps/web/lib/api.ts)
- [ai-chat-store.ts](/root/RAI_EP/apps/web/lib/stores/ai-chat-store.ts)
- [ai-chat-store.spec.ts](/root/RAI_EP/apps/web/__tests__/ai-chat-store.spec.ts)

### Изменения

- вынести transport для `/api/rai/chat` в общий typed helper внутри `apps/web/lib/api.ts`
- перенести в этот helper формирование `Idempotency-Key` и HTTP error normalization
- перевести `ai-chat-store` на использование общего chat client helper вместо локального `fetch/json` path
- сохранить текущий `/api/rai/chat` endpoint, abort semantics и test-visible request contract без runtime drift

### Checklist

- [x] `apps/web/lib/api.ts` экспортирует typed helper для `/api/rai/chat`
- [x] `ai-chat-store` больше не дублирует `fetch/json/idempotency` path
- [x] request contract `POST /api/rai/chat` остаётся совместимым по URL, body и `Idempotency-Key`
- [x] `pnpm --filter web exec jest --runInBand __tests__/ai-chat-store.spec.ts __tests__/ai-signals-strip.spec.tsx __tests__/structured-result-window.spec.tsx` и `pnpm --filter web exec tsc --noEmit --pretty false` подтверждают transport consolidation

### Acceptance

- chat transport и chat DTO живут в одном client-layer;
- store остаётся state/orchestration слоем, а не локальным HTTP client;
- следующие изменения chat API больше не требуют дублировать transport-логику в store.

## 3.10 Post-sprint chat response adapter extraction

### Файлы

- [rai-chat-response-adapter.ts](/root/RAI_EP/apps/web/lib/rai-chat-response-adapter.ts)
- [api.ts](/root/RAI_EP/apps/web/lib/api.ts)
- [ai-chat-store.ts](/root/RAI_EP/apps/web/lib/stores/ai-chat-store.ts)
- [ai-chat-store.spec.ts](/root/RAI_EP/apps/web/__tests__/ai-chat-store.spec.ts)

### Изменения

- вынести post-processing `/api/rai/chat` в shared adapter рядом с `apps/web/lib/api.ts`
- перенести в adapter:
  - legacy widget migration
  - trust window derivation
  - trust summary normalization
  - pending clarification hydration
- перевести `ai-chat-store` на использование adapter вместо inline response-логики
- сохранить текущий runtime behavior `AI chat` без изменения user-facing surface

### Checklist

- [x] создан shared adapter `apps/web/lib/rai-chat-response-adapter.ts`
- [x] `ai-chat-store` использует adapter вместо inline response post-processing
- [x] trust summary, trust windows и pending clarification продолжают собираться через один shared path
- [x] `pnpm --filter web exec jest --runInBand __tests__/ai-chat-store.spec.ts __tests__/ai-signals-strip.spec.tsx __tests__/structured-result-window.spec.tsx` и `pnpm --filter web exec tsc --noEmit --pretty false` подтверждают extraction без регрессии

### Acceptance

- store перестаёт быть единственным местом, где живёт chat-response adaptation;
- response logic переиспользуема для следующих client surfaces и тестов;
- извлечение не ломает текущий `AI chat` UX и backward-compatible fallback path.

## 3.11 Post-sprint chat response state reducer extraction

### Файлы

- [rai-chat-response-state.ts](/root/RAI_EP/apps/web/lib/rai-chat-response-state.ts)
- [ai-chat-store.ts](/root/RAI_EP/apps/web/lib/stores/ai-chat-store.ts)
- [ai-chat-store.spec.ts](/root/RAI_EP/apps/web/__tests__/ai-chat-store.spec.ts)

### Изменения

- вынести `resolveResponseWorkWindows(...)`, `resolveResponseActiveWindowId(...)` и `resolveResponseCollapsedWindowIds(...)` в shared response-state reducer
- держать в этом же state-layer `pickPreferredWorkWindow(...)` и signal derivation для response application path
- перевести `submitRequest(...)` и смежные window transitions в store на shared reducer/helper’ы
- сохранить текущие `AI chat` state transitions без regressions в active window, collapsed windows и signals

### Checklist

- [x] создан shared reducer `apps/web/lib/rai-chat-response-state.ts`
- [x] `ai-chat-store` использует shared reducer в `submitRequest(...)`
- [x] window resolution и signal derivation больше не дублируются как локальный response path внутри store
- [x] `pnpm --filter web exec jest --runInBand __tests__/ai-chat-store.spec.ts __tests__/ai-signals-strip.spec.tsx __tests__/structured-result-window.spec.tsx` и `pnpm --filter web exec tsc --noEmit --pretty false` подтверждают extraction без регрессии

### Acceptance

- response-application semantics живут в shared state-layer, а не только в zustand-store;
- store становится ближе к чистому orchestration/state shell;
- дальнейшие изменения active window / collapsed windows / signals не требуют редактировать один большой `submitRequest(...)`.

## 4. Тестовый пакет

## 4.1 Unit tests

Файлы:

- [truthfulness-engine.service.spec.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/truthfulness-engine.service.spec.ts)
- [supervisor-agent.service.spec.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts)
- [response-composer.service.spec.ts](/root/RAI_EP/apps/api/src/modules/rai-chat/composer/response-composer.service.spec.ts)

Проверки:

- evidence без `sourceId` не становится `VERIFIED`
- высокий `confidence` без evidence не делает branch подтверждённым фактом
- happy path не запускает скрытый cross-check
- low-trust и conflict запускают selective trust path
- composer не скрывает `CONFLICTED`
- `PARTIAL` идёт с ограничениями, а не как confirmed fact

Ожидаемый эффект:

- базовые trust rules получают регрессионную защиту.

## 4.2 Integration tests

Файлы:

- `apps/api/src/modules/rai-chat/runtime/runtime-spine.integration.spec.ts`
- `apps/api/src/modules/rai-chat/rai-chat.service.spec.ts`
- `apps/api/src/modules/rai-chat/eval/branch-trust.eval.spec.ts`

Проверки:

- multi-source запрос идёт через branch `JSON payload`
- конфликт `agro` vs `finance` не маскируется composer-ом
- `UNVERIFIED` ветка не превращается в user-facing факт
- trust telemetry попадает в trace summary
- selective cross-check остаётся выборочным и подтверждается eval corpus

Ожидаемый эффект:

- branch trust gate подтверждается на реальном orchestration path, а не только в isolated unit-тестах.

## 4.3 Eval corpus

Стартовые фразы:

- `Покажи сколько было вылито селитры на поле 2 у Казьминский и сколько это стоило`
- `Сколько потратили на КАС по полю 5 и сколько фактически внесли`
- `Покажи факт по обработке поля и финансовый итог`

Обязательные группы:

- `multi-source analytical question`
- `branch conflict disclosure`
- `trust cross-check selective triggering`

Ожидаемый эффект:

- trust-layer начнёт измеряться на реальных пользовательских вопросах.

## 5. Порядок внедрения

Порядок PR:

1. `PR A` — shared contracts
2. `PR B` — truthfulness inputs
3. `PR C` — supervisor trust gate
4. `PR D` — composer rules
5. `PR E` — telemetry/governance/eval

Правило внедрения:

- не начинать `PR C`, пока не стабилизирован contract-layer из `PR A`;
- не включать composer trust-rules без branch verdict contract;
- не считать sprint завершённым без integration/eval closure из `PR E`.

Ожидаемый эффект:

- внедрение идёт от типов и инвариантов к orchestration и presentation;
- снижается риск расползания изменений по runtime без общего каркаса.

## 6. Sprint DoD

Спринт считается завершённым, когда:

- PR `A/B/C/D/E` реализованы и слиты в правильном порядке;
- branch verdict присутствует в orchestration result;
- composer не выдаёт неподтверждённую ветку как установленный факт;
- trust telemetry видна в trace summary;
- latency budget зафиксирован тестами и telemetry;
- multi-source сценарий `agro execution fact -> finance cost aggregation` проходит как regression case.

### 6.1 Текущее состояние на 2026-03-21

- `Sprint DoD` выполнен: PR `A/B/C/D/E` и пост-спринтовые пакеты `3.6-3.11` доведены до рабочего кода и подтверждены тестами/сборкой.
- Trust-path закрыт до consumer-layer:
  - `Control Tower`
  - trace forensics
  - tenant-facing `AI chat`
  - canonical `trustSummary`
  - shared chat transport, response adapter и response-state reducer
- Вне границ этого sprint остаются уже не trust-пакеты, а следующий macro-tranche phase-plan: `Semantic Ingress Frame`, ingress-owner и `semantic-first` orchestration.
