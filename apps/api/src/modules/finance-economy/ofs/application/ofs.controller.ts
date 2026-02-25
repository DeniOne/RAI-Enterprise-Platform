import { Controller, Get, Req, UseGuards, Logger } from "@nestjs/common";
import { FinanceService } from "../../finance/application/finance.service";
import { BudgetService } from "../../finance/application/budget.service";
import { LiquidityForecastService } from "../../finance/application/liquidity-forecast.service";
import { JwtAuthGuard } from "../../../../shared/auth/jwt-auth.guard";

@Controller("ofs/finance")
@UseGuards(JwtAuthGuard)
export class OfsController {
  private readonly logger = new Logger(OfsController.name);

  constructor(
    private readonly financeService: FinanceService,
    private readonly budgetService: BudgetService,
    private readonly forecastService: LiquidityForecastService,
  ) {}

  @Get("dashboard")
  async getDashboard(@Req() req: any) {
    const companyId = req.user.companyId;
    this.logger.log(`Fetching CFO dashboard for company ${companyId}`);

    // 1. Ликвидность (Баланс)
    const liquidity = await this.forecastService.getForecast(companyId);

    // 2. Статус бюджетов (Burn Rate & Limits)
    const budgetStats = await this.budgetService.getStats(companyId);

    return {
      totalBalance: liquidity.currentBalance,
      budgetLimit: budgetStats.totalLimit,
      budgetConsumed: budgetStats.totalConsumed,
      budgetRemaining: budgetStats.totalRemaining,
      budgetBurnRate: budgetStats.burnRate,
      metrics: {
        liquidityHorizon: 30, // days
        safetyMargin:
          budgetStats.totalLimit > 0
            ? budgetStats.totalRemaining / budgetStats.totalLimit
            : 1,
      },
    };
  }
}
