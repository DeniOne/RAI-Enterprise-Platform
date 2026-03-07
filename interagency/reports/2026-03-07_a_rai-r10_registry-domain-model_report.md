# Отчёт — A_RAI R10 Registry Domain Model

**Промт:** `interagency/prompts/2026-03-07_a_rai-r10_registry-domain-model.md`  
**Дата:** 2026-03-07  
**Статус:** READY_FOR_REVIEW

## Изменённые файлы

- `apps/api/src/modules/rai-chat/agent-registry.service.ts`
- `apps/api/src/modules/rai-chat/agent-registry.service.spec.ts`
- `apps/api/src/modules/rai-chat/agent-runtime-config.service.ts`
- `apps/api/src/modules/rai-chat/agent-runtime-config.service.spec.ts`
- `apps/api/src/modules/rai-chat/rai-chat.module.ts`
- `apps/api/src/modules/explainability/agent-management.service.ts`
- `apps/api/src/modules/explainability/agent-management.service.spec.ts`
- `apps/api/src/modules/explainability/dto/agent-config.dto.ts`

## Что сделано

- Добавлен first-class доменный слой `AgentRegistryService` для канонических AI-агентов `agronomist`, `economist`, `knowledge`, `monitoring`.
- Registry теперь явно моделирует:
  - `AgentDefinition` — доменную сущность агента;
  - `runtime` policy/effective binding — модель, токены, capabilities, источник authority;
  - `AgentTenantAccess` — tenant access state (`INHERITED` / `OVERRIDE` / `DENIED`).
- `AgentRuntimeConfigService` переведён на чтение registry-domain layer вместо прямого чтения `AgentConfiguration`.
- `AgentConfiguration` перестал быть прямым runtime source of truth и используется как legacy storage/projection для построения effective registry state.
- Management API (`AgentManagementService`) теперь возвращает не только legacy `global/tenantOverrides`, но и доменный список `agents`, чтобы UI/API больше не работали как CRUD-иллюзия вокруг одной таблицы.
- Исправлено замечание техлида по мягкому authority:
  - при полном отсутствии persisted authority `AgentRegistryService.getEffectiveAgent()` возвращает `null`;
  - `catalog` больше не самовключает агент runtime-доступом;
  - legacy fallback в runtime остаётся только как явно переходный сценарий в `resolveToolAccess()`.
- Исправлено замечание техлида по role contract:
  - `role` во входном DTO зафиксирован каноническим enum `agronomist | economist | knowledge | monitoring`;
  - controller/service отвергают роли вне registry domain;
  - management read model фильтрует legacy non-canonical rows.

## Source Of Truth / Legacy

- Новый runtime source of truth: `AgentRegistryService`.
- Legacy storage: Prisma-модель `AgentConfiguration`.
- Prisma-миграций в этом шаге нет: staged-approach, authority вынесена в доменный слой поверх существующих данных без unsafe schema churn.

## Сниженный хардкод

- Убрана критичная runtime-зависимость `AgentRuntimeConfigService` от прямых Prisma lookup’ов `AgentConfiguration`.
- Authority теперь резолвится через доменный registry.
- Остаточный `TOOL_RUNTIME_MAP` пока сохраняется только как mapping `tool -> required capability/role` в execution path. Это уже не единственный source of truth по активности/tenant access агента, но полный вынос tool binding в отдельную persistable модель остаётся следующим шагом.

## Проверки

### TypeScript

- `pnpm --dir apps/api exec tsc --noEmit` — **PASS**

### Targeted Jest

- `pnpm --dir apps/api test -- --runInBand src/modules/rai-chat/agent-registry.service.spec.ts src/modules/rai-chat/agent-runtime-config.service.spec.ts src/modules/explainability/agent-management.service.spec.ts src/modules/rai-chat/tools/rai-tools.registry.spec.ts` — **PASS**
- `pnpm --dir apps/api test -- --runInBand src/modules/rai-chat/tools/rai-tools.registry.spec.ts` — **PASS** (`14/14`)

### Smoke-like execution evidence

- `rai-tools.registry.spec.ts` подтвердил реальный execution path через боевой registry:
  - `agent_disabled` блокирует `generate_tech_map_draft` до handler;
  - `capability_denied` блокирует `query_knowledge`;
  - replay/risk/autonomy guardrails не сломаны.

## Какие пункты R10 улучшены

- [x] Появился first-class registry domain для AI-агентов.
- [x] Runtime читает новую доменную модель в execution path.
- [x] `AgentConfiguration` больше не выступает прямым runtime authority.
- [x] Отсутствие persisted authority больше не даёт автоматический runtime access через catalog-default enablement.
- [x] Disable agent реально выключает поведение в runtime.
- [x] Capability narrowing реально ограничивает tool access в runtime.
- [x] Tenant access control реально enforced в runtime.
- [x] Management layer переведён поверх доменного registry read model.
- [x] API contract по `role` приведён к каноническому registry domain.

## Что ещё не закрыто полностью

- [ ] Persisted first-class tool binding entity в БД пока нет; `tool -> role/capability` всё ещё частично задаётся кодом.
- [ ] Полная Prisma-миграция `AgentConfiguration -> explicit Agent / CapabilityBinding / TenantAccess` не выполнена.
- [ ] Live API smoke для HTTP chat path в этом шаге не прогонялся; есть service-level execution evidence через `RaiToolsRegistry`.
