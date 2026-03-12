import { Controller, Get, Param } from "@nestjs/common";
import { StrategicService } from "./strategic.service";
import { AdvisoryService } from "./advisory.service";
import { CurrentUser } from "../../shared/auth/current-user.decorator";
import { Authorized } from "../../shared/auth/authorized.decorator";
import { STRATEGIC_ROLES } from "../../shared/auth/rbac.constants";

@Controller("strategic")
@Authorized(...STRATEGIC_ROLES)
export class StrategicController {
  constructor(
    private readonly strategicService: StrategicService,
    private readonly advisoryService: AdvisoryService,
  ) {}

  @Get("state")
  async getGlobalState() {
    return this.strategicService.getGlobalState();
  }

  @Get("advisory/company/:id")
  async getCompanyHealth(@Param("id") id: string) {
    return this.advisoryService.getCompanyHealth(id);
  }

  @Get("advisory/plan/:id")
  async getPlanVolatility(@Param("id") id: string, @CurrentUser() user: any) {
    return this.advisoryService.getPlanVolatility(id, user.companyId);
  }
}
