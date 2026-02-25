import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Query,
} from "@nestjs/common";
import { ComplianceService } from "../services/compliance.service";
import { ImpactTargetType } from "@rai/prisma-client";
import { JwtAuthGuard } from "../../../shared/auth/jwt-auth.guard";

@Controller("legal")
@UseGuards(JwtAuthGuard)
export class LegalController {
  constructor(private complianceService: ComplianceService) {}

  @Get("dashboard")
  async getDashboard(@Query("companyId") companyId: string) {
    // В будущем здесь будет агрегированная статистика
    return this.complianceService.runCompanyAudit(companyId);
  }

  @Get("requirements/:domain")
  async getByDomain(
    @Param("domain") domain: ImpactTargetType,
    @Query("companyId") companyId: string,
  ) {
    return this.complianceService.getRequirementsForDomain(domain, companyId);
  }

  @Post("check/:id")
  async triggerCheck(@Param("id") id: string) {
    return this.complianceService.runCheck(id);
  }
}
