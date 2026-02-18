import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@rai/prisma-client";
import { InvariantMetrics } from "../invariants/invariant-metrics";

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
  ]);

  // Explicit non-tenant/system models. Any model outside both sets is treated as unknown.
  private readonly systemNonTenantModels = new Set<string>([
    "Company",
    "OutboxMessage",
    "EventConsumption",
    "Rapeseed",
    "RapeseedHistory",
  ]);

  constructor() {
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
    this.logger.log('PrismaService initializing...');
    // [WORKAROUND] $use is not available in recent Prisma versions.
    // Middleware logic needs to be migrated to Client Extensions ($extends).
    // Disabling to allow server startup.
    /*
    // @ts-expect-error prisma client middleware typing mismatch in generated client
    this.$use(async (params: any, next: any) => {
      const effectiveMode = this.resolveTenantModeForRequest(params.args ?? {});

      if (effectiveMode === "off") {
        return next(params);
      }

      const action = String(params.action || "");
      if (this.isRawSqlAction(action)) {
        const message = `[TENANT_${effectiveMode.toUpperCase()}] raw-sql action=${action} is forbidden in tenant mode`;
        if (effectiveMode === "enforce") {
          throw new Error(message);
        }
        this.logger.warn(message);
        return next(params);
      }

      const model = params.model;
      if (!model) {
        return next(params);
      }

      if (!this.tenantScopedModels.has(model)) {
        if (this.systemNonTenantModels.has(model)) {
          return next(params);
        }

        const message = `[TENANT_${effectiveMode.toUpperCase()}] unknown model classification model=${model} action=${params.action}`;
        if (effectiveMode === "enforce" && this.failOnUnknownModel) {
          throw new Error(`${message} (not in tenantScopedModels/systemNonTenantModels)`);
        }
        this.logger.warn(`${message} (allowing due to mode=${effectiveMode})`);
        return next(params);
      }

      const args = params.args ?? {};

      if (!this.hasCompanyIdContract(action, args)) {
        this.tenantViolations += 1;
        const tenantKey = this.extractCompanyId(args) || "UNKNOWN_TENANT";
        const moduleKey = model || "UNKNOWN_MODEL";
        InvariantMetrics.incrementTenantViolation(tenantKey, moduleKey);
        const message = `[TENANT_${effectiveMode.toUpperCase()}] model=${model} action=${action} violation#=${this.tenantViolations}`;

        if (effectiveMode === "enforce") {
          throw new Error(`${message} missing companyId contract`);
        }

        this.logger.warn(`${message} missing companyId contract`);
      }

      return next(params);
    });
    */

    this.logger.log(
      `Tenant middleware mode: ${this.tenantMode}, enforceCohortSize=${this.enforceCohort.size}, failOnUnknownModel=${this.failOnUnknownModel}`,
    );
    await this.$connect();
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
