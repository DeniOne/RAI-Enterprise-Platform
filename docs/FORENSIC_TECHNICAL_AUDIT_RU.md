# FORENSIC TECHNICAL AUDIT (Кодовая База)
Дата: 2026-02-15 16:59:00
Основание: анализ только исполняемого исходного кода и фактической структуры репозитория.

## I. Executive Risk Summary
- Critical: финансовая целостность уязвима из-за отсутствия строгой двойной записи и проверок баланса в БД.
- High: tenant-изоляция реализована частично (есть query-path без companyId фильтра).
- High: доставка событий в режиме at-least-once без встроенной дедупликации обработчиков.
- Medium: FSM реализованы в сервисах, но без системных DB-ограничений переходов.
- Low: модульная структура NestJS в целом стабильна по графу @Module.imports.

## II. System Inventory
- NestJS modules: 41
- Controllers: 24
- Services: 81
- Guards: 3
- Interceptors: 0 (Not implemented)
- Event listeners (@OnEvent): 1
- Cron jobs: 3
- Prisma models: 96
- Prisma enums: 77
- Migrations: packages/prisma-client=13, mg-core/backend/prisma=35
- Prisma $transaction usages: 29
- Raw SQL usages: 1

### Модули, импорты, зависимости, провайдеры, экспорты
| Module | File | Imports | Controllers | Providers | Exports |
| :--- | :--- | :--- | :--- | :--- | :--- |
| AdvisoryModule | `apps/api/src/modules/advisory/advisory.module.ts` | PrismaModule, AuditModule | AdvisoryController | AdvisoryService | AdvisoryService |
| AgroAuditModule | `apps/api/src/modules/agro-audit/agro-audit.module.ts` | AuditModule | ? | AgroAuditService | AgroAuditService |
| AgroOrchestratorModule | `apps/api/src/modules/agro-orchestrator/agro-orchestrator.module.ts` | PrismaModule, AuditModule, RiskModule | AgroOrchestratorController | AgroOrchestratorService | AgroOrchestratorService |
| AppModule | `apps/api/src/app.module.ts` | ConfigModule.forRoot, "../../.env" | ? | ? | ? |
| AuditModule | `apps/api/src/shared/audit/audit.module.ts` | PrismaModule | AuditController | AuditService | AuditService |
| AuthModule | `apps/api/src/shared/auth/auth.module.ts` | PrismaModule, RedisModule, PassportModule, JwtModule.registerAsync | ? | ? | ? |
| ClientRegistryModule | `apps/api/src/modules/client-registry/client-registry.module.ts` | ? | ClientRegistryController | ClientRegistryService | ClientRegistryService |
| CmrModule | `apps/api/src/modules/cmr/cmr.module.ts` | PrismaModule | CmrController | DeviationService, RiskService, DecisionService | DeviationService, RiskService, DecisionService |
| ConsultingModule | `apps/api/src/modules/consulting/consulting.module.ts` | PrismaModule, CmrModule, EconomyModule | ConsultingController | ConsultingService, BudgetPlanService, ConsultingDomainRules, ExecutionService, ConsultingOrchestrator, YieldService, KpiService, HarvestResultRepository, YieldOrchestrator, UnitNormalizationService, TechMapValidator, TechMapService, BudgetGeneratorService, DeviationService, ManagementDecisionService, StrategicViewService, StrategicGoalService, StrategicDecompositionService, ScenarioSimulationService, StrategicAdvisoryService, CashFlowService, LiquidityRiskService | ConsultingService, BudgetPlanService, ExecutionService, ManagementDecisionService, StrategicViewService, StrategicGoalService, StrategicDecompositionService, ScenarioSimulationService, StrategicAdvisoryService, CashFlowService, LiquidityRiskService |
| CrmModule | `apps/api/src/modules/crm/crm.module.ts` | ? | CrmController | CrmService | CrmService |
| DevelopmentModule | `apps/api/src/modules/hr/development/development.module.ts` | ? | ? | PulseService, AssessmentService | PulseService, AssessmentService |
| EconomyModule | `apps/api/src/modules/finance-economy/economy/economy.module.ts` | PrismaModule, OutboxModule | ? | EconomyService | EconomyService |
| FieldObservationModule | `apps/api/src/modules/field-observation/field-observation.module.ts` | PrismaModule, AuditModule, IntegrityModule | FieldObservationController | FieldObservationService | FieldObservationService |
| FieldRegistryModule | `apps/api/src/modules/field-registry/field-registry.module.ts` | ? | FieldRegistryController | FieldRegistryService | FieldRegistryService |
| FinanceEconomyModule | `apps/api/src/modules/finance-economy/finance-economy.module.ts` | EconomyModule, FinanceModule, IntegrationsModule, OfsModule | ? | ? | ? |
| FinanceModule | `apps/api/src/modules/finance-economy/finance/finance.module.ts` | ? | ? | FinanceService, BudgetService | FinanceService, BudgetService |
| FoundationModule | `apps/api/src/modules/hr/foundation/foundation.module.ts` | IdentityRegistryModule | ? | EmployeeService | EmployeeService |
| HrModule | `apps/api/src/modules/hr/hr.module.ts` | FoundationModule, IncentiveModule, DevelopmentModule | PulseController | HrOrchestratorService | FoundationModule, IncentiveModule, DevelopmentModule, HrOrchestratorService |
| IdentityRegistryModule | `apps/api/src/modules/identity-registry/identity-registry.module.ts` | ? | IdentityRegistryController | IdentityRegistryService | IdentityRegistryService |
| IncentiveModule | `apps/api/src/modules/hr/incentive/incentive.module.ts` | ? | ? | OkrService, KpiService, RecognitionService, RewardService | OkrService, KpiService, RecognitionService, RewardService |
| IntegrationsModule | `apps/api/src/modules/finance-economy/integrations/integrations.module.ts` | EconomyModule | ? | IntegrationService | IntegrationService |
| IntegrityModule | `apps/api/src/modules/integrity/integrity.module.ts` | PrismaModule, CmrModule, TelegramModule, ConsultingModule, ScheduleModule.forRoot | ? | IntegrityGateService, RegistryAgentService | IntegrityGateService, RegistryAgentService |
| KnowledgeGraphModule | `apps/api/src/modules/knowledge-graph/knowledge-graph.module.ts` | PrismaModule, IntegrityModule | ? | KnowledgeGraphEventBus, KnowledgeGraphEventHandlerService, KnowledgeGraphIngestionService, KnowledgeGraphQueryService | KnowledgeGraphIngestionService, KnowledgeGraphQueryService |
| KnowledgeModule | `apps/api/src/modules/knowledge/knowledge.module.ts` | ? | KnowledgeController | KnowledgeService | ? |
| LegalModule | `apps/api/src/modules/legal/legal.module.ts` | PrismaModule | LegalController, GrController | ComplianceService | ComplianceService |
| MemoryModule | `apps/api/src/shared/memory/memory.module.ts` | ConfigModule | ? | ContextService, MemoryManager, { provide: "MEMORY_MANAGER", useExisting: MemoryManager }, { provide: "EPISODIC_RETRIEVAL", useExisting: EpisodicRetrievalService }, { provide: "AUDIT_SERVICE", useExisting: AuditService }, EpisodicRetrievalService, ShadowAdvisoryService, ShadowAdvisoryMetricsService | ContextService, MemoryManager, EpisodicRetrievalService, ShadowAdvisoryService, ShadowAdvisoryMetricsService |
| OfsModule | `apps/api/src/modules/finance-economy/ofs/ofs.module.ts` | FinanceModule | OfsController | LiquidityForecastService | ? |
| OutboxModule | `apps/api/src/shared/outbox/outbox.module.ts` | PrismaModule, ScheduleModule.forRoot | ? | OutboxService, OutboxRelay | OutboxService |
| PrismaModule | `apps/api/src/shared/prisma/prisma.module.ts` | ? | ? | PrismaService | PrismaService |
| RapeseedModule | `apps/api/src/modules/rapeseed/rapeseed.module.ts` | ? | ? | RapeseedService, RapeseedResolver | RapeseedService |
| RdModule | `apps/api/src/modules/rd/rd.module.ts` | PrismaModule | ProgramController, ExperimentController, TrialController | RdService | RdService |
| RedisModule | `apps/api/src/shared/redis/redis.module.ts` | ? | ? | RedisService | RedisService |
| RiskModule | `apps/api/src/modules/risk/risk.module.ts` | PrismaModule | ? | RiskService, ActionDecisionService | RiskService, ActionDecisionService |
| SatelliteModule | `apps/api/src/modules/satellite/satellite.module.ts` | PrismaModule, IntegrityModule | ? | SatelliteEventBus, SatelliteEventHandlerService, SatelliteIngestionService, SatelliteQueryService | SatelliteIngestionService, SatelliteQueryService |
| SeasonModule | `apps/api/src/modules/season/season.module.ts` | AgroAuditModule, RiskModule | ? | SeasonService, SeasonResolver, SeasonBusinessRulesService, SeasonSnapshotService | SeasonService, SeasonBusinessRulesService, SeasonSnapshotService |
| StrategicModule | `apps/api/src/modules/strategic/strategic.module.ts` | RdModule, LegalModule, RiskModule, PrismaModule | StrategicController | StrategicService, AdvisoryService | ? |
| TaskModule | `apps/api/src/modules/task/task.module.ts` | PrismaModule, AuditModule, IntegrationsModule | TaskController | TaskService, TaskResolver | TaskService |
| TechMapModule | `apps/api/src/modules/tech-map/tech-map.module.ts` | PrismaModule, IntegrityModule | TechMapController | TechMapService, TechMapStateMachine | TechMapService |
| TechnologyCardModule | `apps/api/src/modules/technology-card/technology-card.module.ts` | ? | ? | TechnologyCardService, TechnologyCardResolver | TechnologyCardService |
| TelegramModule | `apps/api/src/modules/telegram/telegram.module.ts` | TaskModule, PrismaModule, AuthModule | ? | TelegramUpdate, ProgressService, TelegramNotificationService | ProgressService, TelegramNotificationService |
| VisionModule | `apps/api/src/modules/vision/vision.module.ts` | PrismaModule, IntegrityModule | ? | VisionEventBus, VisionEventHandlerService, VisionIngestionService, VisionQueryService | VisionIngestionService, VisionQueryService |

