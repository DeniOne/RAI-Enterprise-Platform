import { Module } from "@nestjs/common";
import { NormalizationEnforcer } from "./normalization-enforcer";
import { ConfidenceIntervalValidator } from "./confidence-interval-validator";
import { ExpectationCalculator } from "./expectation-calculator";
import { ProbabilityDistributionBuilder } from "./probability-distribution-builder";

@Module({
  providers: [
    NormalizationEnforcer,
    ConfidenceIntervalValidator,
    ExpectationCalculator,
    ProbabilityDistributionBuilder,
  ],
  exports: [
    NormalizationEnforcer,
    ConfidenceIntervalValidator,
    ExpectationCalculator,
    ProbabilityDistributionBuilder,
  ],
})
export class ProbabilityModule {}
