import { Module } from "@nestjs/common";
import { ExplainabilityBuilder } from "./explainability-builder";
import { FactorExtractor } from "./factor-extractor";
import { RationaleGenerator } from "./rationale-generator";

@Module({
  providers: [ExplainabilityBuilder, FactorExtractor, RationaleGenerator],
  exports: [ExplainabilityBuilder],
})
export class ExplainabilityModule {}