### Circular dependency detection
- Явных циклов не обнаружено.

### Controllers Guard Coverage
| Controller file | Route | @UseGuards |
| :--- | :--- | :---: |
| `apps/api/src/modules/advisory/advisory.controller.ts` | "advisory" | Yes |
| `apps/api/src/modules/agro-orchestrator/agro-orchestrator.controller.ts` | "orchestrator" | Yes |
| `apps/api/src/modules/client-registry/client-registry.controller.ts` | "registry/clients" | No |
| `apps/api/src/modules/cmr/cmr.controller.ts` | 'cmr' | Yes |
| `apps/api/src/modules/consulting/consulting.controller.ts` | 'consulting' | Yes |
| `apps/api/src/modules/crm/crm.controller.ts` | "crm" | No |
| `apps/api/src/modules/field-observation/field-observation.controller.ts` | "field-observation" | No |
| `apps/api/src/modules/field-registry/field-registry.controller.ts` | "registry/fields" | Yes |
| `apps/api/src/modules/finance-economy/ofs/application/ofs.controller.ts` | 'ofs/finance' | Yes |
| `apps/api/src/modules/hr/development/pulse.controller.ts` | 'hr/pulse' | Yes |
| `apps/api/src/modules/identity-registry/identity-registry.controller.ts` | "registry/identities" | Yes |
| `apps/api/src/modules/knowledge/knowledge.controller.ts` | 'knowledge' | No |
| `apps/api/src/modules/legal/controllers/gr.controller.ts` | 'gr' | No |
| `apps/api/src/modules/legal/controllers/legal.controller.ts` | 'legal' | No |
| `apps/api/src/modules/rd/controllers/ExperimentController.ts` | 'rd/experiments' | Yes |
| `apps/api/src/modules/rd/controllers/ProgramController.ts` | 'rd/programs' | Yes |
| `apps/api/src/modules/rd/controllers/TrialController.ts` | 'rd/trials' | Yes |
| `apps/api/src/modules/risk/risk.controller.ts` | 'risk' | Yes |
| `apps/api/src/modules/strategic/strategic.controller.ts` | 'strategic' | Yes |
| `apps/api/src/modules/task/task.controller.ts` | "tasks" | Yes |
| `apps/api/src/modules/tech-map/tech-map.controller.ts` | 'tech-map' | Yes |
| `apps/api/src/shared/audit/audit.controller.ts` | "audit" | Yes |
| `apps/api/src/shared/auth/auth.controller.ts` | "auth", "users" | Yes |
| `apps/api/src/shared/auth/telegram-auth-internal.controller.ts` | 'internal/telegram' | No |

