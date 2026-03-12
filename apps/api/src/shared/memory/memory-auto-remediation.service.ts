import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InvariantMetrics } from '../invariants/invariant-metrics';
import { PrismaService } from '../prisma/prisma.service';
import { MemoryLifecycleObservabilityService } from './memory-lifecycle-observability.service';
import { MemoryMaintenanceService } from './memory-maintenance.service';

@Injectable()
export class MemoryAutoRemediationService implements OnApplicationBootstrap {
  private readonly logger = new Logger(MemoryAutoRemediationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly memoryLifecycleObservability: MemoryLifecycleObservabilityService,
    private readonly memoryMaintenanceService: MemoryMaintenanceService,
  ) {}

  onApplicationBootstrap() {
    const config = this.memoryMaintenanceService.getAutomationConfig();
    this.logger.log(
      `memory_auto_remediation_initialized enabled=${config.enabled} cron="${config.cron}" maxCompaniesPerRun=${config.maxCompaniesPerRun} maxPlaybooksPerCompany=${config.maxPlaybooksPerCompany} cooldownMinutes=${config.cooldownMinutes}`,
    );
  }

  @Cron(process.env.MEMORY_AUTO_REMEDIATION_CRON || '*/15 * * * *')
  async handleScheduledAutoRemediation(): Promise<void> {
    await this.runAutoRemediationCycle();
  }

  async runAutoRemediationCycle(): Promise<void> {
    const config = this.memoryMaintenanceService.getAutomationConfig();
    if (!config.enabled) {
      return;
    }

    const companyIds = await this.discoverCandidateCompanies(
      config.maxCompaniesPerRun,
    );

    for (const companyId of companyIds) {
      const snapshot = await this.memoryLifecycleObservability.getSnapshot({
        companyId,
      });
      const playbooks = this.memoryMaintenanceService
        .getRecommendations(snapshot)
        .filter((recommendation) => recommendation.autoEligible)
        .slice(0, config.maxPlaybooksPerCompany);

      for (const recommendation of playbooks) {
        const playbookId = recommendation.playbookId;
        const underCooldown =
          await this.memoryMaintenanceService.hasRecentAutoRemediation(
            companyId,
            playbookId,
            config.cooldownMinutes,
          );

        if (underCooldown) {
          this.logger.log(
            `memory_auto_remediation_cooldown companyId=${companyId} playbook=${playbookId} cooldownMinutes=${config.cooldownMinutes}`,
          );
          continue;
        }

        try {
          await this.memoryMaintenanceService.runAutoRemediation({
            companyId,
            playbookId,
            reason: `auto_remediation:${playbookId}`,
          });
          InvariantMetrics.increment('memory_auto_remediations_total');
        } catch (error) {
          InvariantMetrics.increment('memory_auto_remediation_failures_total');
          this.logger.error(
            `memory_auto_remediation_failed companyId=${companyId} playbook=${playbookId} error=${String(error)}`,
          );
        }
      }
    }
  }

  private async discoverCandidateCompanies(
    maxCompanies: number,
  ): Promise<string[]> {
    const [interactionCompanies, techMapCompanies, engramCompanies] =
      await Promise.all([
        (this.prisma as any).memoryInteraction.findMany({
          where: { companyId: { not: null } },
          distinct: ['companyId'],
          select: { companyId: true },
          take: maxCompanies,
        }),
        (this.prisma as any).techMap.findMany({
          where: { companyId: { not: null } },
          distinct: ['companyId'],
          select: { companyId: true },
          take: maxCompanies,
        }),
        (this.prisma as any).engram.findMany({
          where: { companyId: { not: null } },
          distinct: ['companyId'],
          select: { companyId: true },
          take: maxCompanies,
        }),
      ]);

    return Array.from(
      new Set(
        [...interactionCompanies, ...techMapCompanies, ...engramCompanies]
          .map((row: { companyId?: string | null }) => row.companyId)
          .filter((companyId): companyId is string => Boolean(companyId)),
      ),
    ).slice(0, maxCompanies);
  }
}
