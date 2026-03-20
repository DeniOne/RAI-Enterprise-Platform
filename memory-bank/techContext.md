# Tech Context: RAI_EP

## Routing Learning Layer (2026-03-20)
- Канонический routing-контракт вынесен в `apps/api/src/shared/rai-chat/semantic-routing.types.ts`.
- Versioning routing-решений теперь живёт в `routing-versioning.ts`: `routerVersion`, `promptVersion`, `toolsetVersion`, `workspaceStateDigest`.
- Sanitized routing telemetry пишется в `AiAuditEntry.metadata.routingTelemetry`; отдельный Prisma-store на этой волне не вводился.
- `SupervisorAgent` использует `shadow-first` подход, но для slice `agro.techmaps.list-open-create` допускает `semantic_router_primary`.
- Coarse capability gating применён через `AgentExecutionRequest.semanticRouting.enforceCapabilityGating`.
- Explainability читает divergence напрямую из `AiAuditEntry.metadata` и отдаёт его через `/api/rai/explainability/routing/divergence`.
- `Control Tower` получает routing divergence данные без доступа к raw workspace payload.
- Для `techmaps` добавлен fixture-driven eval corpus `apps/api/src/modules/rai-chat/semantic-router/fixtures/techmaps-routing-eval-corpus.json`.
- Новый локальный и CI gate: `pnpm gate:routing:techmaps` -> `apps/api test:routing:techmaps` -> `semantic-router.eval.spec.ts`.
- `routing/divergence` дополнительно агрегирует `agentBreakdown` по `targetRole`, включая `divergenceRatePct`, `decisionBreakdown` и `topMismatchKinds`.
- `routing/divergence` дополнительно агрегирует `failureClusters` по `targetRole + decisionType + mismatchKinds` и рассчитывает `caseMemoryReadiness`.
- `routing/divergence` дополнительно агрегирует `caseMemoryCandidates` по version-aware ключу `sliceId + targetRole + decisionType + mismatchKinds + routerVersion + promptVersion + toolsetVersion`.
- TTL для `caseMemoryCandidates` рассчитывается на read-model слое от `lastSeenAt`; отдельный persistence-store по-прежнему не введён.
- Capture для `caseMemoryCandidates` реализован через append-only `AuditLog`: endpoint `POST /api/rai/explainability/routing/case-memory-candidates/capture` создаёт событие `ROUTING_CASE_MEMORY_CANDIDATE_CAPTURED`, а divergence read-model возвращает `captureStatus`, `capturedAt`, `captureAuditLogId`.
- Runtime retrieval для routing case memory реализован через `apps/api/src/modules/rai-chat/semantic-router/routing-case-memory.service.ts`; source of truth остаётся `AuditLog`, отдельный store всё ещё не вводится.
- Lifecycle кейса теперь двухшаговый: `captured` (`ROUTING_CASE_MEMORY_CANDIDATE_CAPTURED`) -> `active` (`ROUTING_CASE_MEMORY_CASE_ACTIVATED`).
- `SemanticRouterService` использует case memory только как bounded low-risk слой: safe override разрешён для read-only `navigate/clarify`, write-path не активируется из памяти кейсов автоматически.
- Официальный quality gate `pnpm gate:routing:techmaps` теперь покрывает не только corpus eval, но и `case_memory_safe_override` плюс negative write-guard.
- Второй bounded slice `agro.deviations.review` включён через тот же контур: primary promotion разрешён только в `workspaceRoute` вида `/consulting/deviations*`, а вне него `compute_deviations` остаётся в `shadow`.
- `SemanticRouterService.resolveSliceId()` теперь приоритизирует явный `deviations`-контур выше общего `techmaps/field` сигнала, чтобы `field` в контексте страницы отклонений не уводил маршрут в чужой slice.
- `AgentExecutionAdapterService.resolveAgronomIntent()` теперь умеет сохранять `semantic_router_primary` для agronomist-интентов; раньше этот execution-path затирался в `tool_call_primary`.
- Третий bounded slice `finance.plan-fact.read` включён через тот же контур: primary promotion разрешён только для `plan-fact` сигналов внутри `/consulting/yield` и `/finance`, а вне него `compute_plan_fact` остаётся в `shadow`.
- `SemanticRouterService.resolveSliceId()` теперь приоритизирует `deviations`, затем `plan-fact`, и только потом общий `techmaps/field`, чтобы страница `/consulting/yield` с активными `techmap/field` ref не уводила routing в чужой slice.
- Для `plan-fact` введён first-class entity `RoutingEntity.PlanFact`; LLM structured-output prompt синхронизирован с новым entity.
- Четвёртый finance-wave расширил контракт ещё двумя entity: `RoutingEntity.Scenario` и `RoutingEntity.RiskAssessment`.
- `SemanticRouterService.resolveSliceId()` теперь приоритизирует finance-подсрезы как `scenario -> risk_assessment -> plan_fact`, чтобы `yield/finance` не смешивал сценарное моделирование, оценку риска и plan-fact в один intent.
- `scenario/risk` primary promotion ограничен `yield/finance`-контуром, но outside-slice shadow остаётся доступен по явным finance-сигналам в тексте.
- `RoutingCaseMemoryService.inferSliceId(route, message)` теперь различает `finance.scenario.analysis`, `finance.risk.analysis` и `finance.plan-fact.read`, поэтому case-memory retrieval не сливает разные finance-подсрезы в одну память кейсов.
- `AgentExecutionAdapterService.resolveEconomistIntent()` и `resolveEconomistToolName()` теперь берут intent сначала из `allowedToolCalls`, затем из `semanticRouting.routeDecision.eligibleTools/sliceId`, и только потом падают в bounded текстовый fallback.
- Следующий non-finance slice `crm.account.workspace-review` включён как bounded read-only contour для `review_account_workspace`.
- `RoutingEntity` расширен значением `account`; `SemanticRouterService` использует для CRM-карточки контракт `domain=crm`, `entity=account`, `action=open`, `mutationRisk=safe_read`.
- Primary promotion для CRM workspace review ограничен route-space `/parties | /consulting/crm | /crm`; вне него остаётся только `shadow`.
- `AgentExecutionAdapterService` и `CrmAgent` теперь поддерживают `query` как first-class вход для `review_account_workspace`, а не только `accountId`.
- Источник извлечения `query` унифицирован через `extractCrmWorkspaceQuery(...)` в `execution-adapter-heuristics.ts`; этот же паттерн использует semantic-router для build/requestedToolCalls.
- `RoutingCaseMemoryService.inferSliceId(route, message)` теперь умеет возвращать `crm.account.workspace-review`, не смешивая CRM-карточку с finance/agro retrieval.
- Канонический routing gate теперь `pnpm gate:routing:primary-slices`; `pnpm gate:routing:agro-slices` и `pnpm gate:routing:techmaps` оставлены как совместимые алиасы.
- Добавлен bounded read-only slice `contracts.registry-review` для `list_commerce_contracts` и `review_commerce_contract`.
- Primary promotion для `contracts.registry-review` ограничен route-space `/commerce/contracts`; вне него contracts read-only контур остаётся вне primary-cutover.
- `ContractsAgentInput` расширен полем `query`; payload `GetCommerceContract` и schema `getCommerceContractSchema` теперь принимают `contractId` или `query`.
- `ContractsToolsRegistry` реализует safe read-only lookup по `contractId`, `number`, quoted query и `party legalName`, без расширения write-surface.
- `AgentExecutionAdapterService` теперь резолвит contracts-intent сначала из `semanticRouting.routeDecision.eligibleTools`, а потом уже из fallback-эвристик.
- `detectContractsIntent()` различает `list` и `review`, поэтому фразы вида `покажи договор DOG-001` больше не уходят в `list_commerce_contracts`.
- Дополнительно ужесточён CRM read-only detector: generic `карточка` больше не активирует `crm.account.workspace-review` поверх `contracts` без CRM-route или сильного CRM-сигнала.
- Добавлен bounded read-only slice `knowledge.base.query` для `query_knowledge`.
- Primary promotion для `knowledge.base.query` ограничен route-space `/knowledge*`; вне него knowledge-вопросы остаются только в `shadow`, чтобы не размывать междоменный routing.
- `SemanticRouterService.resolveSliceId()` теперь приоритизирует `knowledge` выше `scenario/risk/crm/contracts/plan-fact/techmaps`, поэтому вопросы внутри knowledge-модуля не утягиваются обратно в phrase-bound доменные контуры.
- Внутри `/knowledge*` knowledge-route получает приоритет над `techmaps` phrase-match: вопрос `как составить техкарту по рапсу` трактуется как `QueryKnowledge`, а не как `GenerateTechMapDraft`.
- `collectToolIdentifiers()`, `buildDialogState()`, `resolveIntentFromCaseMemory()` и `resolveCaseMemoryCandidateLabel()` синхронизированы с `knowledge.base.query`; `RoutingCaseMemoryService.inferSliceId()` теперь понимает `/knowledge`.
- Добавлен bounded read-only slice `crm.counterparty.lookup` для `lookup_counterparty_by_inn`; primary promotion ограничен CRM route-space `/parties | /consulting/crm | /crm`.
- `SemanticRouterService` теперь обрабатывает фразы `по ИНН` без номера как `clarify` внутри `crm.counterparty.lookup`, не смешивая их с `crm.account.workspace-review`.
- `AgentExecutionAdapterService.resolveCrmIntent()` сначала использует explicit/semantic routing (`eligibleTools`, `sliceId`) и только потом fallback-эвристики; для `lookup_counterparty_by_inn` добавлен fallback-добор `inn` из текста.
- Добавлен bounded read-only slice `contracts.ar-balance.review` для `review_ar_balance`; внутри `/commerce/contracts` он отделён от `contracts.registry-review`, чтобы AR-запросы не смешивались с карточкой/реестром договора.
- `SemanticRouterService` для `contracts.ar-balance.review` использует deterministic `execute|clarify`: при `invoiceId` вызывает `GetArBalance`, при пустом контексте возвращает `requiredContextMissing = [invoiceId]`.
- `AgentExecutionAdapterService.resolveContractsIntent()` теперь поддерживает semantic-priority путь `GetArBalance -> review_ar_balance` через `eligibleTools` и `sliceId`.
- `pnpm gate:routing:primary-slices` теперь покрывает уже десять fixture-наборов: `techmaps`, `deviations`, `plan-fact`, `scenario`, `risk`, `crm-workspace`, `contracts`, `knowledge`, `crm-inn-lookup`, `contracts-ar-balance`.
- Для всех новых текстовых артефактов по этому контуру действует `LANGUAGE_POLICY.md`.

