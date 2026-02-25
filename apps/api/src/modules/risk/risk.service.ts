import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../shared/prisma/prisma.service";
import {
  RiskAggregator,
  LegalRiskCollector,
  RndRiskCollector,
  OpsRiskCollector,
  FinanceRiskCollector,
} from "../../shared/risk-engine";
import { RiskAssessment, RiskTargetType } from "@rai/prisma-client";

@Injectable()
export class RiskService {
  private readonly logger = new Logger(RiskService.name);
  private aggregator: RiskAggregator;

  constructor(private prisma: PrismaService) {
    // Initialize Core Engine
    // In a real DI system we might bind these in Module, but for B6 simplicity:
    this.aggregator = new RiskAggregator(
      this.prisma as any, // RiskAggregator expects PrismaClient, PrismaService extends it
      [
        new LegalRiskCollector(this.prisma as any),
        new RndRiskCollector(this.prisma as any),
        new OpsRiskCollector(this.prisma as any),
        new FinanceRiskCollector(this.prisma as any),
      ],
    );
  }

  async assess(
    companyId: string,
    targetType: RiskTargetType,
    targetId: string,
  ): Promise<RiskAssessment> {
    this.logger.log(
      `Assessing risk for ${targetType}:${targetId} (Company: ${companyId})`,
    );
    return this.aggregator.assess(companyId, targetType, targetId);
  }
}
