import { Injectable, Logger } from "@nestjs/common";
import { createHash } from "crypto";
import {
  createAutonomousExecutionContext,
  RaiToolName,
} from "../tools/rai-tools.types";
import { RiskToolsRegistry } from "../tools/risk-tools.registry";
import { OpenRouterGatewayService } from "../agent-platform/openrouter-gateway.service";
import { AgentPromptAssemblyService } from "../agent-platform/agent-prompt-assembly.service";
import {
  AgentExecutionRequest,
  EffectiveAgentKernelEntry,
} from "../agent-platform/agent-platform.types";
import { EvidenceReference } from "../dto/rai-chat.dto";

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
  evidence: EvidenceReference[];
  fallbackUsed: boolean;
}

const ALERTS_PER_HOUR = 10;

@Injectable()
export class MonitoringAgent {
  private readonly logger = new Logger(MonitoringAgent.name);
  private readonly rateLimit = new Map<string, { count: number; resetAt: number }>();
  private readonly dedupHashes = new Map<string, Set<string>>();

  constructor(
    private readonly riskToolsRegistry: RiskToolsRegistry,
    private readonly openRouterGateway: OpenRouterGatewayService,
    private readonly promptAssembly: AgentPromptAssemblyService,
  ) {}

  async run(
    input: MonitoringAgentInput,
    options?: { kernel?: EffectiveAgentKernelEntry; request?: AgentExecutionRequest },
  ): Promise<MonitoringAgentResult> {
    const ctx = createAutonomousExecutionContext(input.companyId, input.traceId);
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
      return {
        agentName: "MonitoringAgent",
        status: "RATE_LIMITED",
        alertsEmitted: 0,
        explain: "Лимит алертов в час исчерпан.",
        traceId: input.traceId,
        signalsSnapshot: snapshot,
        evidence: [],
        fallbackUsed: true,
      };
    }

    const result = await this.riskToolsRegistry.execute(
      RaiToolName.EmitAlerts,
      { severity: "S4" },
      ctx,
    );
    const fingerprint = this.alertFingerprint(result);
    if (this.isDuplicate(input.companyId, fingerprint)) {
      return {
        agentName: "MonitoringAgent",
        status: "COMPLETED",
        alertsEmitted: 0,
        explain: "Алерт совпадает с недавним, пропуск (дедупликация).",
        traceId: input.traceId,
        signalsSnapshot: snapshot,
        evidence: [],
        fallbackUsed: true,
      };
    }
    this.recordDedup(input.companyId, fingerprint);
    this.incRateLimit(input.companyId);

    let explain = `Получено алертов: ${result.count}. Причина: ${JSON.stringify(signals.map((s) => s.type))}.`;
    let fallbackUsed = true;
    if (options?.kernel && options.request) {
      try {
        const llm = await this.openRouterGateway.generate({
          traceId: input.traceId,
          agentRole: "monitoring",
          model: options.kernel.runtimeProfile.model,
          messages: this.promptAssembly.buildMessages(options.kernel, options.request).concat([
            {
              role: "user",
              content: `Monitoring snapshot: ${JSON.stringify(snapshot)}. Alert result: ${JSON.stringify(result)}.`,
            },
          ]),
          temperature: options.kernel.runtimeProfile.temperature,
          maxTokens: options.kernel.runtimeProfile.maxOutputTokens,
          timeoutMs: options.kernel.runtimeProfile.timeoutMs,
        });
        explain = llm.outputText;
        fallbackUsed = false;
      } catch {
        fallbackUsed = true;
      }
    }

    return {
      agentName: "MonitoringAgent",
      status: "COMPLETED",
      alertsEmitted: result.count,
      explain,
      traceId: input.traceId,
      signalsSnapshot: snapshot,
      evidence: [
        {
          claim: "Monitoring summary grounded in deterministic alert execution.",
          sourceType: "TOOL_RESULT",
          sourceId: RaiToolName.EmitAlerts,
          confidenceScore: 0.9,
        },
      ],
      fallbackUsed,
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
    if (!entry || now >= entry.resetAt) {
      this.rateLimit.set(companyId, { count: 1, resetAt: now + hour });
      return;
    }
    entry.count += 1;
  }

  private isDuplicate(companyId: string, hash: string): boolean {
    const set = this.dedupHashes.get(companyId);
    return set ? set.has(hash) : false;
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
