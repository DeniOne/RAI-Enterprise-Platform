import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { resolveMemoryLifecyclePause } from './memory-lifecycle-control.util';
import {
  MemoryLifecycleSnapshot,
  MemoryLifecycleThresholds,
} from './memory-maintenance.types';

interface MemoryLifecycleSnapshotOptions {
  companyId?: string;
}

@Injectable()
export class MemoryLifecycleObservabilityService {
  constructor(private readonly prisma: PrismaService) {}

  getThresholds(): MemoryLifecycleThresholds {
    return {
      oldestUnconsolidatedAgeSeconds: Number(
        process.env.INVARIANT_THRESHOLD_MEMORY_OLDEST_UNCONSOLIDATED_AGE_SECONDS ||
          21600,
      ),
      prunableConsolidatedInteractions: Number(
        process.env.INVARIANT_THRESHOLD_MEMORY_PRUNABLE_CONSOLIDATED || 1000,
      ),
      latestEngramFormationAgeSeconds: Number(
        process.env.INVARIANT_THRESHOLD_MEMORY_LATEST_ENGRAM_FORMATION_AGE_SECONDS ||
          604800,
      ),
      prunableActiveEngrams: Number(
        process.env.INVARIANT_THRESHOLD_MEMORY_PRUNABLE_ACTIVE_ENGRAMS || 500,
      ),
    };
  }

  async getSnapshot(
    options: MemoryLifecycleSnapshotOptions = {},
  ): Promise<MemoryLifecycleSnapshot> {
    const retentionDays = Number(process.env.MEMORY_S_TIER_RETENTION_DAYS || 7);
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const engramPruningMinWeight = Number(
      process.env.MEMORY_ENGRAM_PRUNING_MIN_WEIGHT || 0.15,
    );
    const engramPruningMaxInactiveDays = Number(
      process.env.MEMORY_ENGRAM_PRUNING_MAX_INACTIVE_DAYS || 45,
    );
    const thresholds = this.getThresholds();
    const engramPruningCutoff = new Date(
      Date.now() - engramPruningMaxInactiveDays * 24 * 60 * 60 * 1000,
    );
    const companyFilter = options.companyId
      ? { companyId: options.companyId }
      : {};

    const unconsolidatedWhere = {
      ...companyFilter,
      NOT: {
        attrs: {
          path: ['consolidated'],
          equals: true,
        },
      },
    };
    const prunableConsolidatedWhere = {
      ...companyFilter,
      createdAt: { lt: cutoff },
      attrs: {
        path: ['consolidated'],
        equals: true,
      },
    };
    const engramFormationCandidateWhere = {
      ...companyFilter,
      status: { in: ['ACTIVE' as any, 'ARCHIVED' as any] },
      NOT: {
        generationMetadata: {
          path: ['memoryLifecycle', 'engramFormed'],
          equals: true,
        },
      },
    };
    const prunableActiveEngramWhere = {
      ...companyFilter,
      isActive: true,
      OR: [
        { synapticWeight: { lt: engramPruningMinWeight } },
        { lastActivatedAt: { lt: engramPruningCutoff } },
        {
          lastActivatedAt: null,
          createdAt: { lt: engramPruningCutoff },
        },
      ],
    };

    const [
      unconsolidatedCount,
      oldestUnconsolidated,
      prunableConsolidatedCount,
      oldestPrunableConsolidated,
      activeEngramCount,
      latestEngram,
      engramFormationCandidateCount,
      oldestEngramFormationCandidate,
      prunableActiveEngramCount,
    ] = await Promise.all([
      (this.prisma as any).memoryInteraction.count({
        where: unconsolidatedWhere,
      }),
      (this.prisma as any).memoryInteraction.findFirst({
        where: unconsolidatedWhere,
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
      (this.prisma as any).memoryInteraction.count({
        where: prunableConsolidatedWhere,
      }),
      (this.prisma as any).memoryInteraction.findFirst({
        where: prunableConsolidatedWhere,
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true },
      }),
      (this.prisma as any).engram.count({
        where: {
          ...companyFilter,
          isActive: true,
        },
      }),
      (this.prisma as any).engram.findFirst({
        where: companyFilter,
        orderBy: { firstFormedAt: 'desc' },
        select: { firstFormedAt: true },
      }),
      (this.prisma as any).techMap.count({
        where: engramFormationCandidateWhere,
      }),
      (this.prisma as any).techMap.findFirst({
        where: engramFormationCandidateWhere,
        orderBy: { updatedAt: 'asc' },
        select: { updatedAt: true },
      }),
      (this.prisma as any).engram.count({
        where: prunableActiveEngramWhere,
      }),
    ]);

    const oldestUnconsolidatedAgeSeconds = oldestUnconsolidated?.createdAt
      ? this.toAgeSeconds(oldestUnconsolidated.createdAt)
      : 0;
    const oldestPrunableConsolidatedAgeSeconds =
      oldestPrunableConsolidated?.createdAt
        ? this.toAgeSeconds(oldestPrunableConsolidated.createdAt)
        : 0;
    const latestEngramFormationAgeSeconds = latestEngram?.firstFormedAt
      ? this.toAgeSeconds(latestEngram.firstFormedAt)
      : 0;
    const oldestEngramFormationCandidateAgeSeconds =
      oldestEngramFormationCandidate?.updatedAt
        ? this.toAgeSeconds(oldestEngramFormationCandidate.updatedAt)
        : 0;
    const engramFormationBudgetUsageRatio =
      thresholds.latestEngramFormationAgeSeconds > 0
        ? latestEngramFormationAgeSeconds /
          thresholds.latestEngramFormationAgeSeconds
        : 0;
    const engramPruningBudgetUsageRatio =
      thresholds.prunableActiveEngrams > 0
        ? prunableActiveEngramCount / thresholds.prunableActiveEngrams
        : 0;

    return {
      companyId: options.companyId ?? null,
      unconsolidatedCount,
      oldestUnconsolidatedAgeSeconds,
      prunableConsolidatedCount,
      oldestPrunableConsolidatedAgeSeconds,
      activeEngramCount,
      latestEngramFormationAgeSeconds,
      engramFormationCandidateCount,
      oldestEngramFormationCandidateAgeSeconds,
      prunableActiveEngramCount,
      engramFormationBudgetUsageRatio,
      engramPruningBudgetUsageRatio,
      retentionDays,
      engramPruningMinWeight,
      engramPruningMaxInactiveDays,
      pauseWindows: {
        consolidation: resolveMemoryLifecyclePause(
          process.env.MEMORY_CONSOLIDATION_PAUSE_UNTIL,
          process.env.MEMORY_CONSOLIDATION_PAUSE_REASON,
        ),
        pruning: resolveMemoryLifecyclePause(
          process.env.MEMORY_PRUNING_PAUSE_UNTIL,
          process.env.MEMORY_PRUNING_PAUSE_REASON,
        ),
        engramFormation: resolveMemoryLifecyclePause(
          process.env.MEMORY_ENGRAM_FORMATION_PAUSE_UNTIL,
          process.env.MEMORY_ENGRAM_FORMATION_PAUSE_REASON,
        ),
        engramPruning: resolveMemoryLifecyclePause(
          process.env.MEMORY_ENGRAM_PRUNING_PAUSE_UNTIL,
          process.env.MEMORY_ENGRAM_PRUNING_PAUSE_REASON,
        ),
      },
    };
  }

  private toAgeSeconds(value: Date): number {
    return Math.max(
      0,
      Math.floor((Date.now() - new Date(value).getTime()) / 1000),
    );
  }
}
