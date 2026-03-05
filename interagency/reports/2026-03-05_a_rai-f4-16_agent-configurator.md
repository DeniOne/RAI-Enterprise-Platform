# Отчёт — Agent Configurator & Management API (F4.16)

**Промт:** `interagency/prompts/2026-03-05_a_rai-f4-16_agent-configurator.md`  
**Дата:** 2026-03-05  
**Статус:** READY_FOR_REVIEW

## Изменённые файлы

- `packages/prisma-client/schema.prisma` — модель `AgentConfiguration` (id, name, role, systemPrompt, llmModel, maxTokens, isActive, companyId?, capabilities Json), связь `Company.agentConfigurations`
- `apps/api/src/modules/explainability/dto/agent-config.dto.ts` — DTO (UpsertAgentConfigDto, AgentConfigItemDto, AgentConfigsResponseDto)
- `apps/api/src/modules/explainability/agent-management.service.ts` — getAgentConfigs, upsertAgentConfig, toggleAgent
- `apps/api/src/modules/explainability/agent-management.service.spec.ts` — unit-тесты (merge global+tenant, capabilities, toggle)
- `apps/api/src/modules/explainability/agents-config.controller.ts` — GET/POST /rai/agents/config, PATCH /rai/agents/config/toggle (ADMIN)
- `apps/api/src/modules/explainability/explainability-panel.module.ts` — AgentsConfigController, AgentManagementService

## Реализовано

- **Prisma:** `AgentConfiguration` с unique(role, companyId); companyId null = глобальный конфиг.
- **AgentManagementService:** getAgentConfigs(companyId) — иерархия global + tenantOverrides; upsertAgentConfig(companyId, dto, scope) — tenant | global; toggleAgent(companyId, role, isActive) — создаёт override при отсутствии.
- **API:** GET /rai/agents/config (companyId из TenantContext), POST /rai/agents/config?scope=tenant|global, PATCH /rai/agents/config/toggle body { role, isActive }. Все эндпоинты под JwtAuthGuard + RolesGuard @Roles(ADMIN).

## Результаты проверок

### tsc — noEmit (apps/api)
```
PASS
```

### jest (целевые тесты)
```
PASS  agent-management.service.spec.ts  4 tests
PASS  explainability (10 suites, 42 tests)
```

## DoD

- [x] Модель Prisma создана (prisma generate работает)
- [x] CRUD API для конфигурации агентов реализован
- [x] Unit: getAgentConfigs мёржит глобальные и переопределения тенанта
- [x] Unit: upsertAgentConfig сохраняет capabilities
