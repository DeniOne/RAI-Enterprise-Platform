import { Controller, Get, Post, Body, Req, UseGuards } from "@nestjs/common";
import { PulseService } from "./pulse.service";
import { HrOrchestratorService } from "../hr-orchestrator.service";
import { JwtAuthGuard } from "../../../shared/auth/jwt-auth.guard";

@Controller("hr/pulse")
@UseGuards(JwtAuthGuard)
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
