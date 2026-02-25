import { Controller, Get, Param, UseGuards, Request } from "@nestjs/common";
import { RiskService } from "./risk.service";
import { JwtAuthGuard } from "../../shared/auth/jwt-auth.guard";
import { RiskTargetType } from "@rai/prisma-client";

@Controller("risk")
@UseGuards(JwtAuthGuard)
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
