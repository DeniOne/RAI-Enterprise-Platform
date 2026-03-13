# DB_COMPANY_DEROOT_DEPRECATION_PLAN

## Scope

Staged deprecation прямых `Company` relations вне business/legal core.

## Baseline and current

- baseline direct relations (`2026-03-13`): `140`
- current after phase-2 execution waves: `87`
- phase target: `<=95`

## Completed wave

Прямые `Company` relations удалены из control-plane/runtime моделей:
- `SystemIncident`
- `IncidentRunbookExecution`
- `RuntimeGovernanceEvent`
- `PerformanceMetric`
- `PendingAction`
- `AgentConfiguration`
- `AgentCapabilityBinding`
- `AgentToolBinding`
- `AgentConnectorBinding`
- `AgentConfigChangeRequest`
- `EvalRun`
- `KnowledgeNode`
- `KnowledgeEdge`

## Remaining de-root backlog (next waves)

### Wave 2: integration/control

- проверить и удалить прямые `Company` relations из integration/reliability моделей, где `companyId` уже достаточно как scope scalar.

### Wave 3: ai_runtime (non-core)

- удалить direct relation из аналитических/runtime-read моделей, где owner-domain не требует business/legal ownership.

### Wave 4: legal confirmation

- зафиксировать финальный `Company business/legal core` и запретить возврат platform-root semantics.

## Compatibility read paths

- legacy-сервисы используют `companyId` scalar filter как стабильный путь чтения;
- relation-join `include: { company: true }` вне `org_legal` запрещен policy;
- для runtime и workspace чтений использовать projection/read-model слой.

## Rollback path

- rollback не требует DDL rollback: relation removal выполнен на Prisma model-level при сохранении `companyId` scalar;
- временный rollback чтения поддерживается через `companyId` filters;
- для точечных кейсов разрешается compatibility adapter на API-layer (без возврата массовых relation edges в schema).
