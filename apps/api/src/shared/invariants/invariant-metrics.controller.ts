import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { Authorized } from '../auth/authorized.decorator';
import { OBSERVABILITY_ROLES } from '../auth/rbac.constants';
import { MemoryLifecycleObservabilityService } from '../memory/memory-lifecycle-observability.service';
import { PrismaService } from '../prisma/prisma.service';
import { InvariantMetrics } from './invariant-metrics';

@Controller('invariants')
export class InvariantMetricsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly memoryLifecycleObservability: MemoryLifecycleObservabilityService,
  ) {}

  @Get('metrics')
  @Authorized(...OBSERVABILITY_ROLES)
  async getMetrics() {
    const metrics = InvariantMetrics.snapshot();
    const memory = await this.memoryLifecycleObservability.getSnapshot();
    const memoryThresholds = this.memoryLifecycleObservability.getThresholds();
    const thresholds = {
      tenant_violation_rate: Number(
        process.env.INVARIANT_THRESHOLD_TENANT_VIOLATIONS || 1,
      ),
      cross_tenant_access_attempts_total: Number(
        process.env.INVARIANT_THRESHOLD_CROSS_TENANT || 1,
      ),
      illegal_transition_attempts_total: Number(
        process.env.INVARIANT_THRESHOLD_ILLEGAL_TRANSITIONS || 1,
      ),
      financial_invariant_failures_total: Number(
        process.env.INVARIANT_THRESHOLD_FINANCIAL_FAILURES || 1,
      ),
      event_duplicates_prevented_total: Number(
        process.env.INVARIANT_THRESHOLD_EVENT_DUPLICATES || 1,
      ),
      reconciliation_alerts_total: Number(
        process.env.INVARIANT_THRESHOLD_RECONCILIATION_ALERTS || 1,
      ),
      memory_oldest_unconsolidated_age_seconds:
        memoryThresholds.oldestUnconsolidatedAgeSeconds,
      memory_prunable_consolidated_interactions:
        memoryThresholds.prunableConsolidatedInteractions,
      memory_latest_engram_formation_age_seconds:
        memoryThresholds.latestEngramFormationAgeSeconds,
      memory_oldest_engram_formation_candidate_age_seconds:
        memoryThresholds.latestEngramFormationAgeSeconds,
      memory_prunable_active_engrams: memoryThresholds.prunableActiveEngrams,
    };
    const alerts = {
      tenant_violation_rate:
        metrics.tenant_violation_rate >= thresholds.tenant_violation_rate,
      cross_tenant_access_attempts_total:
        metrics.cross_tenant_access_attempts_total >=
        thresholds.cross_tenant_access_attempts_total,
      illegal_transition_attempts_total:
        metrics.illegal_transition_attempts_total >=
        thresholds.illegal_transition_attempts_total,
      financial_invariant_failures_total:
        metrics.financial_invariant_failures_total >=
        thresholds.financial_invariant_failures_total,
      event_duplicates_prevented_total:
        metrics.event_duplicates_prevented_total >=
        thresholds.event_duplicates_prevented_total,
      reconciliation_alerts_total:
        metrics.reconciliation_alerts_total >=
        thresholds.reconciliation_alerts_total,
      memory_oldest_unconsolidated_age_seconds:
        memory.oldestUnconsolidatedAgeSeconds >=
        thresholds.memory_oldest_unconsolidated_age_seconds,
      memory_prunable_consolidated_interactions:
        memory.prunableConsolidatedCount >=
        thresholds.memory_prunable_consolidated_interactions,
      memory_latest_engram_formation_age_seconds:
        memory.latestEngramFormationAgeSeconds >=
        thresholds.memory_latest_engram_formation_age_seconds,
      memory_engram_formation_candidates_stale:
        memory.engramFormationCandidateCount > 0 &&
        memory.oldestEngramFormationCandidateAgeSeconds >=
          thresholds.memory_oldest_engram_formation_candidate_age_seconds,
      memory_prunable_active_engrams:
        memory.prunableActiveEngramCount >=
        thresholds.memory_prunable_active_engrams,
    };
    const financialPanicThreshold = Number(
      process.env.FINANCIAL_PANIC_THRESHOLD || 5,
    );
    const panic = {
      financial: InvariantMetrics.shouldTriggerFinancialPanic(
        financialPanicThreshold,
      ),
      financialPanicThreshold,
    };
    const outbox = await this.getOutboxHealthSnapshot();

    return {
      timestamp: new Date().toISOString(),
      metrics,
      breakdown: InvariantMetrics.breakdown(),
      thresholds,
      alerts,
      panic,
      outbox,
      memory,
    };
  }

  @Get('metrics/prometheus')
  @Authorized(...OBSERVABILITY_ROLES)
  async getMetricsPrometheus(@Res() res: Response) {
    const metrics = InvariantMetrics.snapshot();
    const breakdown = InvariantMetrics.breakdown();
    const outbox = await this.getOutboxHealthSnapshot();
    const memory = await this.memoryLifecycleObservability.getSnapshot();
    const lines: string[] = [];

    lines.push(
      '# HELP invariant_tenant_violation_rate Total tenant contract violations.',
    );
    lines.push('# TYPE invariant_tenant_violation_rate counter');
    lines.push(
      `invariant_tenant_violation_rate ${metrics.tenant_violation_rate}`,
    );

    lines.push(
      '# HELP invariant_cross_tenant_access_attempts_total Total cross-tenant access attempts.',
    );
    lines.push('# TYPE invariant_cross_tenant_access_attempts_total counter');
    lines.push(
      `invariant_cross_tenant_access_attempts_total ${metrics.cross_tenant_access_attempts_total}`,
    );

    lines.push(
      '# HELP invariant_illegal_transition_attempts_total Total illegal FSM transition attempts.',
    );
    lines.push('# TYPE invariant_illegal_transition_attempts_total counter');
    lines.push(
      `invariant_illegal_transition_attempts_total ${metrics.illegal_transition_attempts_total}`,
    );

    lines.push(
      '# HELP invariant_financial_failures_total Total financial invariant failures.',
    );
    lines.push('# TYPE invariant_financial_failures_total counter');
    lines.push(
      `invariant_financial_failures_total ${metrics.financial_invariant_failures_total}`,
    );

    lines.push(
      '# HELP invariant_event_duplicates_prevented_total Total duplicate events prevented by relay.',
    );
    lines.push('# TYPE invariant_event_duplicates_prevented_total counter');
    lines.push(
      `invariant_event_duplicates_prevented_total ${metrics.event_duplicates_prevented_total}`,
    );

    lines.push(
      '# HELP invariant_reconciliation_alerts_total Total reconciliation anomalies detected.',
    );
    lines.push('# TYPE invariant_reconciliation_alerts_total counter');
    lines.push(
      `invariant_reconciliation_alerts_total ${metrics.reconciliation_alerts_total}`,
    );

    lines.push(
      '# HELP ai_memory_hint_shown_total Total AI responses where memory hint was shown.',
    );
    lines.push('# TYPE ai_memory_hint_shown_total counter');
    lines.push(
      `ai_memory_hint_shown_total ${metrics.ai_memory_hint_shown_total}`,
    );

    lines.push(
      '# HELP expert_review_requested_total Total expert review requests submitted.',
    );
    lines.push('# TYPE expert_review_requested_total counter');
    lines.push(
      `expert_review_requested_total ${metrics.expert_review_requested_total}`,
    );

    lines.push(
      '# HELP expert_review_completed_total Total expert reviews completed with outcome action.',
    );
    lines.push('# TYPE expert_review_completed_total counter');
    lines.push(
      `expert_review_completed_total ${metrics.expert_review_completed_total}`,
    );

    lines.push(
      '# HELP strategy_forecast_run_total Total strategy forecast runs.',
    );
    lines.push('# TYPE strategy_forecast_run_total counter');
    lines.push(
      `strategy_forecast_run_total ${metrics.strategy_forecast_run_total}`,
    );

    lines.push(
      '# HELP strategy_forecast_degraded_total Total strategy forecast runs completed in degraded mode.',
    );
    lines.push('# TYPE strategy_forecast_degraded_total counter');
    lines.push(
      `strategy_forecast_degraded_total ${metrics.strategy_forecast_degraded_total}`,
    );

    lines.push(
      '# HELP strategy_forecast_latency_ms Last observed latency for strategy forecast run, in milliseconds.',
    );
    lines.push('# TYPE strategy_forecast_latency_ms gauge');
    lines.push(
      `strategy_forecast_latency_ms ${metrics.strategy_forecast_latency_ms}`,
    );

    lines.push(
      '# HELP memory_lane_populated_total Total traces where memory lane was populated.',
    );
    lines.push('# TYPE memory_lane_populated_total counter');
    lines.push(
      `memory_lane_populated_total ${metrics.memory_lane_populated_total}`,
    );

    lines.push(
      '# HELP invariant_memory_engram_formations_total Total engrams formed by the memory lifecycle.',
    );
    lines.push('# TYPE invariant_memory_engram_formations_total counter');
    lines.push(
      `invariant_memory_engram_formations_total ${metrics.memory_engram_formations_total}`,
    );

    lines.push(
      '# HELP invariant_memory_engram_pruned_total Total active engrams deactivated by pruning.',
    );
    lines.push('# TYPE invariant_memory_engram_pruned_total counter');
    lines.push(
      `invariant_memory_engram_pruned_total ${metrics.memory_engram_pruned_total}`,
    );

    lines.push(
      '# HELP invariant_memory_auto_remediations_total Total successful automatic memory remediation runs.',
    );
    lines.push('# TYPE invariant_memory_auto_remediations_total counter');
    lines.push(
      `invariant_memory_auto_remediations_total ${metrics.memory_auto_remediations_total}`,
    );

    lines.push(
      '# HELP invariant_memory_auto_remediation_failures_total Total failed automatic memory remediation runs.',
    );
    lines.push(
      '# TYPE invariant_memory_auto_remediation_failures_total counter',
    );
    lines.push(
      `invariant_memory_auto_remediation_failures_total ${metrics.memory_auto_remediation_failures_total}`,
    );

    lines.push(
      '# HELP invariant_tenant_violations_by_tenant Tenant violation counter by tenant.',
    );
    lines.push('# TYPE invariant_tenant_violations_by_tenant counter');
    for (const [tenant, value] of Object.entries(
      breakdown.tenantViolationsByTenant,
    )) {
      lines.push(
        `invariant_tenant_violations_by_tenant{tenant="${this.escapeLabel(
          tenant,
        )}"} ${value}`,
      );
    }

    lines.push(
      '# HELP invariant_tenant_violations_by_module Tenant violation counter by module/model.',
    );
    lines.push('# TYPE invariant_tenant_violations_by_module counter');
    for (const [module, value] of Object.entries(
      breakdown.tenantViolationsByModule,
    )) {
      lines.push(
        `invariant_tenant_violations_by_module{module="${this.escapeLabel(
          module,
        )}"} ${value}`,
      );
    }

    lines.push(
      '# HELP outbox_pending_messages Number of outbox messages in PENDING status.',
    );
    lines.push('# TYPE outbox_pending_messages gauge');
    lines.push(`outbox_pending_messages ${outbox.pendingCount}`);

    lines.push(
      '# HELP outbox_processing_messages Number of outbox messages in PROCESSING status.',
    );
    lines.push('# TYPE outbox_processing_messages gauge');
    lines.push(`outbox_processing_messages ${outbox.processingCount}`);

    lines.push(
      '# HELP outbox_failed_messages Number of outbox messages in FAILED status (DLQ).',
    );
    lines.push('# TYPE outbox_failed_messages gauge');
    lines.push(`outbox_failed_messages ${outbox.failedCount}`);

    lines.push(
      '# HELP outbox_oldest_pending_age_seconds Oldest pending outbox message age in seconds.',
    );
    lines.push('# TYPE outbox_oldest_pending_age_seconds gauge');
    lines.push(
      `outbox_oldest_pending_age_seconds ${outbox.oldestPendingAgeSeconds}`,
    );

    lines.push(
      '# HELP memory_unconsolidated_interactions Number of memory interactions not yet consolidated.',
    );
    lines.push('# TYPE memory_unconsolidated_interactions gauge');
    lines.push(
      `memory_unconsolidated_interactions ${memory.unconsolidatedCount}`,
    );

    lines.push(
      '# HELP memory_oldest_unconsolidated_age_seconds Oldest unconsolidated memory interaction age in seconds.',
    );
    lines.push('# TYPE memory_oldest_unconsolidated_age_seconds gauge');
    lines.push(
      `memory_oldest_unconsolidated_age_seconds ${memory.oldestUnconsolidatedAgeSeconds}`,
    );

    lines.push(
      '# HELP memory_prunable_consolidated_interactions Number of consolidated interactions older than retention cutoff.',
    );
    lines.push('# TYPE memory_prunable_consolidated_interactions gauge');
    lines.push(
      `memory_prunable_consolidated_interactions ${memory.prunableConsolidatedCount}`,
    );

    lines.push(
      '# HELP memory_oldest_prunable_consolidated_age_seconds Oldest consolidated interaction age among entries already eligible for pruning.',
    );
    lines.push('# TYPE memory_oldest_prunable_consolidated_age_seconds gauge');
    lines.push(
      `memory_oldest_prunable_consolidated_age_seconds ${memory.oldestPrunableConsolidatedAgeSeconds}`,
    );

    lines.push(
      '# HELP memory_active_engrams Number of active engrams currently available.',
    );
    lines.push('# TYPE memory_active_engrams gauge');
    lines.push(`memory_active_engrams ${memory.activeEngramCount}`);

    lines.push(
      '# HELP memory_latest_engram_formation_age_seconds Age in seconds since the most recent engram formation.',
    );
    lines.push('# TYPE memory_latest_engram_formation_age_seconds gauge');
    lines.push(
      `memory_latest_engram_formation_age_seconds ${memory.latestEngramFormationAgeSeconds}`,
    );

    lines.push(
      '# HELP memory_engram_formation_candidates Number of TechMaps currently awaiting engram formation.',
    );
    lines.push('# TYPE memory_engram_formation_candidates gauge');
    lines.push(
      `memory_engram_formation_candidates ${memory.engramFormationCandidateCount}`,
    );

    lines.push(
      '# HELP memory_oldest_engram_formation_candidate_age_seconds Age in seconds of the oldest TechMap still awaiting engram formation.',
    );
    lines.push(
      '# TYPE memory_oldest_engram_formation_candidate_age_seconds gauge',
    );
    lines.push(
      `memory_oldest_engram_formation_candidate_age_seconds ${memory.oldestEngramFormationCandidateAgeSeconds}`,
    );

    lines.push(
      '# HELP memory_prunable_active_engrams Number of active engrams currently matching pruning criteria.',
    );
    lines.push('# TYPE memory_prunable_active_engrams gauge');
    lines.push(
      `memory_prunable_active_engrams ${memory.prunableActiveEngramCount}`,
    );

    lines.push(
      '# HELP memory_engram_formation_budget_usage_ratio Budget usage ratio for engram formation freshness threshold.',
    );
    lines.push('# TYPE memory_engram_formation_budget_usage_ratio gauge');
    lines.push(
      `memory_engram_formation_budget_usage_ratio ${memory.engramFormationBudgetUsageRatio}`,
    );

    lines.push(
      '# HELP memory_engram_pruning_budget_usage_ratio Budget usage ratio for active engram pruning threshold.',
    );
    lines.push('# TYPE memory_engram_pruning_budget_usage_ratio gauge');
    lines.push(
      `memory_engram_pruning_budget_usage_ratio ${memory.engramPruningBudgetUsageRatio}`,
    );

    lines.push(
      '# HELP memory_auto_remediation_enabled Whether automatic memory remediation is enabled.',
    );
    lines.push('# TYPE memory_auto_remediation_enabled gauge');
    lines.push(
      `memory_auto_remediation_enabled ${this.isMemoryAutoRemediationEnabled() ? 1 : 0}`,
    );

    lines.push(
      '# HELP memory_consolidation_paused Whether the memory consolidation lifecycle is currently paused by operator window.',
    );
    lines.push('# TYPE memory_consolidation_paused gauge');
    lines.push(
      `memory_consolidation_paused ${memory.pauseWindows.consolidation.paused ? 1 : 0}`,
    );

    lines.push(
      '# HELP memory_consolidation_pause_remaining_seconds Remaining seconds in the memory consolidation pause window.',
    );
    lines.push('# TYPE memory_consolidation_pause_remaining_seconds gauge');
    lines.push(
      `memory_consolidation_pause_remaining_seconds ${memory.pauseWindows.consolidation.remainingSeconds}`,
    );

    lines.push(
      '# HELP memory_pruning_paused Whether the memory pruning lifecycle is currently paused by operator window.',
    );
    lines.push('# TYPE memory_pruning_paused gauge');
    lines.push(
      `memory_pruning_paused ${memory.pauseWindows.pruning.paused ? 1 : 0}`,
    );

    lines.push(
      '# HELP memory_pruning_pause_remaining_seconds Remaining seconds in the memory pruning pause window.',
    );
    lines.push('# TYPE memory_pruning_pause_remaining_seconds gauge');
    lines.push(
      `memory_pruning_pause_remaining_seconds ${memory.pauseWindows.pruning.remainingSeconds}`,
    );

    lines.push(
      '# HELP memory_engram_formation_paused Whether the engram formation lifecycle is currently paused by operator window.',
    );
    lines.push('# TYPE memory_engram_formation_paused gauge');
    lines.push(
      `memory_engram_formation_paused ${memory.pauseWindows.engramFormation.paused ? 1 : 0}`,
    );

    lines.push(
      '# HELP memory_engram_formation_pause_remaining_seconds Remaining seconds in the engram formation pause window.',
    );
    lines.push('# TYPE memory_engram_formation_pause_remaining_seconds gauge');
    lines.push(
      `memory_engram_formation_pause_remaining_seconds ${memory.pauseWindows.engramFormation.remainingSeconds}`,
    );

    lines.push(
      '# HELP memory_engram_pruning_paused Whether the engram pruning lifecycle is currently paused by operator window.',
    );
    lines.push('# TYPE memory_engram_pruning_paused gauge');
    lines.push(
      `memory_engram_pruning_paused ${memory.pauseWindows.engramPruning.paused ? 1 : 0}`,
    );

    lines.push(
      '# HELP memory_engram_pruning_pause_remaining_seconds Remaining seconds in the engram pruning pause window.',
    );
    lines.push('# TYPE memory_engram_pruning_pause_remaining_seconds gauge');
    lines.push(
      `memory_engram_pruning_pause_remaining_seconds ${memory.pauseWindows.engramPruning.remainingSeconds}`,
    );

    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    res.status(200).send(`${lines.join('\n')}\n`);
  }

  private escapeLabel(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  private isMemoryAutoRemediationEnabled(): boolean {
    return (
      (process.env.MEMORY_AUTO_REMEDIATION_ENABLED || 'false').toLowerCase() ===
      'true'
    );
  }

  private async getOutboxHealthSnapshot() {
    const [pendingCount, processingCount, failedCount, oldestPending] =
      await Promise.all([
        (this.prisma as any).outboxMessage.count({
          where: { status: 'PENDING' },
        }),
        (this.prisma as any).outboxMessage.count({
          where: { status: 'PROCESSING' },
        }),
        (this.prisma as any).outboxMessage.count({
          where: { status: 'FAILED' },
        }),
        (this.prisma as any).outboxMessage.findFirst({
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'asc' },
          select: { createdAt: true },
        }),
      ]);

    const oldestPendingAgeSeconds = oldestPending?.createdAt
      ? Math.max(
          0,
          Math.floor(
            (Date.now() - new Date(oldestPending.createdAt).getTime()) / 1000,
          ),
        )
      : 0;

    return {
      pendingCount,
      processingCount,
      failedCount,
      oldestPendingAgeSeconds,
    };
  }
}
