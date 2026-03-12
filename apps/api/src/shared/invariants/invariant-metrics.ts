type CounterKey =
  | "tenant_violation_rate"
  | "cross_tenant_access_attempts_total"
  | "illegal_transition_attempts_total"
  | "financial_invariant_failures_total"
  | "event_duplicates_prevented_total"
  | "reconciliation_alerts_total"
  | "memory_engram_formations_total"
  | "memory_engram_pruned_total"
  | "memory_auto_remediations_total"
  | "memory_auto_remediation_failures_total"
  | "retraining_sessions_triggered_total"
  | "model_deployments_total"
  | "critical_drift_alerts_total"
  | "k8s_job_failures_total";

class InvariantMetricsRegistry {
  private readonly counters: Record<CounterKey, number> = {
    tenant_violation_rate: 0,
    cross_tenant_access_attempts_total: 0,
    illegal_transition_attempts_total: 0,
    financial_invariant_failures_total: 0,
    event_duplicates_prevented_total: 0,
    reconciliation_alerts_total: 0,
    memory_engram_formations_total: 0,
    memory_engram_pruned_total: 0,
    memory_auto_remediations_total: 0,
    memory_auto_remediation_failures_total: 0,
    retraining_sessions_triggered_total: 0,
    model_deployments_total: 0,
    critical_drift_alerts_total: 0,
    k8s_job_failures_total: 0,
  };
  private readonly tenantViolationByTenant = new Map<string, number>();
  private readonly tenantViolationByModule = new Map<string, number>();

  increment(key: CounterKey, by = 1): void {
    this.counters[key] += by;
  }

  incrementTenantViolation(tenantKey: string, moduleKey: string): void {
    this.increment("tenant_violation_rate");
    this.increment("cross_tenant_access_attempts_total");
    this.tenantViolationByTenant.set(
      tenantKey,
      (this.tenantViolationByTenant.get(tenantKey) || 0) + 1,
    );
    this.tenantViolationByModule.set(
      moduleKey,
      (this.tenantViolationByModule.get(moduleKey) || 0) + 1,
    );
  }

  snapshot(): Record<CounterKey, number> {
    return { ...this.counters };
  }

  breakdown() {
    const byTenant = Object.fromEntries([
      ...this.tenantViolationByTenant.entries(),
    ]);
    const byModule = Object.fromEntries([
      ...this.tenantViolationByModule.entries(),
    ]);
    return {
      tenantViolationsByTenant: byTenant,
      tenantViolationsByModule: byModule,
    };
  }

  shouldTriggerFinancialPanic(threshold: number): boolean {
    if (!Number.isFinite(threshold) || threshold <= 0) {
      return false;
    }
    return this.counters.financial_invariant_failures_total >= threshold;
  }

  resetForTests(): void {
    for (const key of Object.keys(this.counters) as CounterKey[]) {
      this.counters[key] = 0;
    }
    this.tenantViolationByTenant.clear();
    this.tenantViolationByModule.clear();
  }
}

export const InvariantMetrics = new InvariantMetricsRegistry();
