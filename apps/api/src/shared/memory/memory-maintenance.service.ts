import { Injectable, Logger } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConsolidationWorker } from './consolidation.worker';
import { EngramFormationWorker } from './engram-formation.worker';
import { MemoryLifecycleObservabilityService } from './memory-lifecycle-observability.service';
import {
  defaultMemoryMaintenanceActions,
  getMemoryMaintenancePlaybook,
  MemoryLifecycleAutomationConfig,
  MemoryMaintenanceAction,
  MemoryMaintenanceActionResult,
  MemoryMaintenanceControlPlaneState,
  MemoryMaintenancePlaybook,
  MemoryMaintenancePlaybookId,
  MemoryMaintenanceRecentRun,
  MemoryMaintenanceRecommendation,
  MemoryMaintenanceRunInput,
  MemoryMaintenanceRunScope,
  MemoryMaintenanceRunSummary,
  memoryMaintenancePlaybooks,
} from './memory-maintenance.types';

@Injectable()
export class MemoryMaintenanceService {
  private readonly logger = new Logger(MemoryMaintenanceService.name);
  private readonly defaultMaxRuns = 3;
  private readonly maxAllowedRuns = 10;

  constructor(
    private readonly consolidationWorker: ConsolidationWorker,
    private readonly engramFormationWorker: EngramFormationWorker,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
    private readonly memoryLifecycleObservability: MemoryLifecycleObservabilityService,
  ) {}

  async runManualMaintenance(
    input: MemoryMaintenanceRunInput,
  ): Promise<MemoryMaintenanceRunSummary> {
    return this.runMaintenance({
      ...input,
      scope: 'tenant_manual',
    });
  }

  async runAutoRemediation(
    input: MemoryMaintenanceRunInput,
  ): Promise<MemoryMaintenanceRunSummary> {
    return this.runMaintenance({
      ...input,
      scope: 'system_auto',
    });
  }

  getPlaybooks(): MemoryMaintenancePlaybook[] {
    return [...memoryMaintenancePlaybooks];
  }

  async getControlPlaneState(
    companyId: string,
  ): Promise<MemoryMaintenanceControlPlaneState> {
    const [snapshot, recentRuns] = await Promise.all([
      this.memoryLifecycleObservability.getSnapshot({ companyId }),
      this.getRecentRuns(companyId),
    ]);
    const thresholds = this.memoryLifecycleObservability.getThresholds();
    const recommendations = this.getRecommendations(snapshot);
    const lastAutoRun = recentRuns.find((run) => run.scope === 'system_auto') ?? null;

    return {
      generatedAt: new Date().toISOString(),
      snapshot,
      thresholds,
      playbooks: this.getPlaybooks(),
      recommendations,
      automation: {
        ...this.getAutomationConfig(),
        lastAutoRunAt: lastAutoRun?.createdAt ?? null,
        lastAutoRunPlaybookId: lastAutoRun?.playbookId ?? null,
      },
      recentRuns,
    };
  }

