import { Module } from "@nestjs/common";
import { OfsController } from "./application/ofs.controller";
import { FinanceModule } from "../finance/finance.module";
import { LiquidityForecastService } from "../finance/application/liquidity-forecast.service";
import { BudgetService } from "../finance/application/budget.service";
import { StrategyForecastsController } from "./application/strategy-forecasts.controller";
import { DecisionIntelligenceService } from "./application/decision-intelligence.service";
import { IdempotencyModule } from "../../../shared/idempotency/idempotency.module";
import { ForecastAssemblerService } from "./application/forecast-assembler.service";
import { ScenarioEngineService } from "./application/scenario-engine.service";
import { RiskComposerService } from "./application/risk-composer.service";
import { DecisionRecommendationComposerService } from "./application/decision-recommendation-composer.service";
import { StrategyForecastOptimizationService } from "./application/strategy-forecast-optimization.service";
import { DecisionEvaluationService } from "./application/decision-evaluation.service";

@Module({
  imports: [FinanceModule, IdempotencyModule],
  controllers: [OfsController, StrategyForecastsController],
  providers: [
    LiquidityForecastService,
    DecisionIntelligenceService,
    ForecastAssemblerService,
    ScenarioEngineService,
    RiskComposerService,
    DecisionRecommendationComposerService,
    StrategyForecastOptimizationService,
    DecisionEvaluationService,
  ],
  exports: [DecisionIntelligenceService],
})
export class OfsModule {}
