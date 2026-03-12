import { Controller, Get, Post, Body, Req, UseInterceptors } from "@nestjs/common";
import { PulseService } from "./pulse.service";
import { HrOrchestratorService } from "../hr-orchestrator.service";
import { IdempotencyInterceptor } from "../../../shared/idempotency/idempotency.interceptor";
import { Authorized } from "../../../shared/auth/authorized.decorator";
import { INTERNAL_USER_ROLES } from "../../../shared/auth/rbac.constants";

@Controller("hr/pulse")
@Authorized(...INTERNAL_USER_ROLES)
export class PulseController {
  constructor(
    private readonly pulseService: PulseService,
    private readonly hrOrchestrator: HrOrchestratorService,
  ) {}

  @Get("surveys")
  async getSurveys(@Req() req: any) {
    const companyId = req.user.companyId;
    return this.pulseService.getActiveSurveys(companyId);
  }

  @Post("submit")
  @UseInterceptors(IdempotencyInterceptor)
  async submitResponse(
    @Body()
    body: {
      pulseSurveyId: string;
      respondentId: string;
      answers: any;
      employeeId: string;
    },
    @Req() req: any,
  ) {
    const companyId = req.user.companyId;
    return this.hrOrchestrator.handlePulseSubmission(body, companyId);
  }
}
