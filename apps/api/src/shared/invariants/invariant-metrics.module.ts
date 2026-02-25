import { Module } from "@nestjs/common";
import { InvariantMetricsController } from "./invariant-metrics.controller";

@Module({
  controllers: [InvariantMetricsController],
})
export class InvariantMetricsModule {}
