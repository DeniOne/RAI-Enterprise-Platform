# S17 — Control Tower Honesty

Дата: 2026-03-07
Статус: READY_FOR_REVIEW
Промт: `interagency/prompts/2026-03-07_a_rai-s17_control-tower-honesty.md`

## Что закрыто

- `Evidence Tagging` доведён до persisted audit trail:
  - `apps/api/src/modules/rai-chat/supervisor-agent.service.ts` теперь пишет `response.evidence` в `AiAuditEntry.metadata.evidence`;
  - forensic/dashboard path читает этот persisted trail через `apps/api/src/modules/explainability/explainability-panel.service.ts`.
- `BS%` и `Evidence Coverage` теперь feed’ят observability из живой persisted цепочки:
  - `apps/api/src/modules/rai-chat/truthfulness-engine.service.ts` читает `AiAuditEntry.metadata.evidence`;
  - при отсутствии evidence больше не рисуются synthetic `0/100`, а возвращаются `null` + `qualityStatus = PENDING_EVIDENCE`;
  - `apps/api/src/modules/rai-chat/trace-summary.service.ts` принимает nullable quality-поля без декоративной подмены.
- `Control Tower` больше не врёт по quality surface:
  - `apps/api/src/modules/explainability/explainability-panel.service.ts` считает средние только по ready traces;
  - API отдаёт `qualityKnownTraceCount`, `qualityPendingTraceCount`, `criticalPath`, `acceptanceRate`, nullable `correctionRate`;
  - `apps/web/app/(app)/control-tower/page.tsx` показывает `pending`/`N/A`, а не synthetic значения.
- Добавлена минимально достаточная `critical path visibility`:
  - backend строит top critical phases из persisted forensic phases;
  - UI выводит отдельный блок `Critical Path Visibility`.

## Что сознательно не перезаявлено

- `Correction Rate` не подделывается и остаётся `null/N/A`, потому что отдельный live source пока не инструментирован.
- `queue/backpressure visibility` этой задачей не закрывалась и в отчёте не продаётся как реализованная.
- `Quality & Evals Panel` остаётся `PARTIAL` именно из-за отсутствия live `Correction Rate`, хотя quality spine и critical path уже честные.

## Изменённые файлы

- `apps/api/src/modules/rai-chat/truthfulness-engine.service.ts`
- `apps/api/src/modules/rai-chat/trace-summary.service.ts`
- `apps/api/src/modules/explainability/dto/truthfulness-dashboard.dto.ts`
- `apps/api/src/modules/explainability/explainability-panel.service.ts`
- `apps/web/app/(app)/control-tower/page.tsx`
- `apps/api/src/modules/rai-chat/truthfulness-engine.service.spec.ts`
- `apps/api/src/modules/explainability/explainability-panel.service.spec.ts`
- `apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts`
- `docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_STAGE_2_CLAIMS.md`
- `interagency/INDEX.md`

## Claims sync

- `Evidence Tagging` -> `CONFIRMED`
- `BS%` -> `CONFIRMED`
- `Quality & Evals Panel` -> остаётся `PARTIAL`, но теперь частичность честная и явно объяснена

## Проверки

- `pnpm --filter api exec tsc --noEmit` — PASS
- `pnpm --filter web exec tsc --noEmit` — PASS
- `pnpm --filter api test -- --runInBand apps/api/src/modules/rai-chat/truthfulness-engine.service.spec.ts apps/api/src/modules/explainability/explainability-panel.service.spec.ts apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts` — PASS

## Риск после задачи

Главный structural risk по evidence/truthfulness снят: control tower больше не маскирует отсутствие evidence synthetic quality-числами. Остаточный риск теперь уже локальный и явный: пока нет отдельного source of truth для `Correction Rate`, quality panel остаётся неполной, но не лживой.
