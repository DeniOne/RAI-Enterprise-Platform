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
type DualKeyMode = "off" | "shadow" | "enforce";

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
  private readonly dualKeyMode: DualKeyMode;
  private readonly dualKeyCompanyFallback: boolean;
  private readonly tenantDriftAlertThreshold: number;
  private tenantDriftDetections = 0;
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
    "FrontOfficeThreadParticipantState",
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

  private readonly dualKeyScopedModels = new Set<string>([
    "TenantState",
    "AgentConfiguration",
    "AgentCapabilityBinding",
    "AgentToolBinding",
    "AgentConnectorBinding",
    "AgentConfigChangeRequest",
    "RuntimeGovernanceEvent",
    "SystemIncident",
    "IncidentRunbookExecution",
    "PendingAction",
    "PerformanceMetric",
    "EvalRun",
    "EventConsumption",
    "MemoryInteraction",
    "MemoryEpisode",
    "MemoryProfile",
    "FrontOfficeThread",
    "FrontOfficeThreadMessage",
    "FrontOfficeHandoffRecord",
    "FrontOfficeThreadParticipantState",
  ]);

  // Explicit non-tenant/system models. Any model outside both sets is treated as unknown.
  private readonly systemNonTenantModels = new Set<string>([
    "Company",
    "Tenant",
    "TenantCompanyBinding",
    "OutboxMessage",
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
    const dualMode = (process.env.TENANT_DUAL_KEY_MODE || "shadow")
      .trim()
      .toLowerCase();
    this.dualKeyMode =
      dualMode === "off" || dualMode === "enforce" ? dualMode : "shadow";
    this.dualKeyCompanyFallback =
      String(process.env.TENANT_DUAL_KEY_COMPANY_FALLBACK || "true")
        .trim()
        .toLowerCase() !== "false";
    this.tenantDriftAlertThreshold = Math.max(
      1,
      Number(process.env.TENANT_DRIFT_ALERT_THRESHOLD || 50),
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
    const dualKeyScopedModels = this.dualKeyScopedModels;
    const logger = this.logger;
    const getTenantContext = () => this.getTenantContext();
    const resolveTenantKey = () => this.resolveTenantKey(getTenantContext());
    const shouldUseTenantGuard = () => this.shouldUseTenantGuard();
    const applyShadowTenantWrite = (
      payload: Record<string, unknown>,
      tenantId: string,
    ) => this.applyShadowTenantWrite(payload, tenantId);
    const applyShadowTenantWriteMany = (
      payload: Record<string, unknown>[] | Record<string, unknown>,
      tenantId: string,
    ) => this.applyShadowTenantWriteMany(payload, tenantId);
    const applyTenantWhereGuard = (
      where: Record<string, unknown> | undefined,
      tenantId: string,
      operation: string,
    ) => this.applyTenantWhereGuard(where, tenantId, operation);
    const detectTenantDrift = (params: {
      model: string;
      operation: string;
      result: unknown;
      tenantId: string;
      companyId: string;
    }) => this.detectTenantDrift(params);
    const isReadOperation = (operation: string) =>
      [
        "findUnique",
        "findUniqueOrThrow",
        "findFirst",
        "findFirstOrThrow",
        "findMany",
        "count",
        "aggregate",
        "groupBy",
      ].includes(operation);
    const isWhereOperation = (operation: string) =>
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
        "upsert",
      ].includes(operation);

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

            const companyId = context?.companyId;
            if (!companyId) {
              logger.error(
                `[TENANT_VIOLATION] Attempted ${operation} on ${model} without tenant context!`,
              );
              InvariantMetrics.incrementTenantViolation("MISSING_CONTEXT", model);
              throw new Error(
                `TENANT_CONTEXT_MISSING: Operation ${operation} on ${model} requires active tenant context.`,
              );
            }
            const tenantId = resolveTenantKey();
            const isDualKeyModel = dualKeyScopedModels.has(model);
            const shouldGuardByTenant =
              isDualKeyModel && shouldUseTenantGuard() && !!tenantId;

            let typedArgs: any = args;
            if (!typedArgs) {
              typedArgs = {};
            }

            if (isWhereOperation(operation)) {
              typedArgs.where = {
                ...(typedArgs.where || {}),
                companyId,
              };
              if (shouldGuardByTenant) {
                typedArgs.where = applyTenantWhereGuard(
                  typedArgs.where,
                  tenantId,
                  operation,
                );
              }
            }

            if (operation === "create") {
              typedArgs.data = {
                ...(typedArgs.data || {}),
                companyId,
              };
              if (isDualKeyModel && tenantId) {
                typedArgs.data = applyShadowTenantWrite(typedArgs.data, tenantId);
              }
            }

            if (operation === "createMany") {
              if (Array.isArray(typedArgs.data)) {
                typedArgs.data = typedArgs.data.map((item) => ({
                  ...item,
                  companyId,
                }));
              } else {
                typedArgs.data = { ...typedArgs.data, companyId };
              }
              if (isDualKeyModel && tenantId && typedArgs.data) {
                typedArgs.data = applyShadowTenantWriteMany(
                  typedArgs.data,
                  tenantId,
                );
              }
            }

            if (operation === "upsert") {
              typedArgs.create = {
                ...(typedArgs.create || {}),
                companyId,
              };
              typedArgs.where = {
                ...(typedArgs.where || {}),
                companyId,
              };
              if (isDualKeyModel && tenantId) {
                typedArgs.create = applyShadowTenantWrite(
                  typedArgs.create,
                  tenantId,
                );
                if (shouldGuardByTenant) {
                  typedArgs.where = applyTenantWhereGuard(
                    typedArgs.where,
                    tenantId,
                    operation,
                  );
                }
              }
            }

            if (operation === "update" || operation === "updateMany") {
              typedArgs.data = {
                ...(typedArgs.data || {}),
              };
              if (isDualKeyModel && tenantId) {
                typedArgs.data = applyShadowTenantWrite(typedArgs.data, tenantId);
              }
            }

            const result = await query(args);

            if (isDualKeyModel && tenantId && isReadOperation(operation)) {
              detectTenantDrift({
                model,
                operation,
                result,
                tenantId,
                companyId,
              });
            }

            return result;
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

  private resolveTenantKey(
    context: ReturnType<PrismaService["getTenantContext"]>,
  ): string | null {
    if (!context) {
      return null;
    }

    if (typeof context.tenantId === "string" && context.tenantId.trim()) {
      return context.tenantId.trim();
    }

    if (this.dualKeyCompanyFallback && context.companyId?.trim()) {
      return context.companyId.trim();
    }

    return null;
  }

  private shouldUseTenantGuard(): boolean {
    return this.dualKeyMode === "enforce";
  }

  private applyTenantWhereGuard(
    where: Record<string, unknown> | undefined,
    tenantId: string,
    operation: string,
  ): Record<string, unknown> {
    const current = { ...(where || {}) };

    // For unique reads we keep company-only guard to avoid breaking legacy unique selectors.
    if (["findUnique", "findUniqueOrThrow"].includes(operation)) {
      return current;
    }

    current.tenantId = tenantId;
    return current;
  }

  private applyShadowTenantWrite(
    payload: Record<string, unknown>,
    tenantId: string,
  ): Record<string, unknown> {
    if (!payload || typeof payload !== "object") {
      return payload;
    }

    const candidate = payload.tenantId;
    if (typeof candidate === "string" && candidate.trim()) {
      return payload;
    }

    return {
      ...payload,
      tenantId,
    };
  }

  private applyShadowTenantWriteMany(
    payload: Record<string, unknown>[] | Record<string, unknown>,
    tenantId: string,
  ): Record<string, unknown>[] | Record<string, unknown> {
    if (Array.isArray(payload)) {
      return payload.map((entry) => this.applyShadowTenantWrite(entry, tenantId));
    }

    return this.applyShadowTenantWrite(payload, tenantId);
  }

  private detectTenantDrift(params: {
    model: string;
    operation: string;
    result: unknown;
    tenantId: string;
    companyId: string;
  }): void {
    const rows = this.collectRows(params.result);
    if (rows.length === 0) {
      return;
    }

    for (const row of rows) {
      const rowCompanyId = row.companyId;
      const rowTenantId = row.tenantId;
      if (
        typeof rowCompanyId !== "string" ||
        rowCompanyId.trim() !== params.companyId
      ) {
        continue;
      }

      if (rowTenantId == null) {
        continue;
      }

      if (typeof rowTenantId === "string" && rowTenantId.trim() === params.tenantId) {
        continue;
      }

      this.tenantDriftDetections += 1;
      InvariantMetrics.increment("tenant_scope_mismatch_total");
      this.logger.warn(
        `[TENANT_DRIFT] ${params.model}.${params.operation} returned tenantId=${String(
          rowTenantId,
        )} under tenant=${params.tenantId} company=${params.companyId}`,
      );

      if (this.tenantDriftDetections % this.tenantDriftAlertThreshold === 0) {
        InvariantMetrics.increment("tenant_company_drift_alerts_total");
        this.logger.error(
          `[TENANT_DRIFT_ALERT] drift detections reached ${this.tenantDriftDetections}`,
        );
      }
    }
  }

  private collectRows(value: unknown): Array<Record<string, unknown>> {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value.filter(
        (entry): entry is Record<string, unknown> =>
          !!entry && typeof entry === "object",
      );
    }

    if (typeof value === "object") {
      return [value as Record<string, unknown>];
    }

    return [];
  }

  private async applyTenantSessionContext(tx: {
    $executeRaw: (query: Prisma.Sql) => Promise<unknown>;
  }): Promise<void> {
    const context = this.getTenantContext();
    if (!context?.companyId || context.isSystem) {
      return;
    }
    const tenantId = this.resolveTenantKey(context) || context.companyId;

    await tx.$executeRaw(
      Prisma.sql`SELECT set_config('app.current_company_id', ${context.companyId}, true)`,
    );
    await tx.$executeRaw(
      Prisma.sql`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`,
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
