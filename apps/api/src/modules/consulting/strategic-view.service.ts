import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import { KpiService } from "./kpi.service";
import { ManagementDecisionService } from "./management-decision.service";
import { UserContext } from "./consulting.service";

@Injectable()
export class StrategicViewService {
  private readonly logger = new Logger(StrategicViewService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kpiService: KpiService,
    private readonly decisionService: ManagementDecisionService,
  ) {}

  /**
   * Возвращает стратегический срез данных по сезону для CEO/CFO.
   * Это Read-Model проекция высшего порядка, объединяющая финансовый и управленческий слои.
   */
  async getStrategicDashboard(seasonId: string, context: UserContext) {
    this.logger.log(
      `[STRATEGIC] Generating dashboard for season ${seasonId}, company ${context.companyId}`,
    );

    // 1. Получаем агрегированные финансовые KPI (Pure Projection from Ledger)
    const financialKPIs = await this.kpiService.calculateStrategicKPIs(
      seasonId,
      context,
    );

    // 2. Получаем журнал отклонений и решений для этого сезона
    const deviations = await this.prisma.deviationReview.findMany({
      where: {
        companyId: context.companyId,
        seasonId: seasonId,
      },
      include: {
        decisions: {
          orderBy: { version: "desc" },
          include: { author: { select: { name: true, email: true } } },
        },
        budgetItem: true,
        harvestPlan: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 3. Расчет управленческих метрик (Management Activity)
    const managementMetrics = {
      totalOpenDeviations: deviations.filter((d) => d.status !== "CLOSED")
        .length,
      unresolvedRiskCount: deviations.filter(
        (d) => !d.decisions || d.decisions.length === 0,
      ).length,
      confirmedDecisionsCount: deviations
        .flatMap((d) => d.decisions || [])
        .filter((dec) => dec.status === "CONFIRMED").length,
      criticalDeviations: deviations.filter((d) => d.severity === "HIGH")
        .length,
    };

    // Детальный список отклонений (Read-Model)
    return {
      header: {
        seasonId,
        companyId: context.companyId,
        generatedAt: new Date(),
        status:
          financialKPIs.activeReportingCount > 0 ? "STABLE" : "INITIALIZING",
      },
      // Финансовый слой
      finances: financialKPIs,
      // Слой активности
      management: managementMetrics,
      // Детальный список отклонений (Read-Model)
      deviationJournal: deviations.map((d) => {
        const latestDecision = d.decisions[0];
        const plan = d.harvestPlan as any;

        return {
          id: d.id,
          planName: plan?.name || `Plan ID: ${d.harvestPlanId}`,
          category: d.reasonCategory,
          severity: d.severity,
          description: d.deviationSummary,
          status: d.status,
          hasConfirmedDecision:
            d.decisions?.some((dec) => dec.status === "CONFIRMED") || false,
          latestDecision: latestDecision
            ? {
                id: latestDecision.id,
                status: latestDecision.status,
                version: latestDecision.version,
                author: latestDecision.author.name,
                confirmedAt: latestDecision.confirmedAt,
              }
            : null,
          budgetContext: d.budgetItem
            ? {
                category: d.budgetItem.category,
                planned: Number(d.budgetItem.plannedAmount),
                actual: Number(d.budgetItem.actualAmount),
                deviation:
                  Number(d.budgetItem.actualAmount) -
                  Number(d.budgetItem.plannedAmount),
              }
            : null,
        };
      }),
    };
  }
}