## Stack
- **Backend Core**: TypeScript, Node.js (на базе BusinessCore).
- **Database**: PostgreSQL (через Prisma ORM).
- **Architecture**: Domain-Driven Design (DDD) + Clean Architecture principles.
- **Modules**: `TaskModule`, `AgroOrchestratorModule`, `TechMapModule`, `CmrModule`, `HrModule`, `FinanceEconomyModule`
 - **Key Services**: `TaskService`, `AgroOrchestratorService`, `EconomyService`, `FinanceService`, `BudgetService`
- **Interfaces**: 
  - Telegram Bot API (Standalone Microservice: `apps/telegram-bot`).
  - NestJS (Backend API: `apps/api`).
  - Next.js (Web Dashboard: `apps/web`).
- **Auth Flow**: 
  - JWT-based 2FA via Telegram (Polling Session Model).
  - Cross-domain auth via `auth_token` cookies.

## Infrastructure
- **Deployment**: Docker-compose (локально/стейджинг).
- **Documentation**: Markdown-based Canon.
- **Agent Environment**: Antigravity IDE (Windows).

## Global Rules
- **Formatting**: Git-style markdown.
- **Language Policy**: Russian (mandatory) + expressive vocabulary.
- **UI Density Canon**: Приоритет плотности данных над пустотой. Использование `text-[9px]` для метаданных, минимизация `py/px`, обязательное поднятие важного контента выше линии сгиба.
- **Terminology Rule**: Запрет на "тяжелый" банковский жаргон. Термины должны быть понятны операционным менеджерам (СБ, Реестр, Проверка).

## Data Consistency & Isolation
- **Tenant Isolation (10/10)**: 
  - Реализована на уровне `PrismaService` через `$extends` и прозрачный `Proxy`.
  - Все запросы к `tenantScopedModels` (например, `agroEventDraft`) автоматически фильтруются по `companyId` из контекста.
  - Поле `companyId` является обязательным для всех моделей, требующих изоляции.
  - Прямой доступ к нефильтрованным данным разрешен только через флаг `isSystem` в контексте.
- **Client Generation**:
  - Каноническая генерация клиента: `pnpm db:client` из корня.
  - Все модели автоматически типизированы и доступны через `this.prisma.<modelName>`.
- **Party/Account Canon (2026-03-16)**:
  - `Party` = master data для контрагента (`registrationData`, директор, банковские реквизиты, структура).
  - `Account` = operational CRM/agro projection.
  - Жёсткий Prisma FK не вводится; вместо него используется soft-link `accounts.partyId` + runtime projection/write-through.
  - `Party -> CRM Contact` projection обязательна для директора и ключевых лиц, иначе A-RAI и CRM дают ложную пустоту по карточке.
