# Отчёт — A_RAI S14 Prompt Governance Closeout

**Промт:** `interagency/prompts/2026-03-07_a_rai-s14_prompt-governance-closeout.md`  
**Дата:** 2026-03-07  
**Статус:** READY_FOR_REVIEW

## Изменённые файлы

- `apps/api/src/modules/explainability/agents-config.controller.ts`
- `apps/api/src/modules/explainability/agents-config.controller.spec.ts`
- `apps/web/lib/api.ts`
- `apps/web/app/(app)/control-tower/agents/page.tsx`
- `docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_STAGE_2_CLAIMS.md`
- `interagency/INDEX.md`

## Канонические API/controller paths

- `GET /rai/agents/config` — read model registry/config surface.
- `POST /rai/agents/config/change-requests` — создать governed change request вместо direct production write.
- `POST /rai/agents/config/change-requests/:changeId/canary/start` — запустить canary.
- `POST /rai/agents/config/change-requests/:changeId/canary/review` — зафиксировать canary verdict.
- `POST /rai/agents/config/change-requests/:changeId/promote` — выполнить production promotion только после approved canary.
- `POST /rai/agents/config/change-requests/:changeId/rollback` — выполнить governed rollback.

## Какие legacy semantics убраны

- Убран misleading write-like endpoint `POST /rai/agents/config`; он больше не выглядит как разрешённый direct production config write path.
- `apps/web/lib/api.ts` переведён с `upsertConfig()` на `createChangeRequest()`.
- `apps/web/app/(app)/control-tower/agents/page.tsx` больше не продаёт editing surface как authoritative CRUD; тексты, CTA и scope labels отражают `change request -> canary -> promotion`.

## Какие integration/smoke tests добавлены

- `apps/api/src/modules/explainability/agents-config.controller.spec.ts`
  - `POST /api/rai/agents/config/change-requests` создаёт governed change request через реальный HTTP/controller entry point.
  - `POST /api/rai/agents/config/change-requests/:id/canary/review` подтверждает degraded canary path с outcome `ROLLED_BACK`.
  - `POST /api/rai/agents/config/change-requests/:id/promote` не даёт tenant-bypass: чужой tenant получает `404`.
  - `POST /api/rai/agents/config` подтверждён как отсутствующий legacy write path (`404`).

## Результаты проверок

- `pnpm --filter api exec tsc --noEmit` — **PASS**
- `pnpm --filter api test -- --runInBand agents-config.controller.spec.ts` — **PASS**
- `pnpm --filter api test -- --runInBand agents-config.controller.spec.ts agent-management.service.spec.ts agent-prompt-governance.service.spec.ts` — **PASS**

## Вывод по claim

- После этого пакета claim `PromptChange RFC` можно переводить из `PARTIAL` в `CONFIRMED`.
- Основание: workflow подтверждён не только service-level unit-тестами, но и controller-level HTTP contract proof; control-plane API/UI больше не маскируют governed path под direct config CRUD.
