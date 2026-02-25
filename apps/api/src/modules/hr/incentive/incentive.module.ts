import { Module } from "@nestjs/common";
import { OkrService } from "./okr.service";
import { KpiService } from "./kpi.service";
import { RecognitionService } from "./recognition.service";
import { RewardService } from "./reward.service";

@Module({
  providers: [OkrService, KpiService, RecognitionService, RewardService],
  exports: [OkrService, KpiService, RecognitionService, RewardService],
})
export class IncentiveModule {}
