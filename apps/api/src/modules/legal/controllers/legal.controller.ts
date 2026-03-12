import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseInterceptors,
} from "@nestjs/common";
import { ComplianceService } from "../services/compliance.service";
import { ImpactTargetType } from "@rai/prisma-client";
import { IdempotencyInterceptor } from "../../../shared/idempotency/idempotency.interceptor";
import { Authorized } from "../../../shared/auth/authorized.decorator";
import { REGULATORY_ROLES } from "../../../shared/auth/rbac.constants";

@Controller("legal")
export class LegalController {
  constructor(private complianceService: ComplianceService) {}

  @Get("dashboard")
  @Authorized(...REGULATORY_ROLES)
  async getDashboard(@Query("companyId") companyId: string) {
    // В будущем здесь будет агрегированная статистика
    return this.complianceService.runCompanyAudit(companyId);
  }

  @Get("requirements/:domain")
  @Authorized(...REGULATORY_ROLES)
  async getByDomain(
    @Param("domain") domain: ImpactTargetType,
    @Query("companyId") companyId: string,
  ) {
    return this.complianceService.getRequirementsForDomain(domain, companyId);
  }

  @Post("check/:id")
  @Authorized(...REGULATORY_ROLES)
  @UseInterceptors(IdempotencyInterceptor)
  async triggerCheck(@Param("id") id: string) {
    return this.complianceService.runCheck(id);
  }
}
