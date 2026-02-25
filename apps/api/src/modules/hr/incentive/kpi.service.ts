import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../shared/prisma/prisma.service";

@Injectable()
export class KpiService {
  constructor(private readonly prisma: PrismaService) {}

  async captureKpi(
    data: { externalKey: string; title: string; value: number },
    companyId: string,
  ) {
    return this.prisma.hrKPIIndicator.create({
      data: {
        ...data,
        company: { connect: { id: companyId } },
      },
    });
  }

  async getCompanyKpis(companyId: string) {
    return this.prisma.hrKPIIndicator.findMany({
      where: { companyId },
      orderBy: { capturedAt: "desc" },
    });
  }
}
