export class RiskAggregator {
  constructor(prisma: any, collectors: any[]) {}
  async assess(
    companyId: string,
    targetType: any,
    targetId: string,
  ): Promise<any> {
    return {
      overallRiskScore: 0,
      factors: [],
      recommendations: [],
    };
  }
}

export class LegalRiskCollector {
  constructor(prisma: any) {}
}
export class RndRiskCollector {
  constructor(prisma: any) {}
}
export class OpsRiskCollector {
  constructor(prisma: any) {}
}
export class FinanceRiskCollector {
  constructor(prisma: any) {}
}
