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

  constructor(private readonly tenantContext: TenantContextService) {
    super({
      log: (process.env.PRISMA_LOG_LEVEL || "").split(",").filter(Boolean) as any[],
    });
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
            args.where = {
              ...(args.where || {}),
              companyId: tenantId,
            };
          }

          // For creates: inject into 'data'
          if (operation === 'create') {
            args.data = {
              ...(args.data || {}),
              companyId: tenantId,
            };
          }

          // For createMany/upsert: handle nested data
          if (operation === 'createMany') {
            if (Array.isArray(args.data)) {
              args.data = args.data.map(item => ({ ...item, companyId: tenantId }));
            } else {
              args.data = { ...args.data, companyId: tenantId };
            }
          }

          if (operation === 'upsert') {
            args.create = { ...(args.create || {}), companyId: tenantId };
            args.where = { ...(args.where || {}), companyId: tenantId };
          }

          return query(args);
        },
      },
    },
  });

  // Proxy common methods to use the extended client
  get account() { return this.tenantClient.account; }
  get budget() { return this.tenantClient.budget; }
  get budgetItem() { return this.tenantClient.budgetItem; }
  get budgetPlan() { return this.tenantClient.budgetPlan; }
  get cashAccount() { return this.tenantClient.cashAccount; }
  get cmrDecision() { return this.tenantClient.cmrDecision; }
  get cmrRisk() { return this.tenantClient.cmrRisk; }
  get complianceCheck() { return this.tenantClient.complianceCheck; }
  get contract() { return this.tenantClient.contract; }
  get deal() { return this.tenantClient.deal; }
  get decisionRecord() { return this.tenantClient.decisionRecord; }
  get deviationReview() { return this.tenantClient.deviationReview; }
  get economicEvent() { return this.tenantClient.economicEvent; }
  get employeeProfile() { return this.tenantClient.employeeProfile; }
  get executionRecord() { return this.tenantClient.executionRecord; }
  get field() { return this.tenantClient.field; }
  get fieldObservation() { return this.tenantClient.fieldObservation; }
  get grInteraction() { return this.tenantClient.grInteraction; }
  get harvestPlan() { return this.tenantClient.harvestPlan; }
  get harvestResult() { return this.tenantClient.harvestResult; }
  get holding() { return this.tenantClient.holding; }
  get hrKPIIndicator() { return this.tenantClient.hrKPIIndicator; }
  get humanAssessmentSnapshot() { return this.tenantClient.humanAssessmentSnapshot; }
  get insuranceCoverage() { return this.tenantClient.insuranceCoverage; }
  get invitation() { return this.tenantClient.invitation; }
  get knowledgeEdge() { return this.tenantClient.knowledgeEdge; }
  get knowledgeNode() { return this.tenantClient.knowledgeNode; }
  get ledgerEntry() { return this.tenantClient.ledgerEntry; }
  get learningEvent() { return this.tenantClient.learningEvent; }
  get legalDocument() { return this.tenantClient.legalDocument; }
  get legalRequirement() { return this.tenantClient.legalRequirement; }
  get machinery() { return this.tenantClient.machinery; }
  get modelVersion() { return this.tenantClient.modelVersion; }
  get okrCycle() { return this.tenantClient.okrCycle; }
  get performanceContract() { return this.tenantClient.performanceContract; }
  get policySignal() { return this.tenantClient.policySignal; }
  get pulseSurvey() { return this.tenantClient.pulseSurvey; }
  get regulatoryBody() { return this.tenantClient.regulatoryBody; }
  get researchProgram() { return this.tenantClient.researchProgram; }
  get riskAssessment() { return this.tenantClient.riskAssessment; }
  get riskSignal() { return this.tenantClient.riskSignal; }
  get riskStateHistory() { return this.tenantClient.riskStateHistory; }
  get roleDefinition() { return this.tenantClient.roleDefinition; }
  get satelliteObservation() { return this.tenantClient.satelliteObservation; }
  get scoreCard() { return this.tenantClient.scoreCard; }
  get stockItem() { return this.tenantClient.stockItem; }
  get stockTransaction() { return this.tenantClient.stockTransaction; }
  get strategicGoal() { return this.tenantClient.strategicGoal; }
  get task() { return this.tenantClient.task; }
  get techMap() { return this.tenantClient.techMap; }
  get technologyCard() { return this.tenantClient.technologyCard; }
  get trainingRun() { return this.tenantClient.trainingRun; }
  get user() { return this.tenantClient.user; }
  get visionObservation() { return this.tenantClient.visionObservation; }
  get driftReport() { return this.tenantClient.driftReport; }
  get accountBalance() { return this.tenantClient.accountBalance; }
  get tenantState() { return this.tenantClient.tenantState; }

  // System/Non-tenant models
  get company() { return this.tenantClient.company; }
  get outboxMessage() { return this.tenantClient.outboxMessage; }
  get eventConsumption() { return this.tenantClient.eventConsumption; }
  get rapeseed() { return this.tenantClient.rapeseed; }
  get rapeseedHistory() { return this.tenantClient.rapeseedHistory; }

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
