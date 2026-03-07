# S19 — Quality Governance Loop Closeout

Дата: 2026-03-07
Статус: READY_FOR_REVIEW
Промт: `interagency/prompts/2026-03-07_a_rai-s19_quality-governance-loop.md`

## Что закрыто

- `Quality & Evals Panel`
  - `apps/api/src/modules/explainability/explainability-panel.service.ts` теперь считает:
    - `Acceptance Rate` из persisted advisory decisions (`ADVISORY_ACCEPTED` / `ADVISORY_REJECTED`);
    - `Correction Rate` из persisted advisory feedback (`ADVISORY_FEEDBACK_RECORDED` c `metadata.outcome = corrected`);
    - `BS%`, `Evidence Coverage`, `qualityKnownTraceCount`, `qualityPendingTraceCount`, `criticalPath`.
  - `apps/web/app/(app)/control-tower/page.tsx` показывает live `Correction Rate` или `pending`, а не synthetic fallback.

- Quality-driven autonomy loop
  - `apps/api/src/modules/rai-chat/autonomy-policy.service.ts` больше не опирается только на средний `BS%`.
  - Active unresolved `BS_DRIFT` alert теперь является fail-safe driver:
    - `QUALITY_ALERT -> QUARANTINE`
  - Статус автономности теперь возвращает driver (`QUALITY_ALERT`, `BS_AVG_*`, `NO_QUALITY_DATA`) и флаг `activeQualityAlert`.
  - Runtime enforcement остаётся в `apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts`, поэтому UI/config path не обходит autonomy restriction.

- Governance counters / incidents feed
  - `apps/api/src/modules/rai-chat/incident-ops.service.ts` теперь считает lifecycle-aware counters:
    - `openIncidents`
    - `resolvedIncidents`
    - `runbookExecutedIncidents`
    - plus existing quality/autonomy/policy breakdown
  - subtype-normalized incidents (`QUALITY_BS_DRIFT`, autonomy, policy, budget) остаются first-class в persisted feed.
  - `apps/web/app/(app)/governance/security/page.tsx` показывает live lifecycle и autonomy counters поверх persisted rows.

## Изменённые файлы

- `apps/api/src/modules/explainability/explainability-panel.service.ts`
- `apps/api/src/modules/explainability/explainability-panel.controller.ts`
- `apps/api/src/modules/explainability/dto/truthfulness-dashboard.dto.ts`
- `apps/api/src/modules/explainability/dto/autonomy-status.dto.ts`
- `apps/api/src/modules/rai-chat/autonomy-policy.service.ts`
- `apps/api/src/modules/rai-chat/incident-ops.service.ts`
- `apps/web/app/(app)/control-tower/page.tsx`
- `apps/web/app/(app)/governance/security/page.tsx`
- `apps/web/lib/api.ts`
- `apps/api/src/modules/explainability/explainability-panel.service.spec.ts`
- `apps/api/src/modules/rai-chat/autonomy-policy.service.spec.ts`
- `apps/api/src/modules/rai-chat/incident-ops.service.spec.ts`
- `docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_STAGE_2_CLAIMS.md`
- `interagency/INDEX.md`

## Claims sync

- `Quality & Evals Panel` -> `CONFIRMED`
- `Автономность регулируется по BS% и quality alerts` -> `CONFIRMED`
- `Governance counters и incidents feed реально живые` -> `CONFIRMED`

## Producer-side proof

- `apps/api/src/modules/explainability/explainability-panel.service.spec.ts`
  - live `Correction Rate` считается из persisted advisory feedback
- `apps/api/src/modules/rai-chat/autonomy-policy.service.spec.ts`
  - active `BS_DRIFT` alert форсирует `QUARANTINE`
- `apps/api/src/modules/rai-chat/incident-ops.service.spec.ts`
  - governance counters возвращают lifecycle breakdown
- `apps/api/src/modules/rai-chat/tools/rai-tools.registry.spec.ts`
  - runtime write path продолжает блокироваться при autonomy restrictions

## Проверки

- `pnpm --filter api exec tsc --noEmit` — PASS
- `pnpm --filter web exec tsc --noEmit` — PASS
- `pnpm --filter api test -- --runInBand apps/api/src/modules/explainability/explainability-panel.service.spec.ts apps/api/src/modules/rai-chat/autonomy-policy.service.spec.ts apps/api/src/modules/rai-chat/incident-ops.service.spec.ts apps/api/src/modules/rai-chat/tools/rai-tools.registry.spec.ts` — PASS

## Остаточный риск

- Structural quality-governance loop закрыт.
- Остаточный хвост теперь в основном UX-level:
  - governance UI ещё можно сделать глубже по фильтрам/аналитике;
  - но source-of-truth claims по quality metrics, autonomy driver и incidents lifecycle уже не декоративные.
