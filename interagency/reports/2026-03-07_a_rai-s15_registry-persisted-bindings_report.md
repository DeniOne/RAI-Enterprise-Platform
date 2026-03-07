# Отчёт — A_RAI S15 Registry Persisted Bindings

**Промт:** `interagency/prompts/2026-03-07_a_rai-s15_registry-persisted-bindings.md`  
**Дата:** 2026-03-07  
**Статус:** READY_FOR_REVIEW

## Изменённые файлы

- `packages/prisma-client/schema.prisma`
- `packages/prisma-client/migrations/20260307124500_agent_registry_persisted_bindings/migration.sql`
- `apps/api/src/modules/rai-chat/agent-registry.service.ts`
- `apps/api/src/modules/rai-chat/agent-runtime-config.service.ts`
- `apps/api/src/modules/explainability/dto/agent-config.dto.ts`
- `apps/api/src/modules/explainability/agent-management.service.ts`
- `apps/api/src/modules/rai-chat/agent-registry.service.spec.ts`
- `apps/api/src/modules/rai-chat/agent-runtime-config.service.spec.ts`
- `apps/api/src/modules/rai-chat/tools/rai-tools.registry.spec.ts`
- `apps/api/src/modules/explainability/agent-management.service.spec.ts`
- `docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_STAGE_2_CLAIMS.md`
- `interagency/INDEX.md`

## Новая persisted bindings-модель

- `AgentCapabilityBinding`
  - first-class persisted mapping `role -> capability -> company scope`
  - поддерживает global и tenant scope через `companyId`
  - может явно включать/выключать binding через `isEnabled`
- `AgentToolBinding`
  - first-class persisted mapping `role -> toolName -> company scope`
  - используется как runtime authority для tool access
  - поддерживает tenant-specific override/deny через tenant rows

## Что перестало зависеть от хардкода

- `AgentRuntimeConfigService.resolveToolAccess()` больше не использует `TOOL_RUNTIME_MAP` как primary source of truth.
- Runtime теперь находит владельца tool через effective registry entries, построенные `AgentRegistryService` из persisted bindings.
- Для governed tools включён deny-by-default: если persisted owner/binding отсутствует, доступ блокируется.
- Остаточный bootstrap оставлен только как backward-safe fallback для legacy registry данных и для неговерненных built-in инструментов; он явно маркируется `bindingsSource: "bootstrap"` и покрыт тестом.

## Какие миграции добавлены и зачем

- `packages/prisma-client/migrations/20260307124500_agent_registry_persisted_bindings/migration.sql`
  - добавляет таблицы `agent_capability_bindings` и `agent_tool_bindings`
  - вводит unique/index constraints по `(role, capability/toolName, companyId)`
  - связывает tenant rows с `companies`
  - backward-safe смысл: legacy bootstrap остаётся только как совместимость для старых данных и неговерненных built-in paths, но governed tools больше не получают implicit allow без binding

## Как bindings попадают в source of truth

- Governed promotion и restore в `AgentManagementService` теперь синхронизируют persisted bindings:
  - capabilities записываются в `AgentCapabilityBinding`
  - tool bindings записываются в `AgentToolBinding` как явная authority-модель
  - sync использует explicit `tools` из change payload, существующие persisted bindings или bootstrap only как legacy fallback, а не безусловный дефолтный набор роли
- На sync пишется audit event `AGENT_BINDINGS_SYNCED`

## Какие тесты доказывают persisted authority

- `agent-registry.service.spec.ts`
  - registry строит effective entries из persisted capability/tool bindings
  - tenant deny продолжает работать поверх persisted bindings
- `agent-runtime-config.service.spec.ts`
  - persisted tool binding разрешает tool
  - отсутствие persisted owner/binding для governed tool ведёт к deny-by-default
  - неговерненный built-in tool не ломается без registry owner
- `rai-tools.registry.spec.ts`
  - execution path по-прежнему блокирует disabled agent / missing capability до handler
  - risk/autonomy gating не сломаны
- `agent-management.service.spec.ts`
  - governed promotion синхронизирует persisted capability/tool bindings

## Результаты проверок

- `pnpm --filter @rai/prisma-client run db:generate` — **PASS**
- `pnpm --filter api exec tsc --noEmit` — **PASS**
- `pnpm --filter api test -- --runInBand agent-registry.service.spec.ts agent-runtime-config.service.spec.ts rai-tools.registry.spec.ts agent-management.service.spec.ts` — **PASS**

## Вывод по claim

- После этого пакета claim `Phase 4.6 полноценный registry-модуль` можно поднять из `PARTIAL` в `CONFIRMED`.
- Причина: mapping `agent -> capabilities/tools` больше существует как persisted first-class authority и реально участвует в runtime execution path, а не живёт только в derived/hardcoded convention layer.
