# 2026-03-07 — Closeout: RAI Agent Interaction Blueprint

Статус: закрыто как реализованный Stage 2 interaction canon.

## Что считается закрытым

- постоянный левый `AI Dock`;
- история чатов и `Новый чат`;
- compact IDE-like shell композиция;
- unified `workWindows[]` protocol;
- migration `legacy widgets[] -> workWindows[]`;
- typed window families:
  - `context_acquisition`
  - `context_hint`
  - `structured_result`
  - `related_signals`
  - `comparison`
- режимы:
  - `inline`
  - `panel`
  - `takeover`
- window graph:
  - `parentWindowId`
  - `relatedWindowIds`
  - `focus_window`
- `collapse / restore / close / pin`;
- managed clarification loop;
- auto-resume;
- richer post-result actions;
- first-class contract-backed interaction semantics для 4 canonical families.

## Что подтверждено кодом и тестами

- `agronomist / tech_map_draft`
- `economist / compute_plan_fact`
- `knowledge / query_knowledge`
- `monitoring / emit_alerts`

## Доказательства

- backend typecheck:
  - `pnpm --filter api exec tsc --noEmit`
- frontend typecheck:
  - `pnpm --filter web exec tsc --noEmit`
- targeted backend specs:
  - `agent-interaction-contracts.spec.ts`
  - `supervisor-agent.service.spec.ts`
- live HTTP smoke:
  - `test/a_rai-live-api-smoke.spec.ts`
- targeted web specs:
  - `ai-chat-store.spec.ts`
  - `context-acquisition-window.spec.tsx`
  - `context-hint-window.spec.tsx`
  - `ai-window-stack.spec.tsx`
  - `structured-result-window.spec.tsx`
  - `related-signals-window.spec.tsx`
  - `comparison-window.spec.tsx`

## Что является следующим слоем после закрытия blueprint

- расширение contract-layer на future/non-canonical roles;
- platform-wide `Intent Catalog` beyond reference families;
- перенос следующего класса guided interactions в новые domain agents.
