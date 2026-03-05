import { Injectable, Logger } from "@nestjs/common";
import { createHash } from "crypto";
import {
  createAutonomousExecutionContext,
  RaiToolName,
} from "../tools/rai-tools.types";
import { RiskToolsRegistry } from "../tools/risk-tools.registry";

export interface MonitoringSignal {
  type: string;
  payload: Record<string, unknown>;
}

export interface MonitoringAgentInput {
  companyId: string;
  traceId: string;
  signals?: MonitoringSignal[];
}

export interface MonitoringAgentResult {
  agentName: "MonitoringAgent";
  status: "COMPLETED" | "FAILED" | "RATE_LIMITED";
  alertsEmitted: number;
  explain: string;
  traceId: string;
  signalsSnapshot?: Record<string, unknown>;
}

const ALERTS_PER_HOUR = 10;

@Injectable()
export class MonitoringAgent {
  private readonly logger = new Logger(MonitoringAgent.name);
  private readonly rateLimit = new Map<
    string,
    { count: number; resetAt: number }
  >();
  private readonly dedupHashes = new Map<string, Set<string>>();

  constructor(private readonly riskToolsRegistry: RiskToolsRegistry) {}

  async run(input: MonitoringAgentInput): Promise<MonitoringAgentResult> {
    const ctx = createAutonomousExecutionContext(
      input.companyId,
      input.traceId,
    );
    const signals = input.signals ?? this.mockSignals();
    const snapshot = {
      traceId: input.traceId,
      companyId: input.companyId,
      signals: signals.map((s) => ({ type: s.type, payload: s.payload })),
    };
    this.logger.log(
      `MonitoringAgent run companyId=${input.companyId} traceId=${input.traceId} signals=${signals.length}`,
    );

    if (!this.checkRateLimit(input.companyId)) {
      this.logger.warn(
        `Rate limit exceeded companyId=${input.companyId} traceId=${input.traceId}`,
      );
      return {
        agentName: "MonitoringAgent",
        status: "RATE_LIMITED",
        alertsEmitted: 0,
        explain: "Лимит алертов в час исчерпан.",
        traceId: input.traceId,
        signalsSnapshot: snapshot,
      };
    }

    const result = await this.riskToolsRegistry.execute(
      RaiToolName.EmitAlerts,
      { severity: "S4" },
      ctx,
    );
    const fingerprint = this.alertFingerprint(result);
    if (this.isDuplicate(input.companyId, fingerprint)) {
      this.logger.log(
        `Dedup skip companyId=${input.companyId} traceId=${input.traceId}`,
      );
      return {
        agentName: "MonitoringAgent",
        status: "COMPLETED",
        alertsEmitted: 0,
        explain: "Алерт совпадает с недавним, пропуск (дедупликация).",
        traceId: input.traceId,
        signalsSnapshot: snapshot,
      };
    }
    this.recordDedup(input.companyId, fingerprint);
    this.incRateLimit(input.companyId);

    this.logger.log(
      `Alert emitted companyId=${input.companyId} traceId=${input.traceId} count=${result.count} snapshot=${JSON.stringify(snapshot)}`,
    );
    return {
      agentName: "MonitoringAgent",
      status: "COMPLETED",
      alertsEmitted: result.count,
      explain: `Получено алертов: ${result.count}. Причина: ${JSON.stringify(signals.map((s) => s.type))}.`,
      traceId: input.traceId,
      signalsSnapshot: snapshot,
    };
  }

  private mockSignals(): MonitoringSignal[] {
    return [
      { type: "ndvi_drop", payload: { threshold: 0.1 } },
      { type: "frost_forecast", payload: { region: "stub", days: 3 } },
    ];
  }

  private alertFingerprint(result: { count: number; items: unknown[] }): string {
    const payload = JSON.stringify({
      count: result.count,
      items: result.items,
    });
    return createHash("sha256").update(payload).digest("hex").slice(0, 16);
  }

  private checkRateLimit(companyId: string): boolean {
    const now = Date.now();
    const entry = this.rateLimit.get(companyId);
    if (!entry) return true;
    if (now >= entry.resetAt) {
      this.rateLimit.delete(companyId);
      return true;
    }
    return entry.count < ALERTS_PER_HOUR;
  }

  private incRateLimit(companyId: string): void {
    const now = Date.now();
    const hour = 60 * 60 * 1000;
    const entry = this.rateLimit.get(companyId);
    if (!entry) {
      this.rateLimit.set(companyId, { count: 1, resetAt: now + hour });
      return;
    }
    if (now >= entry.resetAt) {
      this.rateLimit.set(companyId, { count: 1, resetAt: now + hour });
      return;
    }
    entry.count += 1;
  }

  private isDuplicate(companyId: string, hash: string): boolean {
    const set = this.dedupHashes.get(companyId);
    if (!set) return false;
    return set.has(hash);
  }

  private recordDedup(companyId: string, hash: string): void {
    let set = this.dedupHashes.get(companyId);
    if (!set) {
      set = new Set();
      this.dedupHashes.set(companyId, set);
    }
    set.add(hash);
    if (set.size > 100) {
      const arr = [...set];
      arr.shift();
      this.dedupHashes.set(companyId, new Set(arr));
    }
  }
}
