# S20 — Agent Configurator Closeout

Дата: 2026-03-07
Статус: READY_FOR_REVIEW
Промт: `interagency/prompts/2026-03-07_a_rai-s20_agent-configurator-closeout.md`

## Что закрыто

- Legacy CRUD-иллюзия убрана из configurator surface:
  - `apps/web/app/(app)/control-tower/agents/page.tsx` больше не строится вокруг `global/tenantOverrides` как основной модели и не предлагает instant toggle/write path;
  - вместо этого UI читает `agents[]` как effective runtime/governed read model.

- Configurator теперь честно отражает runtime truth:
  - `runtime.source`
  - `runtime.bindingsSource`
  - `tenantAccess.mode/source`
  - `runtime.capabilities`
  - `runtime.tools`
  - `runtime.isActive`

- Write surface оставлен только governed:
  - UI создаёт только `change request`;
  - client contract в `apps/web/lib/api.ts` больше не экспортирует configurator `toggle`;
  - backend read path остаётся в `GET /rai/agents/config`, а canonical write path — только `POST /rai/agents/config/change-requests`.

## Где именно устранена legacy-семантика

- `apps/web/app/(app)/control-tower/agents/page.tsx`
  - удалён direct toggle из пользовательской поверхности;
  - редактор теперь явно маркирован как governed request, а не production edit;
  - таблица показывает effective runtime/governed state, а не только storage rows.

- `apps/web/lib/api.ts`
  - `getConfig()` теперь typed как runtime-aware `AgentConfigsResponse`;
  - configurator `toggle` удалён из client surface.

- `apps/api/src/modules/explainability/agents-config.controller.spec.ts`
  - добавлен HTTP proof, что `GET /api/rai/agents/config` отдаёт `agents[]` с effective runtime-aware полями (`source`, `bindingsSource`, `tenantAccess`).

## Изменённые файлы

- `apps/web/app/(app)/control-tower/agents/page.tsx`
- `apps/web/lib/api.ts`
- `apps/api/src/modules/explainability/agents-config.controller.spec.ts`
- `docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_STAGE_2_CLAIMS.md`
- `interagency/INDEX.md`

## Claim sync

- `Agent Configurator существует как UI + API настройки агентов` -> `CONFIRMED`

## Проверки

- `pnpm --filter api exec tsc --noEmit` — PASS
- `pnpm --filter web exec tsc --noEmit` — PASS
- `pnpm --filter api test -- --runInBand apps/api/src/modules/explainability/agents-config.controller.spec.ts apps/api/src/modules/explainability/agent-management.service.spec.ts` — PASS

## Остаточный риск

- Structural gap по configurator surface закрыт.
- Остаток теперь в основном UX-level: backend compatibility payload (`global` / `tenantOverrides`) ещё существует для обратной совместимости, но UI/control-plane больше не продаёт его как authoritative write/read truth.
