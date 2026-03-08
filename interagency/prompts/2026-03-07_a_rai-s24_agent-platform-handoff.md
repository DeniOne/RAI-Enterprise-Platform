# 2026-03-07 — RAI Agent Platform Handoff Memo

## Что уже сделано

- Введён канонический kernel-слой для agent platform:
  - `AgentDefinition`
  - `AgentRuntimeProfile`
  - `AgentAutonomyMode`
  - `AgentMemoryPolicy`
  - `AgentCapabilityPolicy`
  - `AgentConnectorBinding`
  - `AgentOutputContract`
  - `AgentExecutionRequest`
  - `AgentExecutionResult`
- Добавлен OpenRouter-first gateway и централизованная prompt assembly.
- Runtime переведён в `agent-first-hybrid` path с feature-flag:
  - `RAI_AGENT_RUNTIME_MODE=agent-first-hybrid`
- 4 reference agents реально работают на live `/api/rai/chat`:
  - `agronomist`
  - `economist`
  - `knowledge`
  - `monitoring`
- Исправлены live gaps:
  - bootstrap fallback для пустой `agent_configurations`
  - `AUTH_DISABLED=true` теперь даёт dev user с ролью `ADMIN`
  - runtime/build/start path для `apps/api`
  - missing local DB tables для kernel/config-change/eval persistence
- Explainability/config surface расширен:
  - `GET /api/rai/agents/config`
  - `GET /api/rai/agents/onboarding/templates`
  - `POST /api/rai/agents/onboarding/validate`
  - governed config change workflow
- Future-agent onboarding уже работает для non-canonical role:
  - `marketer` проходит
    - `onboarding/validate`
    - `eval`
    - `config/change-requests`
    - `canary/start`
    - `canary/review`
    - `promote`
  - после promote виден в `tenantOverrides`
  - `executionAdapterRole` теперь обязателен для future role и валидируется в onboarding manifest
- Runtime dispatch вынесен из hardcoded `if/else` в adapter layer:
  - `apps/api/src/modules/rai-chat/runtime/agent-execution-adapter.service.ts`
- Future role теперь реально исполняется через `/api/rai/chat` без новой hardcoded ветки:
  - kernel/runtime profile несёт `executionAdapterRole`
  - registry/kernel resolution собирает non-canonical effective kernel
  - `marketer -> knowledge` подтверждён в runtime, governance и control-plane HTTP proofs
- Control-plane/read model теперь показывает future role как effective `agents[]` entry:
  - `marketer` виден не только в `tenantOverrides`, но и в registry-aware read model
  - `GET /api/rai/agents/config` возвращает `kernel.runtimeProfile.executionAdapterRole`

## Что подтверждено live smoke

- `/api/rai/chat`:
  - `knowledge` no-hit path возвращает controlled uncertainty
  - `economist` даёт AI-backed ответ с evidence
  - `economist` без scope-контекста отдаёт governed clarification overlay payload для `plan-fact`
  - `economist` resume-path после добора `seasonId` возвращает completed result windows
  - `agronomist` корректно даёт governed missing-context response
  - `agronomist` resume-path после добора `fieldRef + seasonRef` возвращает completed result windows
  - `monitoring` даёт governed AI-backed summarization
  - `marketer` реально исполняется через adapter binding и возвращает governed response
- `/api/rai/agents/onboarding/templates` возвращает 7 шаблонов:
  - `marketer`
  - `strategist`
  - `finance_advisor`
  - `legal_advisor`
  - `crm_agent`
  - `controller`
  - `personal_assistant`
- `/api/rai/agents/config` показывает `marketer`:
  - в `tenantOverrides`
  - в effective `agents[]`
  - с `kernel.runtimeProfile.executionAdapterRole`

## Что осталось следующим шагом

Главный уже закрытый слой:

- future role теперь:
  - валидируется,
  - проходит eval/canary/promote,
  - persist-ится,
  - исполняется через `/api/rai/chat`,
  - виден в effective control-plane read model.

Следующий шаг в новом чате:

1. Зафиксировать, что `Agent Focus Contract / Intent Catalog / Required Context Contract / UI Action Surface Contract` уже действуют как runtime-backed platform layer для 4 canonical families:
   - `agronomist / tech_map_draft`
   - `economist / compute_plan_fact`
   - `knowledge / query_knowledge`
   - `monitoring / emit_alerts`
2. Дальше двигаться уже не по interaction-blueprint, а по следующему слою платформы:
   - non-canonical/future roles поверх того же contract-layer
   - расширение intent catalog beyond reference agents
3. Зафиксировать owner-ы, rollout gates и P0 blockers в readiness/master-plan документах.

## Ключевые файлы

- `apps/api/src/modules/rai-chat/agent-platform/agent-platform.types.ts`
- `apps/api/src/modules/rai-chat/agent-platform/agent-platform.defaults.ts`
- `apps/api/src/modules/rai-chat/agent-platform/openrouter-gateway.service.ts`
- `apps/api/src/modules/rai-chat/agent-platform/agent-prompt-assembly.service.ts`
- `apps/api/src/modules/rai-chat/agent-registry.service.ts`
- `apps/api/src/modules/rai-chat/agent-runtime-config.service.ts`
- `apps/api/src/modules/rai-chat/runtime/agent-runtime.service.ts`
- `apps/api/src/modules/rai-chat/runtime/agent-execution-adapter.service.ts`
- `apps/api/src/modules/explainability/agent-management.service.ts`
- `apps/api/src/modules/explainability/agent-prompt-governance.service.ts`
- `apps/api/src/modules/explainability/agents-config.controller.ts`
- `apps/api/src/modules/explainability/dto/agent-config.dto.ts`
- `packages/prisma-client/schema.prisma`

## Проверки, которые уже проходили

- `pnpm --filter api exec tsc --noEmit`
- `pnpm --filter api build`
- `pnpm --filter web exec tsc --noEmit`
- targeted jest suites по:
  - runtime
  - supervisor
  - explainability config management
  - prompt governance
  - onboarding templates/validation
  - live `/api/rai/chat` future-role smoke
  - live `/api/rai/chat` economist clarification + completed resume smoke
  - live `/api/rai/chat` agronomist clarification + completed resume smoke
  - `/api/rai/agents/config` HTTP proof for `executionAdapterRole`

## Важно для нового чата

- Не записывать OpenRouter ключ в репозиторий.
- Локальная БД уже потребовала ручного применения части существующих migration SQL, потому что `_prisma_migrations` не был baseline-нут.
- Не откатывать пользовательские изменения в `memory-bank/TRACELOG.md`.
