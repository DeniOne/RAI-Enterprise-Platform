# 2026-03-07 — Interactive Clarification Overlay Closeout Report

## Статус

DONE / APPROVED-CANDIDATE

## Что закрыто

Доведён живой reusable interaction-pattern:

- `pendingClarification`
- `workWindows[]`
- `activeWindowId`
- `context_acquisition`
- `context_hint`
- `inline / panel / takeover`
- `collapse / restore / close`
- `category / priority`
- `parentWindowId / relatedWindowIds`
- `focus_window`
- route-driven post-result actions
- `auto-resume` через тот же `POST /api/rai/chat`

Этот паттерн теперь реально работает минимум на двух agent families:

1. `Агроном-А / tech_map_draft`
2. `Экономист-А / compute_plan_fact`

## Что подтверждено кодом

### Backend

- `AgronomAgent` clarification/resume path
- `EconomistAgent` clarification/resume path
- `SupervisorAgent.planExecution()` умеет resume для:
  - `tech_map_draft`
  - `compute_plan_fact`
- `ResponseComposerService` собирает clarification/result windows для:
  - `agronomist`
  - `economist`

### Frontend

- store хранит generic `pendingClarification`
- store умеет generic `clarificationResume`
- overlay рендерит типизированные окна через общий action-driven path
- окна можно:
  - свернуть
  - восстановить
  - закрыть
- закрытие родительского окна закрывает и дочерние hint-окна

## Live evidence

### HTTP smoke

Подтверждены реальные HTTP paths:

- `POST /api/rai/chat`:
  - `agronomist` clarification
  - `agronomist` completed resume
  - `economist` clarification
  - `economist` completed resume

### Web proofs

Подтверждены:

- store auto-resume для agronomist
- store auto-resume для economist
- generic window actions
- window stack restore/close
- source/origin rendering в окнах

## Проверки

- `pnpm --filter api exec tsc --noEmit`
- `pnpm --filter web exec tsc --noEmit`
- `pnpm --filter api exec jest src/modules/rai-chat/agents/economist-agent.service.spec.ts src/modules/rai-chat/supervisor-agent.service.spec.ts test/a_rai-live-api-smoke.spec.ts --runInBand`
- `pnpm --filter web exec jest __tests__/ai-chat-store.spec.ts __tests__/context-acquisition-window.spec.tsx __tests__/context-hint-window.spec.tsx __tests__/ai-window-stack.spec.tsx --runInBand`

## Ограничения, которые ещё остаются

- это ещё не полный universal canvas для всех агентов
- `knowledge` и `monitoring` ещё не переведены на этот же clarification/window pattern
- `Agent Focus Contract / Intent Catalog / Required Context Contract / UI Action Surface Contract` ещё не стали first-class runtime contracts
- левый AI Dock ещё не доведён до полного нового канона `Header / Signals / History / Composer`

## Сухой вывод

Слой больше не является только blueprint-идеей.

Он закрыт как первый reusable Stage 2 platform pattern:

- governed
- runtime-backed
- HTTP-proven
- UI-proven
- multi-window
- auto-resumable