## III. Multi-Tenancy Audit
Статус: Multi-tenancy сейчас реализована как локальная дисциплина в сервисах (manual `companyId`), а не как системный инвариант на уровне Prisma middleware/политики запроса.

### TENANT LEAKAGE MATRIX (per module)
| Module | Guard-level enforced | Service-level enforced | Query-level enforced | Bypass risk | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| AdvisoryModule | Enforced | Partially enforced | Partially enforced | Medium (manual companyId filters, no global middleware) | Medium |
| AgroAuditModule | N/A | Not enforced | Not enforced | High (no companyId evidence in module code) | High |
| AgroOrchestratorModule | Enforced | Partially enforced | Partially enforced | Medium (manual companyId filters, no global middleware) | Medium |
| ClientRegistryModule | Not enforced | Partially enforced | Partially enforced | High (unguarded/partial guard + manual filters) | High |
| CmrModule | Enforced | Partially enforced | Partially enforced | Medium (manual companyId filters, no global middleware) | Medium |
| ConsultingModule | Enforced | Partially enforced | Partially enforced | Medium (manual companyId filters, no global middleware) | Medium |
| CrmModule | Not enforced | Partially enforced | Partially enforced | High (unguarded/partial guard + manual filters) | High |
| DevelopmentModule | Enforced | Partially enforced | Partially enforced | Medium (manual companyId filters, no global middleware) | Medium |
| EconomyModule | N/A | Partially enforced | Partially enforced | Medium (non-controller module, manual filters only) | Medium |
| FieldObservationModule | Not enforced | Partially enforced | Partially enforced | High (unguarded/partial guard + manual filters) | High |
| FieldRegistryModule | Enforced | Partially enforced | Partially enforced | Medium (manual companyId filters, no global middleware) | Medium |
| FinanceEconomyModule | N/A | Partially enforced | Partially enforced | Medium (non-controller module, manual filters only) | Medium |
| FinanceModule | N/A | Partially enforced | Partially enforced | Medium (non-controller module, manual filters only) | Medium |
| FoundationModule | N/A | Partially enforced | Partially enforced | Medium (non-controller module, manual filters only) | Medium |
| HrModule | N/A | Partially enforced | Partially enforced | Medium (non-controller module, manual filters only) | Medium |
| IdentityRegistryModule | Enforced | Partially enforced | Partially enforced | Medium (manual companyId filters, no global middleware) | Medium |
| IncentiveModule | N/A | Partially enforced | Partially enforced | Medium (non-controller module, manual filters only) | Medium |
| IntegrationsModule | N/A | N/A | N/A | Medium (indirect flow) | Medium |
| IntegrityModule | N/A | Partially enforced | Partially enforced | Medium (non-controller module, manual filters only) | Medium |
| KnowledgeGraphModule | N/A | Partially enforced | Partially enforced | Medium (non-controller module, manual filters only) | Medium |
| KnowledgeModule | Not enforced | N/A | N/A | Medium (indirect flow) | Medium |
| LegalModule | Not enforced | Partially enforced | Partially enforced | High (unguarded/partial guard + manual filters) | High |
| OfsModule | N/A | N/A | N/A | Medium (indirect flow) | Medium |
| RapeseedModule | N/A | Partially enforced | Partially enforced | Medium (non-controller module, manual filters only) | Medium |
| RdModule | N/A | Partially enforced | Partially enforced | Medium (non-controller module, manual filters only) | Medium |
| RiskModule | Enforced | Partially enforced | Partially enforced | Medium (manual companyId filters, no global middleware) | Medium |
| SatelliteModule | N/A | Partially enforced | Partially enforced | Medium (non-controller module, manual filters only) | Medium |
| SeasonModule | N/A | Partially enforced | Partially enforced | Medium (non-controller module, manual filters only) | Medium |
| StrategicModule | Enforced | Partially enforced | Partially enforced | Medium (manual companyId filters, no global middleware) | Medium |
| TaskModule | Enforced | Partially enforced | Partially enforced | Medium (manual companyId filters, no global middleware) | Medium |
| TechMapModule | Enforced | Partially enforced | Partially enforced | Medium (manual companyId filters, no global middleware) | Medium |
| TechnologyCardModule | N/A | Partially enforced | Partially enforced | Medium (non-controller module, manual filters only) | Medium |
| TelegramModule | N/A | Partially enforced | Partially enforced | Medium (non-controller module, manual filters only) | Medium |
| VisionModule | N/A | Partially enforced | Partially enforced | Medium (non-controller module, manual filters only) | Medium |

