import { Controller, Get, Res, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { InvariantMetrics } from "./invariant-metrics";
import { Response } from "express";
import { PrismaService } from "../prisma/prisma.service";

@Controller("invariants")
@UseGuards(JwtAuthGuard)
export class InvariantMetricsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("metrics")
  async getMetrics() {
    const metrics = InvariantMetrics.snapshot();
    const thresholds = {
      tenant_violation_rate: Number(process.env.INVARIANT_THRESHOLD_TENANT_VIOLATIONS || 1),
      cross_tenant_access_attempts_total: Number(process.env.INVARIANT_THRESHOLD_CROSS_TENANT || 1),
      illegal_transition_attempts_total: Number(process.env.INVARIANT_THRESHOLD_ILLEGAL_TRANSITIONS || 1),
      financial_invariant_failures_total: Number(process.env.INVARIANT_THRESHOLD_FINANCIAL_FAILURES || 1),
      event_duplicates_prevented_total: Number(process.env.INVARIANT_THRESHOLD_EVENT_DUPLICATES || 1),
      reconciliation_alerts_total: Number(process.env.INVARIANT_THRESHOLD_RECONCILIATION_ALERTS || 1),
    };
    const alerts = {
      tenant_violation_rate: metrics.tenant_violation_rate >= thresholds.tenant_violation_rate,
      cross_tenant_access_attempts_total:
        metrics.cross_tenant_access_attempts_total >= thresholds.cross_tenant_access_attempts_total,
      illegal_transition_attempts_total:
        metrics.illegal_transition_attempts_total >= thresholds.illegal_transition_attempts_total,
      financial_invariant_failures_total:
        metrics.financial_invariant_failures_total >= thresholds.financial_invariant_failures_total,
      event_duplicates_prevented_total:
        metrics.event_duplicates_prevented_total >= thresholds.event_duplicates_prevented_total,
      reconciliation_alerts_total:
        metrics.reconciliation_alerts_total >= thresholds.reconciliation_alerts_total,
    };
    const financialPanicThreshold = Number(process.env.FINANCIAL_PANIC_THRESHOLD || 5);
    const panic = {
      financial: InvariantMetrics.shouldTriggerFinancialPanic(financialPanicThreshold),
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
    };
  }

  @Get("metrics/prometheus")
  async getMetricsPrometheus(@Res() res: Response) {
    const metrics = InvariantMetrics.snapshot();
    const breakdown = InvariantMetrics.breakdown();
    const outbox = await this.getOutboxHealthSnapshot();
    const lines: string[] = [];

    lines.push("# HELP invariant_tenant_violation_rate Total tenant contract violations.");
    lines.push("# TYPE invariant_tenant_violation_rate counter");
    lines.push(`invariant_tenant_violation_rate ${metrics.tenant_violation_rate}`);

    lines.push("# HELP invariant_cross_tenant_access_attempts_total Total cross-tenant access attempts.");
    lines.push("# TYPE invariant_cross_tenant_access_attempts_total counter");
    lines.push(
      `invariant_cross_tenant_access_attempts_total ${metrics.cross_tenant_access_attempts_total}`,
    );

    lines.push("# HELP invariant_illegal_transition_attempts_total Total illegal FSM transition attempts.");
    lines.push("# TYPE invariant_illegal_transition_attempts_total counter");
    lines.push(
      `invariant_illegal_transition_attempts_total ${metrics.illegal_transition_attempts_total}`,
    );

    lines.push("# HELP invariant_financial_failures_total Total financial invariant failures.");
    lines.push("# TYPE invariant_financial_failures_total counter");
    lines.push(
      `invariant_financial_failures_total ${metrics.financial_invariant_failures_total}`,
    );

    lines.push("# HELP invariant_event_duplicates_prevented_total Total duplicate events prevented by relay.");
    lines.push("# TYPE invariant_event_duplicates_prevented_total counter");
    lines.push(
      `invariant_event_duplicates_prevented_total ${metrics.event_duplicates_prevented_total}`,
    );

    lines.push("# HELP invariant_reconciliation_alerts_total Total reconciliation anomalies detected.");
    lines.push("# TYPE invariant_reconciliation_alerts_total counter");
    lines.push(
      `invariant_reconciliation_alerts_total ${metrics.reconciliation_alerts_total}`,
    );

    lines.push("# HELP invariant_tenant_violations_by_tenant Tenant violation counter by tenant.");
    lines.push("# TYPE invariant_tenant_violations_by_tenant counter");
    for (const [tenant, value] of Object.entries(breakdown.tenantViolationsByTenant)) {
      lines.push(
        `invariant_tenant_violations_by_tenant{tenant="${this.escapeLabel(
          tenant,
        )}"} ${value}`,
      );
    }

    lines.push("# HELP invariant_tenant_violations_by_module Tenant violation counter by module/model.");
    lines.push("# TYPE invariant_tenant_violations_by_module counter");
    for (const [module, value] of Object.entries(breakdown.tenantViolationsByModule)) {
      lines.push(
        `invariant_tenant_violations_by_module{module="${this.escapeLabel(
          module,
        )}"} ${value}`,
      );
    }

    lines.push("# HELP outbox_pending_messages Number of outbox messages in PENDING status.");
    lines.push("# TYPE outbox_pending_messages gauge");
    lines.push(`outbox_pending_messages ${outbox.pendingCount}`);

    lines.push("# HELP outbox_processing_messages Number of outbox messages in PROCESSING status.");
    lines.push("# TYPE outbox_processing_messages gauge");
    lines.push(`outbox_processing_messages ${outbox.processingCount}`);

    lines.push("# HELP outbox_failed_messages Number of outbox messages in FAILED status (DLQ).");
    lines.push("# TYPE outbox_failed_messages gauge");
    lines.push(`outbox_failed_messages ${outbox.failedCount}`);

    lines.push("# HELP outbox_oldest_pending_age_seconds Oldest pending outbox message age in seconds.");
    lines.push("# TYPE outbox_oldest_pending_age_seconds gauge");
    lines.push(`outbox_oldest_pending_age_seconds ${outbox.oldestPendingAgeSeconds}`);

    res.setHeader("Content-Type", "text/plain; version=0.0.4");
    res.status(200).send(`${lines.join("\n")}\n`);
  }

  private escapeLabel(value: string): string {
    return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  private async getOutboxHealthSnapshot() {
    const [pendingCount, processingCount, failedCount, oldestPending] = await Promise.all([
      (this.prisma as any).outboxMessage.count({ where: { status: "PENDING" } }),
      (this.prisma as any).outboxMessage.count({ where: { status: "PROCESSING" } }),
      (this.prisma as any).outboxMessage.count({ where: { status: "FAILED" } }),
      (this.prisma as any).outboxMessage.findFirst({
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      }),
    ]);

    const oldestPendingAgeSeconds = oldestPending?.createdAt
      ? Math.max(0, Math.floor((Date.now() - new Date(oldestPending.createdAt).getTime()) / 1000))
      : 0;

    return {
      pendingCount,
      processingCount,
      failedCount,
      oldestPendingAgeSeconds,
    };
  }
}
