import { Controller, Get, Query } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";
import { Authorized } from "../../../shared/auth/authorized.decorator";
import { REGULATORY_ROLES } from "../../../shared/auth/rbac.constants";

@Controller("gr")
export class GrController {
  constructor(private prisma: PrismaService) {}

  @Get("regulators")
  @Authorized(...REGULATORY_ROLES)
  async getRegulators(@Query("companyId") companyId: string) {
    return this.prisma.regulatoryBody.findMany({
      where: { companyId },
      include: { documents: true },
    });
  }

  @Get("interactions")
  @Authorized(...REGULATORY_ROLES)
  async getInteractions(@Query("companyId") companyId: string) {
    return this.prisma.grInteraction.findMany({
      where: { companyId },
      orderBy: { date: "desc" },
    });
  }

  @Get("signals")
  @Authorized(...REGULATORY_ROLES)
  async getSignals(@Query("companyId") companyId: string) {
    return this.prisma.policySignal.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });
  }
}