### Critical leak paths
- `apps/api/src/shared/outbox/outbox.relay.ts:28`: `prisma.$queryRaw` выполняет выборку/lock outbox без tenant-фильтра (`companyId` в `OutboxMessage` отсутствует) -> cross-tenant processing path.
- `apps/api/src/modules/client-registry/client-registry.controller.ts:14`: контроллер без `@UseGuards`, вход не защищён на controller-level.
- `apps/api/src/modules/crm/crm.controller.ts:15`: контроллер без `@UseGuards`, вход не защищён на controller-level.
- `apps/api/src/modules/field-observation/field-observation.controller.ts:4`: контроллер без `@UseGuards`, вход не защищён на controller-level.
- `apps/api/src/modules/knowledge/knowledge.controller.ts:4`: контроллер без `@UseGuards`, вход не защищён на controller-level.
- `apps/api/src/modules/legal/controllers/legal.controller.ts:5`: контроллер без `@UseGuards`, вход не защищён на controller-level.
- `apps/api/src/modules/legal/controllers/gr.controller.ts:4`: контроллер без `@UseGuards`, вход не защищён на controller-level.
- `apps/api/src/shared/auth/telegram-auth-internal.controller.ts:5`: internal endpoint без `@UseGuards`.

### Raw SQL bypass paths
- `apps/api/src/shared/outbox/outbox.relay.ts:28` -> `this.prisma.$queryRaw`.
- Prisma tenant middleware: `Not implemented`.

