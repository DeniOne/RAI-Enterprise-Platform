import { Injectable, Logger } from "@nestjs/common";
import { RaiToolActorContext } from "../tools/rai-tools.types";
import type { EvidenceReference } from "../dto/rai-chat.dto";
import { OpenRouterGatewayService } from "../agent-platform/openrouter-gateway.service";
import { AgentPromptAssemblyService } from "../agent-platform/agent-prompt-assembly.service";
import {
    AgentExecutionRequest,
    EffectiveAgentKernelEntry,
} from "../agent-platform/agent-platform.types";
import { ChiefAgronomistService } from "../expert/chief-agronomist.service";
import { ExpertMode } from "../expert/expert-invocation.engine";

/**
 * ChiefAgronomistAgent — Phase 3
 * 
 * Обертка над ChiefAgronomistService для интеграции в общую шину агентов.
 * Использует PRO-модель для глубокой экспертизы.
 */

export interface ChiefAgronomistAgentInput {
    companyId: string;
    traceId: string;
    intent: "expert_opinion" | "alert_review" | "tech_map_review";
    query: string;
    mode?: ExpertMode;
    context?: {
        fieldId?: string;
        cropZoneId?: string;
        alertId?: string;
        techMapId?: string;
        crop?: string;
    };
}

export interface ChiefAgronomistAgentResult {
    agentName: "ChiefAgronomistAgent";
    status: "COMPLETED" | "FAILED" | "NEEDS_MORE_DATA";
    data: unknown;
    confidence: number;
    explain: string;
    traceId: string;
    evidence: EvidenceReference[];
    recommendations: any[];
    alternatives?: any[];
}

@Injectable()
export class ChiefAgronomistAgent {
    private readonly logger = new Logger(ChiefAgronomistAgent.name);

    constructor(
        private readonly chiefService: ChiefAgronomistService,
        private readonly openRouterGateway: OpenRouterGatewayService,
        private readonly promptAssembly: AgentPromptAssemblyService,
    ) { }

    async run(
        input: ChiefAgronomistAgentInput,
        options?: { kernel?: EffectiveAgentKernelEntry; request?: AgentExecutionRequest },
    ): Promise<ChiefAgronomistAgentResult> {
        const actorContext: RaiToolActorContext = {
            companyId: input.companyId,
            traceId: input.traceId,
        };

        this.logger.log(`running chief_agronomist_agent intent=${input.intent} mode=${input.mode ?? 'full_pro'}`);

        try {
            if (input.intent === "expert_opinion") {
                const result = await this.chiefService.deepExpertise(
                    input.companyId,
                    input.query,
                    input.traceId,
                    input.context,
                    options?.request?.userId,
                );

                const evidence: EvidenceReference[] = result.evidence.map(e => ({
                    claim: e.content,
                    sourceType: "MEMORY_ENGRAM",
                    sourceId: e.source,
                    confidenceScore: result.confidence,
                }));

                // Synthesis with LLM if kernel is available
                const synthesis = await this.synthesize(
                    options?.kernel,
                    options?.request,
                    result.opinion,
                    "Ты — Главный Цифровой Агроном. Твоя задача — дать финальное, взвешенное экспертное заключение. Будь строг, точен и опирайся на предоставленные факты опыта (энграммы).",
                    result.opinion,
                );

                return {
                    agentName: "ChiefAgronomistAgent",
                    status: "COMPLETED",
                    data: result,
                    confidence: result.confidence,
                    explain: synthesis.text,
                    traceId: input.traceId,
                    evidence,
                    recommendations: result.recommendations,
                    alternatives: result.alternatives,
                };
            }

            if (input.intent === "alert_review") {
                const tips = await this.chiefService.generateAlertTips(input.companyId, input.traceId);

                return {
                    agentName: "ChiefAgronomistAgent",
                    status: "COMPLETED",
                    data: { tips },
                    confidence: tips.length > 0 ? Math.max(...tips.map(t => t.confidence)) : 0.5,
                    explain: tips.length > 0
                        ? `Сформировано ${tips.length} агро-советов на основе анализа аномалий и опыта прошлых сезонов.`
                        : "Аномалий требующих экспертного вмешательства не обнаружено.",
                    traceId: input.traceId,
                    evidence: tips.map(t => ({
                        claim: t.message,
                        sourceType: "MEMORY_ENGRAM",
                        sourceId: t.engramId || 'alert',
                        confidenceScore: t.confidence,
                    })),
                    recommendations: tips.map(t => ({
                        action: t.message,
                        priority: t.severity,
                        rationale: t.rationale,
                    })),
                };
            }

            // Default fallback
            return {
                agentName: "ChiefAgronomistAgent",
                status: "FAILED",
                data: {},
                confidence: 0,
                explain: "Intent not supported",
                traceId: input.traceId,
                evidence: [],
                recommendations: [],
            };

        } catch (err) {
            this.logger.error(`ChiefAgronomistAgent error: ${err.message}`);
            return {
                agentName: "ChiefAgronomistAgent",
                status: "FAILED",
                data: {},
                confidence: 0,
                explain: `Ошибка экспертного вызова: ${err.message}`,
                traceId: input.traceId,
                evidence: [],
                recommendations: [],
            };
        }
    }

    private async synthesize(
        kernel: EffectiveAgentKernelEntry | undefined,
        request: AgentExecutionRequest | undefined,
        baseExpertOpinion: string,
        instruction: string,
        fallbackText: string,
    ): Promise<{ text: string; fallbackUsed: boolean }> {
        if (!kernel || !request) {
            return { text: fallbackText, fallbackUsed: true };
        }

        try {
            const llm = await this.openRouterGateway.generate({
                traceId: request.traceId,
                agentRole: "chief_agronomist",
                model: kernel.runtimeProfile.model || 'google/gemini-2.0-flash-001',
                messages: this.promptAssembly.buildMessages(kernel, request).concat([
                    {
                        role: "user",
                        content: `${instruction}\nБазовое заключение системы: ${baseExpertOpinion}`,
                    },
                ]),
                temperature: 0.2, // Experts are more stable
                maxTokens: 2000,
                timeoutMs: 60000,
            });
            return { text: llm.outputText, fallbackUsed: false };
        } catch {
            return { text: fallbackText, fallbackUsed: true };
        }
    }
}