  getRecommendations(
    snapshot: Awaited<
      ReturnType<MemoryLifecycleObservabilityService['getSnapshot']>
    >,
  ): MemoryMaintenanceRecommendation[] {
    const thresholds = this.memoryLifecycleObservability.getThresholds();
    const recommendations: MemoryMaintenanceRecommendation[] = [];

    const sTierBreaches: string[] = [];
    if (
      snapshot.oldestUnconsolidatedAgeSeconds >=
      thresholds.oldestUnconsolidatedAgeSeconds
    ) {
      sTierBreaches.push('oldest_unconsolidated_age_high');
      if (!snapshot.pauseWindows.consolidation.paused) {
        recommendations.push(
          this.buildRecommendation(
            MemoryMaintenancePlaybookId.CONSOLIDATION_ONLY,
            90,
            ['oldest_unconsolidated_age_high'],
          ),
        );
      }
    }
    if (
      snapshot.prunableConsolidatedCount >=
      thresholds.prunableConsolidatedInteractions
    ) {
      sTierBreaches.push('pruning_backlog_high');
      if (!snapshot.pauseWindows.pruning.paused) {
        recommendations.push(
          this.buildRecommendation(
            MemoryMaintenancePlaybookId.PRUNING_ONLY,
            80,
            ['pruning_backlog_high'],
          ),
        );
      }
    }
    if (
      sTierBreaches.length > 1 &&
      !snapshot.pauseWindows.consolidation.paused &&
      !snapshot.pauseWindows.pruning.paused
    ) {
      recommendations.push(
        this.buildRecommendation(
          MemoryMaintenancePlaybookId.S_TIER_BACKLOG_RECOVERY,
          95,
          sTierBreaches,
        ),
      );
    }

    const engramBreaches: string[] = [];
    if (
      snapshot.engramFormationCandidateCount > 0 &&
      snapshot.oldestEngramFormationCandidateAgeSeconds >=
        thresholds.latestEngramFormationAgeSeconds
    ) {
      engramBreaches.push('engram_formation_candidates_stale');
      if (!snapshot.pauseWindows.engramFormation.paused) {
        recommendations.push(
          this.buildRecommendation(
            MemoryMaintenancePlaybookId.ENGRAM_FORMATION_ONLY,
            85,
            ['engram_formation_candidates_stale'],
          ),
        );
      }
    }
    if (
      snapshot.prunableActiveEngramCount >= thresholds.prunableActiveEngrams
    ) {
      engramBreaches.push('prunable_active_engrams_high');
      if (!snapshot.pauseWindows.engramPruning.paused) {
        recommendations.push(
          this.buildRecommendation(
            MemoryMaintenancePlaybookId.ENGRAM_PRUNING_ONLY,
            75,
            ['prunable_active_engrams_high'],
          ),
        );
      }
    }
    if (
      engramBreaches.length > 1 &&
      !snapshot.pauseWindows.engramFormation.paused &&
      !snapshot.pauseWindows.engramPruning.paused
    ) {
      recommendations.push(
        this.buildRecommendation(
          MemoryMaintenancePlaybookId.ENGRAM_LIFECYCLE_RECOVERY,
          90,
          engramBreaches,
        ),
      );
    }

    if (
      sTierBreaches.length > 0 &&
      engramBreaches.length > 0 &&
      !snapshot.pauseWindows.consolidation.paused &&
      !snapshot.pauseWindows.pruning.paused &&
      !snapshot.pauseWindows.engramFormation.paused &&
      !snapshot.pauseWindows.engramPruning.paused
    ) {
      recommendations.push(
        this.buildRecommendation(
          MemoryMaintenancePlaybookId.FULL_MEMORY_LIFECYCLE_RECOVERY,
          100,
          [...sTierBreaches, ...engramBreaches],
        ),
      );
    }

    return recommendations
      .sort((left, right) => right.priority - left.priority)
      .filter(
        (recommendation, index, all) =>
          all.findIndex(
            (candidate) => candidate.playbookId === recommendation.playbookId,
          ) === index,
      );
  }

  getAutomationConfig(): MemoryLifecycleAutomationConfig {
    return {
      enabled:
        (process.env.MEMORY_AUTO_REMEDIATION_ENABLED || 'false').toLowerCase() ===
        'true',
      cron: process.env.MEMORY_AUTO_REMEDIATION_CRON || '*/15 * * * *',
      maxCompaniesPerRun: Math.max(
        1,
        Number(process.env.MEMORY_AUTO_REMEDIATION_MAX_COMPANIES_PER_RUN || 25),
      ),
      maxPlaybooksPerCompany: Math.max(
        1,
        Number(
          process.env.MEMORY_AUTO_REMEDIATION_MAX_PLAYBOOKS_PER_COMPANY || 2,
        ),
      ),
      cooldownMinutes: Math.max(
        1,
        Number(process.env.MEMORY_AUTO_REMEDIATION_COOLDOWN_MINUTES || 180),
      ),
    };
  }