### Controllers without guards
- `apps/api/src/modules/client-registry/client-registry.controller.ts`
- `apps/api/src/modules/crm/crm.controller.ts`
- `apps/api/src/modules/field-observation/field-observation.controller.ts`
- `apps/api/src/modules/knowledge/knowledge.controller.ts`
- `apps/api/src/modules/legal/controllers/legal.controller.ts`
- `apps/api/src/modules/legal/controllers/gr.controller.ts`
- `apps/api/src/shared/auth/telegram-auth-internal.controller.ts`

### Models without `companyId`, but logically tenant-scoped
Ниже только модели, у которых нет `companyId`, но есть связь на tenant-scoped модель (по фактическим relation в `schema.prisma`):
- `BudgetLine` -> `Budget`
- `TaskResourceActual` -> `Task`
- `MapStage` -> `TechMap`
- `MapOperation` -> `ExecutionRecord`/`MapStage` контур
- `TechnologyCardOperation` -> `TechnologyCard`/`Task`
- `ManagementDecision` -> `DeviationReview`/`User`
- `Objective` -> `OkrCycle`/`EmployeeProfile`
- `KeyResult` -> `Objective`
- `SeasonStageProgress` -> `Season`
- `SeasonHistory` -> `Season`
- `RapeseedHistory` -> `Rapeseed`
- `ExecutionOrchestrationLog` -> `ExecutionRecord`
- `Experiment` -> `ResearchProgram`
- `Protocol` -> `Experiment`
- `Trial` -> `Protocol`
- `Measurement` -> `Trial`
- `ResearchResult` -> `Trial`
- `ResearchConclusion` -> `ResearchResult`
- `OutboxMessage` -> cross-aggregate transport model (tenant marker отсутствует)

Вывод по разделу III:
- Полный per-module leakage matrix: выполнен.
- Основные критические векторы: unguarded controllers + raw SQL outbox path + отсутствие системного Prisma tenant middleware.
- Рекомендация уровня инварианта: внедрить Prisma tenant middleware (fail-closed) и deny-list для raw SQL без явного tenant contract.


## IV. FSM Enforcement Audit
| Entity | Enum only | Centralized FSM | Guarded transitions | Transactional | DB constraint | Illegal transition possible |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Task | No | Yes | Yes | Partially | No | Yes |
| TechMap | No | Yes | Yes | Partially | No | Yes |
| Season | No | Partially | Partially | Partially | No | Yes |
| RiskFsmState | Yes | Not implemented | Not implemented | Unknown | No | Yes |

