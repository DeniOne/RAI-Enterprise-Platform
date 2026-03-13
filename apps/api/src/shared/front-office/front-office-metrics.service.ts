import { Injectable } from "@nestjs/common";

type FrontOfficeResolutionMode =
  | "AUTO_REPLY"
  | "REQUEST_CLARIFICATION"
  | "PROCESS_DRAFT"
  | "HUMAN_HANDOFF";

type FrontOfficeReplyStatus = "SENT" | "FAILED" | "NOT_SENT" | string;

interface FrontOfficeCompanyMetricsState {
  outcomes: Record<FrontOfficeResolutionMode, number>;
  repliesSentTotal: number;
  deliveryFailuresTotal: number;
  clarificationDepthByThread: Map<string, number>;
  maxClarificationDepth: number;
  handoffCreatedTotal: number;
  handoffResolvedTotal: number;
  handoffInFlight: Map<string, number>;
  handoffLatencyMsSamples: number[];
}

interface FrontOfficeSloThresholds {
  handoffLatencyP95Ms: number;
  deliveryFailureRateMax: number;
  clarificationMaxDepth: number;
  humanHandoffShareMax: number;
  openHandoffsMax: number;
}

function createDefaultState(): FrontOfficeCompanyMetricsState {
  return {
    outcomes: {
      AUTO_REPLY: 0,
      REQUEST_CLARIFICATION: 0,
      PROCESS_DRAFT: 0,
      HUMAN_HANDOFF: 0,
    },
    repliesSentTotal: 0,
    deliveryFailuresTotal: 0,
    clarificationDepthByThread: new Map<string, number>(),
    maxClarificationDepth: 0,
    handoffCreatedTotal: 0,
    handoffResolvedTotal: 0,
    handoffInFlight: new Map<string, number>(),
    handoffLatencyMsSamples: [],
  };
}

@Injectable()
export class FrontOfficeMetricsService {
  private readonly stateByCompany = new Map<string, FrontOfficeCompanyMetricsState>();

  recordRoutingOutcome(
    companyId: string,
    resolutionMode: FrontOfficeResolutionMode,
  ): void {
    const state = this.getState(companyId);
    state.outcomes[resolutionMode] += 1;
  }

  recordReplyStatus(companyId: string, replyStatus: FrontOfficeReplyStatus): void {
    const state = this.getState(companyId);
    if (replyStatus === "SENT") {
      state.repliesSentTotal += 1;
      return;
    }
    if (replyStatus === "FAILED") {
      state.deliveryFailuresTotal += 1;
    }
  }

  recordClarificationRequest(companyId: string, threadKey: string): void {
    if (!threadKey) {
      return;
    }
    const state = this.getState(companyId);
    const nextDepth = (state.clarificationDepthByThread.get(threadKey) ?? 0) + 1;
    state.clarificationDepthByThread.set(threadKey, nextDepth);
    if (nextDepth > state.maxClarificationDepth) {
      state.maxClarificationDepth = nextDepth;
    }
  }

  recordHandoffCreated(
    companyId: string,
    handoffId: string,
    createdAt?: string | null,
  ): void {
    if (!handoffId) {
      return;
    }
    const state = this.getState(companyId);
    state.handoffCreatedTotal += 1;
    state.handoffInFlight.set(
      handoffId,
      createdAt ? new Date(createdAt).getTime() : Date.now(),
    );
  }

  recordHandoffResolved(
    companyId: string,
    handoffId: string,
    resolvedAt?: string | null,
  ): void {
    if (!handoffId) {
      return;
    }
    const state = this.getState(companyId);
    state.handoffResolvedTotal += 1;
    const startedAtMs = state.handoffInFlight.get(handoffId);
    state.handoffInFlight.delete(handoffId);
    if (typeof startedAtMs !== "number") {
      return;
    }

    const resolvedAtMs = resolvedAt ? new Date(resolvedAt).getTime() : Date.now();
    const latencyMs = Math.max(0, resolvedAtMs - startedAtMs);
    state.handoffLatencyMsSamples.push(latencyMs);
    if (state.handoffLatencyMsSamples.length > 1000) {
      state.handoffLatencyMsSamples.shift();
    }
  }

