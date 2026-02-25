import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../../shared/prisma/prisma.service";

@Injectable()
export class LiquidityForecastService {
  private readonly logger = new Logger(LiquidityForecastService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Прогноз ликвидности.
   * Потребляет проекции из Economy (Economic Ledger) и обязательства из Finance.
   */
  async getForecast(companyId: string, daysAhead = 30) {
    this.logger.log(
      `Generating liquidity forecast for company ${companyId}, ${daysAhead} days ahead`,
    );

    // 1. Текущий баланс по всем счетам
    const accounts = await this.prisma.cashAccount.aggregate({
      where: { companyId },
      _sum: { balance: true },
    });
    const currentBalance = accounts._sum.balance || 0;

    // 2. Ожидаемые поступления и расходы из Ledger (OBLIGATIONS)
    // В реальной системе здесь будет сложная логика анализа дат в метаданных
    // Для MVP — просто сумма всех LedgerEntry по определенным кодам

    // TODO: Интеграция с LedgerEntry для более точного прогноза

    return {
      companyId,
      currentBalance,
      forecast: [
        { date: new Date(), expectedBalance: currentBalance },
        // Placeholder для будущих точек прогноза
      ],
      horizon: daysAhead,
    };
  }
}