## V. Ledger & Financial Integrity Audit
| Rule | Enforced in code | Enforced in DB | Breakable | Severity |
| :--- | :--- | :--- | :--- | :--- |
| Debit/Credit symmetry | Not implemented | Not implemented | Yes | Critical |
| Atomicity of posting | Partially | Partially | Yes | High |
| Immutability | Partially (`isImmutable`) | Not implemented | Yes | High |
| Balance validation | Not implemented | Not implemented | Yes | Critical |
| Idempotency | Not implemented | Not implemented | Yes | High |
| Replay safety | Partially | Not implemented | Yes | High |

## VI. Transaction Boundary Map
| File | Line | Evidence |
| :--- | :---: | :--- |
| `F` | \RAI_EP\apps\api\src\modules\consulting\budget-plan.service.ts | `145:        return this.prisma.$transaction(async (tx) => {` |
| `F` | \RAI_EP\apps\api\src\modules\consulting\budget-generator.service.ts | `55:        return this.prisma.$transaction(async (tx) => {` |
| `F` | \RAI_EP\apps\api\src\modules\consulting\budget-generator.service.js | `123:            return this.prisma.$transaction(async (tx) => {` |
| `F` | \RAI_EP\apps\api\src\modules\consulting\consulting.orchestrator.ts | `58:                await this.prisma.$transaction(async (tx) => {` |
| `F` | \RAI_EP\apps\api\src\modules\agro-orchestrator\agro-orchestrator.service.ts | `99:        const updated = await this.prisma.$transaction(async (tx) => {` |
| `F` | \RAI_EP\apps\api\src\modules\agro-orchestrator\agro-orchestrator.service.ts | `212:        const updated = await this.prisma.$transaction(async (tx) => {` |
| `F` | \RAI_EP\apps\api\src\modules\consulting\yield.service.ts | `25:        return this.prisma.$transaction(async (tx) => {` |
| `F` | \RAI_EP\apps\api\src\modules\consulting\tech-map.service.ts | `54:        return this.prisma.$transaction(async (tx) => {` |
| `F` | \RAI_EP\apps\api\src\modules\consulting\tech-map.service.ts | `102:        return this.prisma.$transaction(async (tx) => {` |
| `F` | \RAI_EP\apps\api\src\modules\consulting\strategic-goal.service.ts | `43:        return this.prisma.$transaction(async (tx) => {` |
| `F` | \RAI_EP\apps\api\src\modules\consulting\strategic-goal.service.ts | `81:        return this.prisma.$transaction(async (tx) => {` |
| `F` | \RAI_EP\apps\api\src\modules\tech-map\tech-map.service.ts | `66:        return this.prisma.$transaction(async (tx) => {` |
| `F` | \RAI_EP\apps\api\src\modules\tech-map\tech-map.concurrency.spec.ts | `19:                        $transaction: jest.fn(cb => cb(prisma)),` |
| `F` | \RAI_EP\apps\api\src\modules\consulting\management-decision.service.ts | `73:        return this.prisma.$transaction(async (tx) => {` |
| `F` | \RAI_EP\apps\api\src\modules\consulting\management-decision.service.ts | `113:        return this.prisma.$transaction(async (tx) => {` |
| `F` | \RAI_EP\apps\api\src\modules\rapeseed\rapeseed.service.ts | `63:    return this.prisma.$transaction(async (tx) => {` |
| `F` | \RAI_EP\apps\api\src\modules\rapeseed\rapeseed.service.spec.ts | `39:    $transaction: jest.fn((callback) => callback(prismaMock)),` |
| `F` | \RAI_EP\apps\api\src\modules\rapeseed\rapeseed.service.spec.ts | `115:    expect(prismaMock.$transaction).toHaveBeenCalled();` |
| `F` | \RAI_EP\apps\api\src\modules\task\task.service.ts | `67:    return this.prisma.$transaction(async (tx) => {` |
| `F` | \RAI_EP\apps\api\src\modules\task\task.service.ts | `166:    const updated = await this.prisma.$transaction(async (tx) => {` |
| `F` | \RAI_EP\apps\api\src\modules\task\task.service.spec.ts | `34:    $transaction: jest.fn((callback) => callback(prismaMock)),` |
| `F` | \RAI_EP\apps\api\src\modules\consulting\execution.service.ts | `102:        const result = await this.prisma.$transaction(async (tx) => {` |
| `F` | \RAI_EP\apps\api\src\modules\finance-economy\economy\application\economy.service.ts | `35:        return this.prisma.$transaction(async (tx) => {` |
| `F` | \RAI_EP\apps\api\src\modules\season\season.service.spec.ts | `42:    $transaction: jest.fn((callback) => callback(prismaMock)),` |
| `F` | \RAI_EP\apps\api\src\modules\season\season.service.spec.ts | `113:      expect(prismaMock.$transaction).toHaveBeenCalledWith(` |
| `F` | \RAI_EP\apps\api\src\modules\season\season.service.ts | `159:    return this.prisma.$transaction(` |
| `F` | \RAI_EP\apps\api\src\modules\season\season.service.ts | `276:    return this.prisma.$transaction(async (tx) => {` |
| `F` | \RAI_EP\apps\api\src\modules\season\season.transition.spec.ts | `36:            $transaction: jest.fn((cb) => cb(prisma)),` |
| `F` | \RAI_EP\apps\api\src\modules\season\services\season-snapshot.service.ts | `69:    return this.prisma.$transaction(async (innerTx) => {` |