  recordHandoffClosed(companyId: string, handoffId: string): void {
    if (!handoffId) {
      return;
    }
    const state = this.getState(companyId);
    state.handoffInFlight.delete(handoffId);
  }

  snapshot(companyId: string) {
    const state = this.getState(companyId);
    const thresholds = this.resolveThresholds();
    const latencies = [...state.handoffLatencyMsSamples].sort((a, b) => a - b);
    const latencyCount = latencies.length;
    const latencySum = latencies.reduce((sum, value) => sum + value, 0);
    const p95Index =
      latencyCount > 0 ? Math.max(0, Math.ceil(latencyCount * 0.95) - 1) : -1;

    const outcomes = { ...state.outcomes };
    const outcomesTotal = Object.values(outcomes).reduce((sum, value) => sum + value, 0);
    const deliveryAttempts = state.repliesSentTotal + state.deliveryFailuresTotal;
    const deliveryFailureRate =
      deliveryAttempts > 0 ? state.deliveryFailuresTotal / deliveryAttempts : 0;
    const humanHandoffShare =
      outcomesTotal > 0 ? outcomes.HUMAN_HANDOFF / outcomesTotal : 0;
    const handoffLatencyP95 = p95Index >= 0 ? latencies[p95Index] : 0;

    const alerts = {
      handoffLatencyP95Breached: handoffLatencyP95 > thresholds.handoffLatencyP95Ms,
      deliveryFailureRateBreached:
        deliveryFailureRate > thresholds.deliveryFailureRateMax,
      clarificationDepthBreached:
        state.maxClarificationDepth > thresholds.clarificationMaxDepth,
      humanHandoffShareBreached:
        humanHandoffShare > thresholds.humanHandoffShareMax,
      openHandoffsBreached: state.handoffInFlight.size > thresholds.openHandoffsMax,
    };

    return {
      timestamp: new Date().toISOString(),
      thresholds,
      outcomes,
      derived: {
        outcomesTotal,
        deliveryAttempts,
        deliveryFailureRate,
        humanHandoffShare,
      },
      alerts,
      healthStatus: Object.values(alerts).some(Boolean) ? "degraded" : "healthy",
      delivery: {
        repliesSentTotal: state.repliesSentTotal,
        deliveryFailuresTotal: state.deliveryFailuresTotal,
      },
      clarification: {
        maxDepth: state.maxClarificationDepth,
        threadsTracked: state.clarificationDepthByThread.size,
        depthByThread: Object.fromEntries(state.clarificationDepthByThread),
      },
      handoff: {
        createdTotal: state.handoffCreatedTotal,
        resolvedTotal: state.handoffResolvedTotal,
        openTotal: state.handoffInFlight.size,
        latencyMs: {
          count: latencyCount,
          avg: latencyCount > 0 ? Math.round(latencySum / latencyCount) : 0,
          min: latencyCount > 0 ? latencies[0] : 0,
          max: latencyCount > 0 ? latencies[latencyCount - 1] : 0,
          p95: handoffLatencyP95,
        },
      },
    };
  }