  async getRecentRuns(
    companyId: string,
    limit: number = 10,
  ): Promise<MemoryMaintenanceRecentRun[]> {
    const rows = await this.prisma.auditLog.findMany({
      where: {
        companyId,
        action: {
          in: [
            'MEMORY_MAINTENANCE_RUN_COMPLETED',
            'MEMORY_MAINTENANCE_RUN_FAILED',
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(1, limit), 20),
    });

    return rows.map((row) => {
      const metadata = (row.metadata || {}) as Record<string, any>;
      const summary = (metadata.summary || null) as
        | MemoryMaintenanceRunSummary
        | null;

      return {
        id: row.id,
        createdAt: row.createdAt.toISOString(),
        status:
          row.action === 'MEMORY_MAINTENANCE_RUN_FAILED' ? 'FAILED' : 'COMPLETED',
        scope: (metadata.scope as MemoryMaintenanceRunScope | undefined) ?? null,
        playbookId:
          (metadata.playbookId as MemoryMaintenancePlaybookId | undefined) ?? null,
        userId: row.userId ?? null,
        reason: (metadata.reason as string | undefined) ?? null,
        actions: Array.isArray(metadata.actions)
          ? (metadata.actions as MemoryMaintenanceAction[])
          : [],
        totals: summary?.totals ?? null,
      };
    });
  }

  async hasRecentAutoRemediation(
    companyId: string,
    playbookId: MemoryMaintenancePlaybookId,
    cooldownMinutes: number,
  ): Promise<boolean> {
    const cutoff = new Date(Date.now() - cooldownMinutes * 60 * 1000);
    const recentRuns = await this.getRecentRuns(companyId, 20);

    return recentRuns.some(
      (run) =>
        run.scope === 'system_auto' &&
        run.playbookId === playbookId &&
        new Date(run.createdAt) >= cutoff,
    );
  }

  private async runMaintenance(
    input: MemoryMaintenanceRunInput,
  ): Promise<MemoryMaintenanceRunSummary> {
    const startedAt = new Date();
    const playbook = input.playbookId
      ? getMemoryMaintenancePlaybook(input.playbookId)
      : undefined;
    if (input.playbookId && !playbook) {
      throw new Error(`Unknown memory maintenance playbook: ${input.playbookId}`);
    }

    const scope = input.scope ?? 'tenant_manual';
    if (scope === 'system_auto' && playbook && !playbook.autoEligible) {
      throw new Error(
        `Playbook ${playbook.id} is not eligible for automatic remediation`,
      );
    }

    const actions = this.resolveActions(input.actions, playbook);
    const maxRuns = this.resolveMaxRuns(input.maxRuns, playbook);
    const reason = input.reason ?? playbook?.description ?? null;
    const results: MemoryMaintenanceActionResult[] = [];

    try {
      for (const action of actions) {
        results.push(await this.runAction(action, input.companyId, maxRuns));
      }

      const summary = this.buildSummary({
        companyId: input.companyId,
        actorUserId: input.actorUserId,
        playbookId: playbook?.id,
        actions,
        maxRuns,
        scope,
        reason: reason ?? undefined,
        startedAt,
        results,
      });

      await this.auditService.log({
        action: 'MEMORY_MAINTENANCE_RUN_COMPLETED',
        companyId: input.companyId,
        userId: input.actorUserId,
        metadata: {
          scope,
          playbookId: playbook?.id ?? null,
          actions,
          maxRuns,
          reason,
          summary,
        },
      });

      this.logger.log(
        `memory_maintenance_complete companyId=${input.companyId} scope=${scope} actor=${input.actorUserId ?? 'SYSTEM'} playbook=${playbook?.id ?? 'custom'} actions=${actions.join(',')} maxRuns=${maxRuns}`,
      );

      return summary;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      await this.auditService
        .log({
          action: 'MEMORY_MAINTENANCE_RUN_FAILED',
          companyId: input.companyId,
          userId: input.actorUserId,
          metadata: {
            scope,
            playbookId: playbook?.id ?? null,
            actions,
            maxRuns,
            reason,
            partialResults: results,
            error: errorMessage,
          },
        })
        .catch(() => undefined);

      this.logger.error(
        `memory_maintenance_failed companyId=${input.companyId} scope=${scope} actor=${input.actorUserId ?? 'SYSTEM'} playbook=${playbook?.id ?? 'custom'} actions=${actions.join(',')} error=${errorMessage}`,
      );
      throw error;
    }
  }

  private resolveActions(
    actions?: MemoryMaintenanceAction[],
    playbook?: MemoryMaintenancePlaybook,
  ): MemoryMaintenanceAction[] {
    if (playbook) {
      return [...playbook.actions];
    }

    if (!actions?.length) {
      return [...defaultMemoryMaintenanceActions];
    }

    return Array.from(new Set(actions));
  }

  private resolveMaxRuns(
    maxRuns?: number,
    playbook?: MemoryMaintenancePlaybook,
  ): number {
    const defaultMaxRuns = playbook?.defaultMaxRuns ?? this.defaultMaxRuns;
    const maxAllowedRuns = playbook?.maxAllowedRuns ?? this.maxAllowedRuns;

    if (typeof maxRuns !== 'number' || Number.isNaN(maxRuns)) {
      return defaultMaxRuns;
    }

    return Math.min(Math.max(1, Math.trunc(maxRuns)), maxAllowedRuns);
  }

  private async runAction(
    action: MemoryMaintenanceAction,
    companyId: string,
    maxRuns: number,
  ): Promise<MemoryMaintenanceActionResult> {
    switch (action) {
      case MemoryMaintenanceAction.CONSOLIDATION:
        return this.runConsolidation(companyId, maxRuns);
      case MemoryMaintenanceAction.PRUNING:
        return this.runInteractionPruning(companyId, maxRuns);
      case MemoryMaintenanceAction.ENGRAM_FORMATION:
        return this.runEngramFormation(companyId, maxRuns);
      case MemoryMaintenanceAction.ENGRAM_PRUNING:
        return this.runEngramPruning(companyId, maxRuns);
      default: {
        const exhaustiveCheck: never = action;
        throw new Error(`Unsupported maintenance action: ${exhaustiveCheck}`);
      }
    }
  }

  private async runConsolidation(
    companyId: string,
    maxRuns: number,
  ): Promise<MemoryMaintenanceActionResult> {
    let runs = 0;
    let drained = false;
    let episodesCreated = 0;
    let interactionsProcessed = 0;

    while (runs < maxRuns) {
      runs += 1;
      const result = await this.consolidationWorker.consolidate({ companyId });
      episodesCreated += result.episodesCreated;
      interactionsProcessed += result.interactionsProcessed;

      if (result.episodesCreated === 0 && result.interactionsProcessed === 0) {
        drained = true;
        break;
      }
    }

    return {
      action: MemoryMaintenanceAction.CONSOLIDATION,
      runs,
      drained,
      stats: {
        episodesCreated,
        interactionsProcessed,
      },
    };
  }

  private async runInteractionPruning(
    companyId: string,
    maxRuns: number,
  ): Promise<MemoryMaintenanceActionResult> {
    let runs = 0;
    let drained = false;
    let deleted = 0;

    while (runs < maxRuns) {
      runs += 1;
      const pruned = await this.consolidationWorker.pruneConsolidatedInteractions({
        companyId,
      });
      deleted += pruned;

      if (pruned === 0) {
        drained = true;
        break;
      }
    }

    return {
      action: MemoryMaintenanceAction.PRUNING,
      runs,
      drained,
      stats: {
        deleted,
      },
    };
  }

  private async runEngramFormation(
    companyId: string,
    maxRuns: number,
  ): Promise<MemoryMaintenanceActionResult> {
    let runs = 0;
    let drained = false;
    let formed = 0;
    let skipped = 0;

    while (runs < maxRuns) {
      runs += 1;
      const result = await this.engramFormationWorker.processCompletedTechMaps({
        companyId,
      });
      formed += result.formed;
      skipped += result.skipped;

      if (result.formed === 0) {
        drained = true;
        break;
      }
    }

    return {
      action: MemoryMaintenanceAction.ENGRAM_FORMATION,
      runs,
      drained,
      stats: {
        formed,
        skipped,
      },
    };
  }

  private async runEngramPruning(
    companyId: string,
    maxRuns: number,
  ): Promise<MemoryMaintenanceActionResult> {
    let runs = 0;
    let drained = false;
    let pruned = 0;

    while (runs < maxRuns) {
      runs += 1;
      const result = await this.engramFormationWorker.pruneInactiveEngrams({
        companyId,
      });
      pruned += result;

      if (result === 0) {
        drained = true;
        break;
      }
    }

    return {
      action: MemoryMaintenanceAction.ENGRAM_PRUNING,
      runs,
      drained,
      stats: {
        pruned,
      },
    };
  }

  private buildSummary(params: {
    companyId: string;
    actorUserId?: string;
    playbookId?: MemoryMaintenancePlaybookId;
    actions: MemoryMaintenanceAction[];
    maxRuns: number;
    scope: MemoryMaintenanceRunScope;
    reason?: string;
    startedAt: Date;
    results: MemoryMaintenanceActionResult[];
  }): MemoryMaintenanceRunSummary {
    const completedAt = new Date();

    return {
      companyId: params.companyId,
      actorUserId: params.actorUserId ?? null,
      playbookId: params.playbookId ?? null,
      actions: params.actions,
      maxRuns: params.maxRuns,
      scope: params.scope,
      reason: params.reason ?? null,
      startedAt: params.startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      durationMs: completedAt.getTime() - params.startedAt.getTime(),
      results: params.results,
      totals: {
        totalRuns: params.results.reduce((sum, item) => sum + item.runs, 0),
        consolidationEpisodesCreated: this.readStat(
          params.results,
          MemoryMaintenanceAction.CONSOLIDATION,
          'episodesCreated',
        ),
        consolidationInteractionsProcessed: this.readStat(
          params.results,
          MemoryMaintenanceAction.CONSOLIDATION,
          'interactionsProcessed',
        ),
        consolidatedInteractionsDeleted: this.readStat(
          params.results,
          MemoryMaintenanceAction.PRUNING,
          'deleted',
        ),
        engramsFormed: this.readStat(
          params.results,
          MemoryMaintenanceAction.ENGRAM_FORMATION,
          'formed',
        ),
        engramFormationSkipped: this.readStat(
          params.results,
          MemoryMaintenanceAction.ENGRAM_FORMATION,
          'skipped',
        ),
        engramsPruned: this.readStat(
          params.results,
          MemoryMaintenanceAction.ENGRAM_PRUNING,
          'pruned',
        ),
      },
    };
  }

  private buildRecommendation(
    playbookId: MemoryMaintenancePlaybookId,
    priority: number,
    reasons: string[],
  ): MemoryMaintenanceRecommendation {
    const playbook = getMemoryMaintenancePlaybook(playbookId);
    if (!playbook) {
      throw new Error(`Unknown memory maintenance playbook: ${playbookId}`);
    }

    return {
      playbookId,
      actions: [...playbook.actions],
      priority,
      reasons,
      autoEligible: playbook.autoEligible,
    };
  }

  private readStat(
    results: MemoryMaintenanceActionResult[],
    action: MemoryMaintenanceAction,
    statKey: string,
  ): number {
    return (
      results.find((result) => result.action === action)?.stats?.[statKey] ?? 0
    );
  }
}