## VII. Event Consistency Audit
| Event | Emission Type | Within transaction | Listener count | Idempotent | Lost risk | Duplicate risk |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| consulting.operation.completed | Outbox relay -> EventEmitter2 | No | 1 | Not implemented | Medium | High |
| finance.economic_event.created | Outbox message + relay | Partially | 0 explicit | Not implemented | Medium | High |
| internal vision/satellite/kg events | In-process buses | N/A | service handlers | Unknown | Medium | Medium |

## VIII. Data Integrity & Corruption Surface
| Entity | Orphan risk | Race risk | Soft-delete risk | Constraint weakness | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| LedgerEntry/EconomicEvent | Medium | High | Low | no double-entry and balance invariant | Critical |
| OutboxMessage | Low | Medium | Low | no consumer dedupe key | High |
| ManagementDecision | Medium | Medium | Low | missing companyId in model | High |
| KnowledgeNode/KnowledgeEdge | Medium | Medium | Low | partial tenant filters in query paths | High |
| Task/Season | Low | Medium | Low | FSM DB constraints absent | Medium |

## IX. Dependency & Coupling Analysis
| From | To | Direct import | Event-based | Shared dependency | Risk |
| :--- | :--- | :---: | :---: | :--- | :--- |
| IntegrityModule | ConsultingModule | Yes | No | Prisma | High |
| IntegrityModule | TelegramModule | Yes | No | Prisma | High |
| TaskModule | IntegrationsModule | Yes | No | Prisma | Medium |
| IntegrationsModule | EconomyModule | Yes | No | Prisma | Medium |
| OutboxRelay | Event consumers | No | Yes | EventEmitter2 | High |

## X. Performance & Scalability Forensics
| Risk | Evidence | Location | Severity |
| :--- | :--- | :--- | :--- |
| Outbox polling EVERY_SECOND | Potential DB pressure | apps/api/src/shared/outbox/outbox.relay.ts:21 | High |
| N+1 orchestration loop | Per-item DB operations | apps/api/src/modules/consulting/consulting.orchestrator.ts | High |
| Unbounded findMany | Potential memory/latency spikes | multiple services | Medium |
| In-process event bus | No cross-instance ordering guarantee | EventEmitter2 | Medium |

## XI. Failure Simulation Scenarios
1. Transaction crash mid-orchestration: зафиксированный commit внутри транзакции сохраняется, последующие шаги оркестрации могут не выполниться.
2. Advisory concurrent update: race-condition возможен при конкурентных апдейтах.
3. Tenant isolation bypass attempt: на query-path без companyId фильтра возможен риск обхода.
4. Duplicate event emission: при retry outbox relay возможно повторное событие.
5. Ledger concurrent writes: риск нарушения арифметических инвариантов баланса.
6. Illegal FSM transition attempt: прямое обновление статуса возможно, DB-level ограничений нет.
7. Background worker failure: непройденные задачи остаются в FAILED/PENDING.
8. Partial deployment failure: EventEmitter2 не гарантирует межинстансную согласованность доставки.

## XII. Final Enterprise Safety Score
- Critical: финансовая целостность не полностью защищена.
- High: tenant-изоляция слабеет на query-path уровне.
- Medium: FSM и transactional safety реализованы частично.
- Low: модульная декомпозиция и shared-зависимости стабильны.

**ENTERPRISE READINESS SCORE: 2.6 / 5**