  prometheus(companyId: string): string {
    const snapshot = this.snapshot(companyId);
    const lines: string[] = [];
    const prefix = "front_office";

    lines.push("# HELP front_office_intake_outcomes_total Intake routing outcomes.");
    lines.push("# TYPE front_office_intake_outcomes_total counter");
    for (const [mode, value] of Object.entries(snapshot.outcomes)) {
      lines.push(`${prefix}_intake_outcomes_total{mode="${mode}"} ${value}`);
    }

    lines.push("# HELP front_office_replies_sent_total Replies sent to external client.");
    lines.push("# TYPE front_office_replies_sent_total counter");
    lines.push(`${prefix}_replies_sent_total ${snapshot.delivery.repliesSentTotal}`);

    lines.push(
      "# HELP front_office_delivery_failures_total Failed external reply deliveries.",
    );
    lines.push("# TYPE front_office_delivery_failures_total counter");
    lines.push(
      `${prefix}_delivery_failures_total ${snapshot.delivery.deliveryFailuresTotal}`,
    );

    lines.push(
      "# HELP front_office_clarification_max_depth Maximum clarification loop depth.",
    );
    lines.push("# TYPE front_office_clarification_max_depth gauge");
    lines.push(`${prefix}_clarification_max_depth ${snapshot.clarification.maxDepth}`);

    lines.push("# HELP front_office_handoff_open_total Open handoffs.");
    lines.push("# TYPE front_office_handoff_open_total gauge");
    lines.push(`${prefix}_handoff_open_total ${snapshot.handoff.openTotal}`);

    lines.push(
      "# HELP front_office_handoff_latency_ms_p95 P95 handoff completion latency in milliseconds.",
    );
    lines.push("# TYPE front_office_handoff_latency_ms_p95 gauge");
    lines.push(`${prefix}_handoff_latency_ms_p95 ${snapshot.handoff.latencyMs.p95}`);

    lines.push("# HELP front_office_slo_handoff_latency_p95_ms_threshold SLO threshold.");
    lines.push("# TYPE front_office_slo_handoff_latency_p95_ms_threshold gauge");
    lines.push(
      `${prefix}_slo_handoff_latency_p95_ms_threshold ${snapshot.thresholds.handoffLatencyP95Ms}`,
    );

    lines.push("# HELP front_office_slo_delivery_failure_rate_threshold SLO threshold.");
    lines.push("# TYPE front_office_slo_delivery_failure_rate_threshold gauge");
    lines.push(
      `${prefix}_slo_delivery_failure_rate_threshold ${snapshot.thresholds.deliveryFailureRateMax}`,
    );

    lines.push("# HELP front_office_slo_clarification_max_depth_threshold SLO threshold.");
    lines.push("# TYPE front_office_slo_clarification_max_depth_threshold gauge");
    lines.push(
      `${prefix}_slo_clarification_max_depth_threshold ${snapshot.thresholds.clarificationMaxDepth}`,
    );

    lines.push("# HELP front_office_alerts Alert states as gauges (0/1).");
    lines.push("# TYPE front_office_alerts gauge");
    lines.push(
      `${prefix}_alerts{name="handoff_latency_p95"} ${snapshot.alerts.handoffLatencyP95Breached ? 1 : 0}`,
    );
    lines.push(
      `${prefix}_alerts{name="delivery_failure_rate"} ${snapshot.alerts.deliveryFailureRateBreached ? 1 : 0}`,
    );
    lines.push(
      `${prefix}_alerts{name="clarification_depth"} ${snapshot.alerts.clarificationDepthBreached ? 1 : 0}`,
    );
    lines.push(
      `${prefix}_alerts{name="human_handoff_share"} ${snapshot.alerts.humanHandoffShareBreached ? 1 : 0}`,
    );
    lines.push(
      `${prefix}_alerts{name="open_handoffs"} ${snapshot.alerts.openHandoffsBreached ? 1 : 0}`,
    );

    return `${lines.join("\n")}\n`;
  }

  resetForTests(): void {
    this.stateByCompany.clear();
  }

  private getState(companyId: string): FrontOfficeCompanyMetricsState {
    const key = companyId || "unknown";
    const existing = this.stateByCompany.get(key);
    if (existing) {
      return existing;
    }
    const created = createDefaultState();
    this.stateByCompany.set(key, created);
    return created;
  }

  private resolveThresholds(): FrontOfficeSloThresholds {
    return {
      handoffLatencyP95Ms: this.numberFromEnv(
        "FRONT_OFFICE_SLO_HANDOFF_P95_MS",
        30 * 60 * 1000,
      ),
      deliveryFailureRateMax: this.numberFromEnv(
        "FRONT_OFFICE_SLO_DELIVERY_FAILURE_RATE_MAX",
        0.1,
      ),
      clarificationMaxDepth: this.numberFromEnv(
        "FRONT_OFFICE_SLO_CLARIFICATION_MAX_DEPTH",
        3,
      ),
      humanHandoffShareMax: this.numberFromEnv(
        "FRONT_OFFICE_SLO_HUMAN_HANDOFF_SHARE_MAX",
        0.7,
      ),
      openHandoffsMax: this.numberFromEnv("FRONT_OFFICE_SLO_OPEN_HANDOFFS_MAX", 50),
    };
  }

  private numberFromEnv(key: string, fallback: number): number {
    const raw = process.env[key];
    if (!raw) {
      return fallback;
    }
    const value = Number(raw);
    return Number.isFinite(value) ? value : fallback;
  }
}
