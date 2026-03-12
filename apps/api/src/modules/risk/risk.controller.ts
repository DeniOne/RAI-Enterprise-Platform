import { Controller, Get, Param, Request } from "@nestjs/common";
import { RiskService } from "./risk.service";
import { RiskTargetType } from "@rai/prisma-client";
import { Authorized } from "../../shared/auth/authorized.decorator";
import { PLANNING_READ_ROLES } from "../../shared/auth/rbac.constants";

@Controller("risk")
@Authorized(...PLANNING_READ_ROLES)
export class RiskController {
  constructor(private readonly riskService: RiskService) {}

  @Get("assess/:targetType/:targetId")
  async assess(
    @Request() req,
    @Param("targetType") targetType: string,
    @Param("targetId") targetId: string,
  ) {
    // Validate targetType enum
    // TODO: Pipe validation
    const type = targetType.toUpperCase() as RiskTargetType;

    return this.riskService.assess(req.user.companyId, type, targetId);
  }
}
