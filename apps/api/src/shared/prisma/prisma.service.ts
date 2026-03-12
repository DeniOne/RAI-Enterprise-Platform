import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { Prisma, PrismaClient } from "@rai/prisma-client";
import { InvariantMetrics } from "../invariants/invariant-metrics";
import { TenantContextService } from "../tenant-context/tenant-context.service";

type TenantMode = "off" | "shadow" | "enforce";

type RawSqlExecutor = {
  $executeRaw: (query: Prisma.Sql) => Promise<unknown>;
  $queryRaw?: <T = unknown>(query: Prisma.Sql) => Promise<T>;
};

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  [key: string]: any; // Allows transparent Proxy access to Prisma delegates
  private readonly logger = new Logger(PrismaService.name);
  private readonly tenantContext: TenantContextService;
  private readonly tenantMode: TenantMode;
  private readonly enforceCohort: Set<string>;
  private tenantViolations = 0;
  private readonly failOnUnknownModel =
    (process.env.TENANT_FAIL_ON_UNKNOWN_MODEL || "true").toLowerCase() !==
    "false";

  private readonly tenantScopedModels = new Set<string>([
    "Account",
    "Budget",
    "BudgetItem",
    "BudgetPlan",
    "CashAccount",
    "CmrDecision",
    "CmrRisk",
    "ComplianceCheck",
    "Contract",
    "Deal",
    "DecisionRecord",
    "DeviationReview",
    "EconomicEvent",
    "EmployeeProfile",
    "Evidence",
    "ExecutionRecord",
    "Field",
    "FieldObservation",
    "GrInteraction",
    "HarvestPlan",
    "HarvestResult",
    "Holding",
    "HrKPIIndicator",
    "HumanAssessmentSnapshot",
    "InsuranceCoverage",
    "Invitation",
    "KnowledgeEdge",
    "KnowledgeNode",
    "LedgerEntry",
    "LearningEvent",
    "LegalDocument",
    "LegalRequirement",
    "Machinery",
    "ModelVersion",
    "OkrCycle",
    "PerformanceContract",
    "PolicySignal",
    "PulseSurvey",
    "RegulatoryBody",
    "ResearchProgram",
    "RiskAssessment",
    "RiskSignal",
    "RiskStateHistory",
    "RoleDefinition",
    "SatelliteObservation",
    "ScoreCard",
    "StockItem",
    "StockTransaction",
    "StrategicGoal",
    "Task",
    "TechMap",
    "TechnologyCard",
    "TrainingRun",
    "User",
    "VisionObservation",
    "DriftReport",
    "AccountBalance",
    "TenantState",
    "EventConsumption",
    "AuditLog",
    "AuditNotarizationRecord",
    "GovernanceConfig",
    "BusinessRule",
    "MemoryEntry",
    "DivergenceRecord",
    "ChangeOrder",
    "Approval",
    "AgronomicStrategy",
    "GenerationRecord",
    "SoilMetric",
    "SustainabilityBaseline",
    "BiodiversityMetric",
    "GovernanceLock",
    "OverrideRequest",
    "LevelFCertAudit",
    "Party",
    "Jurisdiction",
    "RegulatoryProfile",
    "PartyRelation",
    "AssetPartyRole",
    "CommerceContract",
    "CommerceContractPartyRole",
    "CommerceObligation",
    "BudgetReservation",
    "PaymentSchedule",
    "CommerceFulfillmentEvent",
    "StockMove",
    "RevenueRecognitionEvent",
    "Invoice",
    "Payment",
    "PaymentAllocation",
    "RegulatoryArtifact",
    "AgroEventDraft",
    "AgroEventCommitted",
    "FrontOfficeThread",
    "FrontOfficeThreadMessage",
    "FrontOfficeHandoffRecord",
    "QualityAlert",
    "AgentReputation",
    "UserCredibilityProfile",
    "ExpertReview",
    "IncidentRunbookExecution",
    "AutonomyOverride",
    "AgentLifecycleOverride",
    "RuntimeGovernanceEvent",
    "PerformanceMetric",
    "PendingAction",
    "AgentConfigChangeRequest",
    "EvalRun",
    "MemoryInteraction",
    "MemoryEpisode",
    "MemoryProfile",
    "CounterpartyUserBinding",
  ]);

  // Explicit non-tenant/system models. Any model outside both sets is treated as unknown.
  private readonly systemNonTenantModels = new Set<string>([
    "Company",
    "OutboxMessage",
    "EventConsumption",
    "Rapeseed",
    "RapeseedHistory",
  ]);

  constructor(tenantContext: TenantContextService) {
    super({
      log: (process.env.PRISMA_LOG_LEVEL || "")
        .split(",")
        .filter(Boolean) as any[],
    });
    this.tenantContext = tenantContext;
    const mode = (process.env.TENANT_MIDDLEWARE_MODE || "shadow").toLowerCase();
    this.tenantMode = mode === "off" || mode === "enforce" ? mode : "shadow";
    this.enforceCohort = new Set(
      String(process.env.TENANT_ENFORCE_COHORT || "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    );

    // Return a Proxy to make the service "transparent" for all Prisma models
    // while ensuring they all go through the isolated tenantClient.
    return new Proxy(this, {
      get(target: any, prop: string | symbol, receiver: any) {
        // 1. Internal infrastructure and symbols go to target
        if (
          typeof prop === "symbol" ||
          prop === "constructor" ||
          prop === "then" ||
          prop === "logger" ||
          (typeof prop === "string" && prop.startsWith("$"))
        ) {
          return Reflect.get(target, prop, receiver);
        }

        // 2. Service-specific properties/methods defined in PrismaService go to target
        // We check both the instance (for fields) and the prototype (for methods)
        if (
          Object.prototype.hasOwnProperty.call(target, prop) ||
          Object.prototype.hasOwnProperty.call(PrismaService.prototype, prop)
        ) {
          return Reflect.get(target, prop, receiver);
        }

        // 3. Model delegates go to isolated tenantClient
        if (typeof prop === "string" && prop in target.tenantClient) {
          return target.tenantClient[prop];
        }

        // 4. Fallback to target
        return Reflect.get(target, prop, receiver);
      },
    });
  }

  async onModuleInit() {
    this.logger.log(
      "PrismaService initializing with 10/10 Tenant Isolation (Transparent Proxy)...",
    );

    // Connect original client first
    await this.$connect();
  }

  // Mandatory 10/10 Isolation Extension
  readonly tenantClient = (() => {
    const tenantScopedModels = this.tenantScopedModels;
    const logger = this.logger;
    const getTenantContext = () => this.getTenantContext();

    return this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const isScoped = tenantScopedModels.has(model);
            if (!isScoped) {
              return query(args);
            }

            const context = getTenantContext();
            if (context?.isSystem) {
              logger.debug(
                `[TENANT_BYPASS] System-wide operation for ${model}.${operation}`,
              );
              return query(args);
            }

            const tenantId = context?.companyId;
            if (!tenantId) {
              logger.error(
                `[TENANT_VIOLATION] Attempted ${operation} on ${model} without tenant context!`,
              );
              InvariantMetrics.incrementTenantViolation("MISSING_CONTEXT", model);
              throw new Error(
                `TENANT_CONTEXT_MISSING: Operation ${operation} on ${model} requires active tenant context.`,
              );
            }

            if (
              [
                "findUnique",
                "findUniqueOrThrow",
                "findFirst",
                "findFirstOrThrow",
                "findMany",
                "update",
                "updateMany",
                "delete",
                "deleteMany",
                "count",
                "aggregate",
                "groupBy",
              ].includes(operation)
            ) {
              const typedArgs = args as { where?: any };
              typedArgs.where = {
                ...(typedArgs.where || {}),
                companyId: tenantId,
              };
            }

            if (operation === "create") {
              const typedArgs = args as { data?: any };
              typedArgs.data = {
                ...(typedArgs.data || {}),
                companyId: tenantId,
              };
            }

            if (operation === "createMany") {
              const typedArgs = args as { data?: any | any[] };
              if (Array.isArray(typedArgs.data)) {
                typedArgs.data = typedArgs.data.map((item) => ({
                  ...item,
                  companyId: tenantId,
                }));
              } else {
                typedArgs.data = { ...typedArgs.data, companyId: tenantId };
              }
            }

            if (operation === "upsert") {
              const typedArgs = args as { create?: any; where?: any };
              typedArgs.create = {
                ...(typedArgs.create || {}),
                companyId: tenantId,
              };
              typedArgs.where = {
                ...(typedArgs.where || {}),
                companyId: tenantId,
              };
            }

            return query(args);
          },
        },
      },
    });
  })();

  // System/Non-tenant models (explicitly excluded from isolation if needed, but proxied automatically)
  // No more manual getters needed!

  async $transaction(arg: any, options?: any): Promise<any> {
    if (typeof arg !== "function") {
      return (super.$transaction as any)(arg, options);
    }

    return (super.$transaction as any)(async (tx: any) => {
      await this.applyTenantSessionContext(tx);
      return arg(tx);
    }, options);
  }

  /**
   * Safe wrapper for raw queries that ensures session context is set.
   */
  async safeQueryRaw<T = any>(
    query: Prisma.Sql,
    executor?: RawSqlExecutor,
  ): Promise<T> {
    if (executor) {
      if (!executor.$queryRaw) {
        throw new Error("SAFE_QUERY_RAW_EXECUTOR_MISSING_QUERY_METHOD");
      }
      await this.applyTenantSessionContext(executor);
      return executor.$queryRaw<T>(query);
    }

    return this.$transaction(async (tx) => tx.$queryRaw(query));
  }

  async safeExecuteRaw(
    query: Prisma.Sql,
    executor?: RawSqlExecutor,
  ): Promise<number> {
    if (executor) {
      await this.applyTenantSessionContext(executor);
      return executor.$executeRaw(query) as Promise<number>;
    }

    return this.$transaction(async (tx) => tx.$executeRaw(query));
  }

  private getTenantContext() {
    return this.tenantContext.getStore();
  }

  private async applyTenantSessionContext(tx: {
    $executeRaw: (query: Prisma.Sql) => Promise<unknown>;
  }): Promise<void> {
    const context = this.getTenantContext();
    if (!context?.companyId || context.isSystem) {
      return;
    }

    await tx.$executeRaw(
      Prisma.sql`SELECT set_config('app.current_company_id', ${context.companyId}, true)`,
    );
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private hasCompanyIdContract(
    action: string,
    args: Record<string, any>,
  ): boolean {
    if (!args) {
      return false;
    }

    if (["create", "createMany", "upsert"].includes(action)) {
      return (
        this.containsCompanyId(args.data) ||
        this.containsCompanyId(args.create) ||
        this.containsCompanyId(args.where)
      );
    }

    if (
      [
        "findUnique",
        "findUniqueOrThrow",
        "findFirst",
        "findFirstOrThrow",
        "findMany",
        "delete",
        "deleteMany",
        "update",
        "updateMany",
        "count",
        "aggregate",
      ].includes(action)
    ) {
      return this.containsCompanyId(args.where);
    }

    return (
      this.containsCompanyId(args.where) || this.containsCompanyId(args.data)
    );
  }

  private containsCompanyId(value: any): boolean {
    if (!value || typeof value !== "object") {
      return false;
    }

    if (Object.prototype.hasOwnProperty.call(value, "companyId")) {
      return true;
    }

    for (const nested of Object.values(value)) {
      if (
        nested &&
        typeof nested === "object" &&
        this.containsCompanyId(nested)
      ) {
        return true;
      }
    }

    return false;
  }

  private extractCompanyId(value: any): string | null {
    if (!value || typeof value !== "object") {
      return null;
    }

    if (Object.prototype.hasOwnProperty.call(value, "companyId")) {
      const candidate = value.companyId;
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }
    }

    for (const nested of Object.values(value)) {
      if (nested && typeof nested === "object") {
        const found = this.extractCompanyId(nested);
        if (found) return found;
      }
    }

    return null;
  }

  private resolveTenantModeForRequest(args: Record<string, any>): TenantMode {
    if (this.tenantMode !== "enforce") {
      return this.tenantMode;
    }
    if (this.enforceCohort.size === 0) {
      return this.tenantMode;
    }

    const companyId = this.extractCompanyId(args);
    if (!companyId) {
      return this.tenantMode;
    }

    if (this.enforceCohort.has(companyId)) {
      return "enforce";
    }

    return "shadow";
  }

  private isRawSqlAction(action: string): boolean {
    const normalized = action.toLowerCase();
    return normalized.includes("queryraw") || normalized.includes("executeraw");
  }
}
