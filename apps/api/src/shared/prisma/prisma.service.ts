import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@rai/prisma-client";
import { InvariantMetrics } from "../invariants/invariant-metrics";
import { TenantContextService } from "../tenant-context/tenant-context.service";

type TenantMode = "off" | "shadow" | "enforce";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly tenantContext: TenantContextService;
  private readonly tenantMode: TenantMode;
  private readonly enforceCohort: Set<string>;
  private tenantViolations = 0;
  private readonly failOnUnknownModel = (process.env.TENANT_FAIL_ON_UNKNOWN_MODEL || "true").toLowerCase() !== "false";

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
    "GovernanceConfig",
    "BusinessRule",
    "MemoryEntry",
    "DivergenceRecord",
    "AgronomicStrategy",
    "GenerationRecord",
    "SoilMetric",
    "SustainabilityBaseline",
    "BiodiversityMetric",
    "GovernanceLock",
    "OverrideRequest",
    "LevelFCertAudit",
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
      log: (process.env.PRISMA_LOG_LEVEL || "").split(",").filter(Boolean) as any[],
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
  }

  async onModuleInit() {
    this.logger.log('PrismaService initializing with 10/10 Tenant Isolation ($extends)...');

    // Connect original client first
    await this.$connect();
  }

  // Mandatory 10/10 Isolation Extension
  readonly tenantClient = this.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // 1. Skip if not a tenant-scoped model
          const isScoped = (this as any).tenantScopedModels.has(model);
          if (!isScoped) {
            return query(args);
          }

          // 2. Check for System-Wide Operation Bypass
          const context = (this as any).getTenantContext();
          if (context?.isSystem) {
            (this as any).logger.debug(`[TENANT_BYPASS] System-wide operation for ${model}.${operation}`);
            return query(args);
          }

          // 3. Enforce Tenant ID
          const tenantId = context?.companyId;
          if (!tenantId) {
            (this as any).logger.error(`[TENANT_VIOLATION] Attempted ${operation} on ${model} without tenant context!`);
            InvariantMetrics.incrementTenantViolation('MISSING_CONTEXT', model);
            throw new Error(`TENANT_CONTEXT_MISSING: Operation ${operation} on ${model} requires active tenant context.`);
          }

          // 4. Inject companyId into filters
          // For reads/updates/deletes: inject into 'where'
          if (['findUnique', 'findUniqueOrThrow', 'findFirst', 'findFirstOrThrow', 'findMany', 'update', 'updateMany', 'delete', 'deleteMany', 'count', 'aggregate', 'groupBy'].includes(operation)) {
            const typedArgs = args as { where?: any };
            typedArgs.where = {
              ...(typedArgs.where || {}),
              companyId: tenantId,
            };
          }

          // For creates: inject into 'data'
          if (operation === 'create') {
            const typedArgs = args as { data?: any };
            typedArgs.data = {
              ...(typedArgs.data || {}),
              companyId: tenantId,
            };
          }

          // For createMany/upsert: handle nested data
          if (operation === 'createMany') {
            const typedArgs = args as { data?: any | any[] };
            if (Array.isArray(typedArgs.data)) {
              typedArgs.data = typedArgs.data.map(item => ({ ...item, companyId: tenantId }));
            } else {
              typedArgs.data = { ...typedArgs.data, companyId: tenantId };
            }
          }

          if (operation === 'upsert') {
            const typedArgs = args as { create?: any; where?: any };
            typedArgs.create = { ...(typedArgs.create || {}), companyId: tenantId };
            typedArgs.where = { ...(typedArgs.where || {}), companyId: tenantId };
          }

          return query(args);
        },
      },
    },
  });

  // Proxy common methods to use the extended client
  get account() { return (this.tenantClient as any).account; }
  get budget() { return (this.tenantClient as any).budget; }
  get budgetItem() { return (this.tenantClient as any).budgetItem; }
  get budgetPlan() { return (this.tenantClient as any).budgetPlan; }
  get cashAccount() { return (this.tenantClient as any).cashAccount; }
  get cmrDecision() { return (this.tenantClient as any).cmrDecision; }
  get cmrRisk() { return (this.tenantClient as any).cmrRisk; }
  get complianceCheck() { return (this.tenantClient as any).complianceCheck; }
  get contract() { return (this.tenantClient as any).contract; }
  get deal() { return (this.tenantClient as any).deal; }
  get decisionRecord() { return (this.tenantClient as any).decisionRecord; }
  get deviationReview() { return (this.tenantClient as any).deviationReview; }
  get economicEvent() { return (this.tenantClient as any).economicEvent; }
  get employeeProfile() { return (this.tenantClient as any).employeeProfile; }
  get executionRecord() { return (this.tenantClient as any).executionRecord; }
  get field() { return (this.tenantClient as any).field; }
  get fieldObservation() { return (this.tenantClient as any).fieldObservation; }
  get grInteraction() { return (this.tenantClient as any).grInteraction; }
  get harvestPlan() { return (this.tenantClient as any).harvestPlan; }
  get harvestResult() { return (this.tenantClient as any).harvestResult; }
  get holding() { return (this.tenantClient as any).holding; }
  get hrKPIIndicator() { return (this.tenantClient as any).hrKPIIndicator; }
  get humanAssessmentSnapshot() { return (this.tenantClient as any).humanAssessmentSnapshot; }
  get insuranceCoverage() { return (this.tenantClient as any).insuranceCoverage; }
  get invitation() { return (this.tenantClient as any).invitation; }
  get knowledgeEdge() { return (this.tenantClient as any).knowledgeEdge; }
  get knowledgeNode() { return (this.tenantClient as any).knowledgeNode; }
  get ledgerEntry() { return (this.tenantClient as any).ledgerEntry; }
  get learningEvent() { return (this.tenantClient as any).learningEvent; }
  get legalDocument() { return (this.tenantClient as any).legalDocument; }
  get legalRequirement() { return (this.tenantClient as any).legalRequirement; }
  get machinery() { return (this.tenantClient as any).machinery; }
  get modelVersion() { return (this.tenantClient as any).modelVersion; }
  get okrCycle() { return (this.tenantClient as any).okrCycle; }
  get performanceContract() { return (this.tenantClient as any).performanceContract; }
  get policySignal() { return (this.tenantClient as any).policySignal; }
  get pulseSurvey() { return (this.tenantClient as any).pulseSurvey; }
  get regulatoryBody() { return (this.tenantClient as any).regulatoryBody; }
  get researchProgram() { return (this.tenantClient as any).researchProgram; }
  get riskAssessment() { return (this.tenantClient as any).riskAssessment; }
  get riskSignal() { return (this.tenantClient as any).riskSignal; }
  get riskStateHistory() { return (this.tenantClient as any).riskStateHistory; }
  get roleDefinition() { return (this.tenantClient as any).roleDefinition; }
  get satelliteObservation() { return (this.tenantClient as any).satelliteObservation; }
  get scoreCard() { return (this.tenantClient as any).scoreCard; }
  get stockItem() { return (this.tenantClient as any).stockItem; }
  get stockTransaction() { return (this.tenantClient as any).stockTransaction; }
  get strategicGoal() { return (this.tenantClient as any).strategicGoal; }
  get task() { return (this.tenantClient as any).task; }
  get techMap() { return (this.tenantClient as any).techMap; }
  get technologyCard() { return (this.tenantClient as any).technologyCard; }
  get trainingRun() { return (this.tenantClient as any).trainingRun; }
  get user() { return (this.tenantClient as any).user; }
  get visionObservation() { return (this.tenantClient as any).visionObservation; }
  get driftReport() { return (this.tenantClient as any).driftReport; }
  get accountBalance() { return (this.tenantClient as any).accountBalance; }
  get tenantState() { return (this.tenantClient as any).tenantState; }
  get generationRecord() { return (this.tenantClient as any).generationRecord; }

  // System/Non-tenant models
  get company() { return (this.tenantClient as any).company; }
  get outboxMessage() { return (this.tenantClient as any).outboxMessage; }
  get eventConsumption() { return (this.tenantClient as any).eventConsumption; }
  get rapeseed() { return (this.tenantClient as any).rapeseed; }
  get rapeseedHistory() { return (this.tenantClient as any).rapeseedHistory; }

  /**
   * Safe wrapper for raw queries that ensures session context is set.
   */
  async safeQueryRaw<T = any>(query: any, ...values: any[]): Promise<T> {
    const tenantId = this.getTenantContext()?.companyId;
    if (!tenantId && !this.getTenantContext()?.isSystem) {
      throw new Error("RAW_SQL_FORBIDDEN: Missing tenant context.");
    }

    return this.$transaction(async (tx) => {
      if (tenantId) {
        await tx.$executeRawUnsafe(`SELECT set_config('app.current_company_id', '${tenantId}', true)`);
      }
      return (tx as any).$queryRaw(query, ...values);
    });
  }

  private getTenantContext() {
    return this.tenantContext.getStore();
  }


  async onModuleDestroy() {
    await this.$disconnect();
  }

  private hasCompanyIdContract(action: string, args: Record<string, any>): boolean {
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

    if (["findUnique", "findUniqueOrThrow", "findFirst", "findFirstOrThrow", "findMany", "delete", "deleteMany", "update", "updateMany", "count", "aggregate"].includes(action)) {
      return this.containsCompanyId(args.where);
    }

    return this.containsCompanyId(args.where) || this.containsCompanyId(args.data);
  }

  private containsCompanyId(value: any): boolean {
    if (!value || typeof value !== "object") {
      return false;
    }

    if (Object.prototype.hasOwnProperty.call(value, "companyId")) {
      return true;
    }

    for (const nested of Object.values(value)) {
      if (nested && typeof nested === "object" && this.containsCompanyId(nested)) {
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
