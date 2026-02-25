import { Module } from "@nestjs/common";
import { PulseService } from "./pulse.service";
import { AssessmentService } from "./assessment.service";

@Module({
  providers: [PulseService, AssessmentService],
  exports: [PulseService, AssessmentService],
})
export class DevelopmentModule {}
