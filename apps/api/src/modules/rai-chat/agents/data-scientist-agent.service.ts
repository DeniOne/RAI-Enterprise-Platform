import { Injectable, Logger } from "@nestjs/common";
import { RaiToolActorContext } from "../tools/rai-tools.types";
import type { EvidenceReference } from "../dto/rai-chat.dto";
import { OpenRouterGatewayService } from "../agent-platform/openrouter-gateway.service";
import { AgentPromptAssemblyService } from "../agent-platform/agent-prompt-assembly.service";
import {
    AgentExecutionRequest,
    EffectiveAgentKernelEntry,
} from "../agent-platform/agent-platform.types";
import { DataScientistService } from "../expert/data-scientist.service";

/**
 * DataScientistAgent — Phase 5
 * 
 * Обертка над DataScientistService для интеграции в общую шину агентов.
 * Отвечает за прогнозы урожайности, аналитику рисков и оптимизацию затрат.
 */

export interface DataScientistAgentInput {
    companyId: string;
    traceId: string;
    intent: "yield_prediction" | "disease_risk" | "cost_optimization" | "seasonal_report" | "pattern_mining" | "what_if";
    query?: string;
    fieldId?: string;
    crop?: string;
    seasonId?: string;
    scenario?: any;
}

export interface DataScientistAgentResult {
    agentName: "DataScientistAgent";
    status: "COMPLETED" | "FAILED" | "NEEDS_MORE_DATA";
    data: unknown;
    confidence: number;
    explain: string;
    traceId: string;
    evidence: EvidenceReference[];
}

@Injectable()
export class DataScientistAgent {
    private readonly logger = new Logger(DataScientistAgent.name);

    constructor(
        private readonly dsService: DataScientistService,
        private readonly openRouterGateway: OpenRouterGatewayService,
        private readonly promptAssembly: AgentPromptAssemblyService,
    ) { }

    async run(
        input: DataScientistAgentInput,
        options?: { kernel?: EffectiveAgentKernelEntry; request?: AgentExecutionRequest },
    ): Promise<DataScientistAgentResult> {
        const actorContext: RaiToolActorContext = {
            companyId: input.companyId,
            traceId: input.traceId,
        };

        this.logger.log(`running data_scientist_agent intent=${input.intent}`);

        try {
            let result: any;
            let explanation = "";

            switch (input.intent) {
                case "yield_prediction":
                    if (!input.fieldId || !input.crop) {
                        return this.needsMoreData(["fieldId", "crop"], input.traceId);
                    }
                    result = await this.dsService.predictYield(input.companyId, input.fieldId, input.crop, input.seasonId);
                    explanation = `Прогноз урожайности для культуры ${input.crop}: ${result.predictedYield} ${result.unit} (уверенность: ${(result.confidence * 100).toFixed(0)}%).`;
                    break;

                case "disease_risk":
                    if (!input.fieldId || !input.crop) {
                        return this.needsMoreData(["fieldId", "crop"], input.traceId);
                    }
                    result = await this.dsService.assessDiseaseRisk(input.companyId, input.fieldId, input.crop);
                    explanation = `Средний риск заболеваний для поля: ${(result.overallRisk * 100).toFixed(0)}%. ${result.risks.length} патогенов проанализировано.`;
                    break;

                case "cost_optimization":
                    if (!input.seasonId) {
                        return this.needsMoreData(["seasonId"], input.traceId);
                    }
                    result = await this.dsService.analyzeCosts(input.companyId, input.seasonId);
                    explanation = `Проведен анализ затрат. Выявлено ${result.optimizations.length} точек потенциальной оптимизации на сумму до ${result.optimizations.reduce((s: number, o: any) => s + o.savingPotential, 0)} ₽/га.`;
                    break;

                case "seasonal_report":
                    if (!input.seasonId) {
                        return this.needsMoreData(["seasonId"], input.traceId);
                    }
                    result = await this.dsService.generateSeasonalReport(input.companyId, input.seasonId);
                    explanation = `Сформирован ${result.type} отчет. Проанализировано ${result.sections.engramSummary.totalActive} энграмм опыта.`;
                    break;

                case "pattern_mining":
                    result = await this.dsService.minePatterns(input.companyId);
                    explanation = `Завершен поиск паттернов в данных памяти. Выявлено ${result.length} устойчивых кластеров опыта.`;
                    break;

                case "what_if":
                    if (!input.scenario) {
                        return this.needsMoreData(["scenario"], input.traceId);
                    }
                    result = await this.dsService.whatIf(input.companyId, input.scenario);
                    explanation = `Анализ сценария "${input.scenario.type}": ${result.recommendation}`;
                    break;

                default:
                    return {
                        agentName: "DataScientistAgent",
                        status: "FAILED",
                        data: {},
                        confidence: 0,
                        explain: "Intent not supported",
                        traceId: input.traceId,
                        evidence: [],
                    };
            }

            // Synthesis with LLM
            const synthesis = await this.synthesize(
                options?.kernel,
                options?.request,
                explanation,
                result,
                "Ты — Цифровой Аналитик-Дата-Сайентист (Data Scientist). Твоя задача — интерпретировать сухие цифры аналитики в понятные бизнес-выводы. Подсвечивай риски и возможности.",
                explanation,
            );

            return {
                agentName: "DataScientistAgent",
                status: "COMPLETED",
                data: result,
                confidence: result.confidence || 0.8,
                explain: synthesis.text,
                traceId: input.traceId,
                evidence: [
                    {
                        claim: explanation,
                        sourceType: "TOOL_RESULT",
                        sourceId: `ds_service_${input.intent}`,
                        confidenceScore: result.confidence || 0.8,
                    }
                ],
            };

        } catch (err) {
            this.logger.error(`DataScientistAgent error: ${err.message}`);
            return {
                agentName: "DataScientistAgent",
                status: "FAILED",
                data: {},
                confidence: 0,
                explain: `Ошибка аналитического вызова: ${err.message}`,
                traceId: input.traceId,
                evidence: [],
            };
        }
    }

    private needsMoreData(fields: string[], traceId: string): DataScientistAgentResult {
        return {
            agentName: "DataScientistAgent",
            status: "NEEDS_MORE_DATA",
            data: { missingFields: fields },
            confidence: 0,
            explain: `Для выполнения задачи требуются дополнительные параметры: ${fields.join(", ")}`,
            traceId,
            evidence: [],
        };
    }

    private async synthesize(
        kernel: EffectiveAgentKernelEntry | undefined,
        request: AgentExecutionRequest | undefined,
        baseExplanation: string,
        data: any,
        instruction: string,
        fallbackText: string,
    ): Promise<{ text: string; fallbackUsed: boolean }> {
        if (!kernel || !request) {
            return { text: fallbackText, fallbackUsed: true };
        }

        try {
            const llm = await this.openRouterGateway.generate({
                traceId: request.traceId,
                agentRole: "data_scientist",
                model: kernel.runtimeProfile.model || 'google/gemini-2.0-flash-001',
                messages: this.promptAssembly.buildMessages(kernel, request).concat([
                    {
                        role: "user",
                        content: `${instruction}\nБазовый вывод: ${baseExplanation}\nПолные данные: ${JSON.stringify(data)}`,
                    },
                ]),
                temperature: 0.1, // Analytics should be very precise
                maxTokens: 2500,
                timeoutMs: 90000,
            });
            return { text: llm.outputText, fallbackUsed: false };
        } catch {
            return { text: fallbackText, fallbackUsed: true };
        }
    }
}
