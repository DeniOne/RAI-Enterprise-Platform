import { Module } from "@nestjs/common";
import { OfsController } from "./application/ofs.controller";
import { FinanceModule } from "../finance/finance.module";
import { LiquidityForecastService } from "../finance/application/liquidity-forecast.service";
import { BudgetService } from "../finance/application/budget.service";

@Module({
  imports: [FinanceModule],
  controllers: [OfsController],
  providers: [LiquidityForecastService],
})
export class OfsModule {}
