import { Injectable, Logger } from "@nestjs/common";
import type { EvidenceReference } from "../dto/rai-chat.dto";
import { OpenRouterGatewayService } from "../agent-platform/openrouter-gateway.service";
import { AgentPromptAssemblyService } from "../agent-platform/agent-prompt-assembly.service";
import {
    AgentExecutionRequest,
    EffectiveAgentKernelEntry,
} from "../agent-platform/agent-platform.types";
import { DataScientistService } from "../expert/data-scientist.service";
import {
    DecisionIntelligenceService,
    StrategyForecastDomain,
    StrategyForecastRunRequest,
    StrategyForecastScopeLevel,
} from "../../finance-economy/ofs/application/decision-intelligence.service";

/**
 * DataScientistAgent — Phase 5
 * 
 * Обертка над DataScientistService для интеграции в общую шину агентов.
 * Отвечает за прогнозы урожайности, аналитику рисков и оптимизацию затрат.
 */

export type DataScientistAgentIntent =
    | "yield_prediction"
    | "disease_risk"
    | "cost_optimization"
    | "seasonal_report"
    | "pattern_mining"
    | "what_if"
    | "strategy_forecast";

export interface DataScientistAgentInput {
    companyId: string;
    traceId: string;
    intent: DataScientistAgentIntent;
    query?: string;
    fieldId?: string;
    farmId?: string;
    crop?: string;
    seasonId?: string;
    scopeLevel?: StrategyForecastScopeLevel;
    horizonDays?: 30 | 90 | 180 | 365;
    domains?: StrategyForecastDomain[];
    scenario?: unknown;
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
        private readonly decisionIntelligence: DecisionIntelligenceService,
        private readonly openRouterGateway: OpenRouterGatewayService,
        private readonly promptAssembly: AgentPromptAssemblyService,
    ) { }

    async run(
        input: DataScientistAgentInput,
        options?: { kernel?: EffectiveAgentKernelEntry; request?: AgentExecutionRequest },
    ): Promise<DataScientistAgentResult> {
        this.logger.log(`running data_scientist_agent intent=${input.intent}`);

        try {
            let result: any;
            let explanation = "";
            let confidence = 0.8;

            switch (input.intent) {
                case "yield_prediction":
                    if (!input.fieldId || !input.crop) {
                        return this.needsMoreData(["fieldId", "crop"], input.traceId);
                    }
                    result = await this.dsService.predictYield(input.companyId, input.fieldId, input.crop, input.seasonId);
                    explanation = `Прогноз урожайности для культуры ${input.crop}: ${result.predictedYield} ${result.unit} (уверенность: ${(result.confidence * 100).toFixed(0)}%).`;
                    confidence = Number(result.confidence ?? confidence);
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
                    if (!this.isWhatIfScenario(input.scenario)) {
                        return this.needsMoreData(["scenario"], input.traceId);
                    }
                    result = await this.dsService.whatIf(input.companyId, input.scenario);
                    explanation = `Анализ сценария "${input.scenario.type}": ${result.recommendation}`;
                    break;

                case "strategy_forecast": {
                    if (!input.seasonId?.trim()) {
                        return this.needsMoreData(["seasonId"], input.traceId);
                    }
                    const scopeLevel = this.resolveScopeLevel(input);
                    if (scopeLevel === "farm" && !input.farmId?.trim()) {
                        return this.needsMoreData(["farmId"], input.traceId);
                    }
                    if (scopeLevel === "field" && !input.fieldId?.trim()) {
                        return this.needsMoreData(["fieldId"], input.traceId);
                    }
                    const scenario = this.toStrategyScenario(input.scenario);
                    const request: StrategyForecastRunRequest = {
                        scopeLevel,
                        seasonId: input.seasonId.trim(),
                        horizonDays: input.horizonDays ?? 90,
                        domains: this.normalizeForecastDomains(input.domains),
                        ...(input.farmId?.trim() ? { farmId: input.farmId.trim() } : {}),
                        ...(input.fieldId?.trim() ? { fieldId: input.fieldId.trim() } : {}),
                        ...(input.crop?.trim() ? { crop: input.crop.trim() } : {}),
                        ...(scenario ? { scenario } : {}),
                    };
                    result = await this.decisionIntelligence.runStrategyForecast(
                        input.companyId,
                        request,
                        null,
                    );
                    explanation = this.buildStrategyForecastExplanation(result);
                    confidence = this.estimateStrategyForecastConfidence(result);
                    break;
                }

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

            if (typeof result?.confidence === "number") {
                confidence = Number(result.confidence);
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
                confidence,
                explain: synthesis.text,
                traceId: input.traceId,
                evidence: [
                    {
                        claim: explanation,
                        sourceType: "TOOL_RESULT",
                        sourceId:
                            input.intent === "strategy_forecast"
                                ? "decision_intelligence_strategy_forecast"
                                : `ds_service_${input.intent}`,
                        confidenceScore: confidence,
                    }
                ],
            };

        } catch (err: any) {
            const message = err?.message ?? String(err);
            this.logger.error(`DataScientistAgent error: ${message}`);
            return {
                agentName: "DataScientistAgent",
                status: "FAILED",
                data: {},
                confidence: 0,
                explain: `Ошибка аналитического вызова: ${message}`,
                traceId: input.traceId,
                evidence: [],
            };
        }
    }

    private resolveScopeLevel(input: DataScientistAgentInput): StrategyForecastScopeLevel {
        if (input.scopeLevel) {
            return input.scopeLevel;
        }
        if (input.fieldId?.trim()) {
            return "field";
        }
        if (input.farmId?.trim()) {
            return "farm";
        }
        return "company";
    }

    private normalizeForecastDomains(domains?: StrategyForecastDomain[]): StrategyForecastDomain[] {
        const defaults: StrategyForecastDomain[] = ["agro", "economics", "finance", "risk"];
        if (!Array.isArray(domains) || domains.length === 0) {
            return defaults;
        }
        const unique = new Set<StrategyForecastDomain>();
        for (const domain of domains) {
            if (domain === "agro" || domain === "economics" || domain === "finance" || domain === "risk") {
                unique.add(domain);
            }
        }
        if (unique.size === 0) {
            return defaults;
        }
        return Array.from(unique);
    }

    private toStrategyScenario(
        scenario: unknown,
    ): StrategyForecastRunRequest["scenario"] | undefined {
        if (!scenario || typeof scenario !== "object" || Array.isArray(scenario)) {
            return undefined;
        }
        const candidate = scenario as {
            name?: unknown;
            adjustments?: unknown;
        };
        if (typeof candidate.name !== "string" || !candidate.name.trim()) {
            return undefined;
        }
        if (!Array.isArray(candidate.adjustments)) {
            return undefined;
        }
        const adjustments = candidate.adjustments
            .filter(
                (item): item is {
                    lever: StrategyForecastRunRequest["scenario"]["adjustments"][number]["lever"];
                    operator: "delta";
                    value: number;
                } =>
                    Boolean(item) &&
                    typeof item === "object" &&
                    !Array.isArray(item) &&
                    (item as { operator?: unknown }).operator === "delta" &&
                    typeof (item as { value?: unknown }).value === "number" &&
                    ((
                        item as { lever?: unknown }
                    ).lever === "yield_pct" ||
                        (item as { lever?: unknown }).lever === "sales_price_pct" ||
                        (item as { lever?: unknown }).lever === "input_cost_pct" ||
                        (item as { lever?: unknown }).lever === "opex_pct" ||
                        (item as { lever?: unknown }).lever === "working_capital_days" ||
                        (item as { lever?: unknown }).lever === "disease_risk_pct"),
            )
            .map((item) => ({
                lever: item.lever,
                operator: "delta" as const,
                value: item.value,
            }));
        if (adjustments.length === 0) {
            return undefined;
        }
        return {
            name: candidate.name.trim(),
            adjustments,
        };
    }

    private isWhatIfScenario(
        scenario: unknown,
    ): scenario is {
        type: "CHANGE_HYBRID" | "CHANGE_DOSE" | "SKIP_OPERATION" | "WEATHER_IMPACT";
        parameters: Record<string, unknown>;
        fieldId?: string;
        crop?: string;
    } {
        if (!scenario || typeof scenario !== "object" || Array.isArray(scenario)) {
            return false;
        }
        const candidate = scenario as {
            type?: unknown;
            parameters?: unknown;
        };
        if (
            candidate.type !== "CHANGE_HYBRID" &&
            candidate.type !== "CHANGE_DOSE" &&
            candidate.type !== "SKIP_OPERATION" &&
            candidate.type !== "WEATHER_IMPACT"
        ) {
            return false;
        }
        return Boolean(candidate.parameters && typeof candidate.parameters === "object");
    }

    private buildStrategyForecastExplanation(
        result: {
            traceId: string;
            baseline: {
                revenue: number;
                margin: number;
                cashFlow: number;
                riskScore: number;
            };
            riskTier: "low" | "medium" | "high";
            recommendedAction: string;
            degraded: boolean;
            limitations: string[];
        },
    ): string {
        return [
            `Стратегический прогноз рассчитан детерминированным Decision Intelligence слоем (traceId=${result.traceId}).`,
            `Baseline: выручка ${Math.round(result.baseline.revenue).toLocaleString("ru-RU")} ₽, маржа ${Math.round(result.baseline.margin).toLocaleString("ru-RU")} ₽, cash flow ${Math.round(result.baseline.cashFlow).toLocaleString("ru-RU")} ₽.`,
            `Риск: ${result.riskTier} (score ${result.baseline.riskScore.toFixed(1)}).`,
            `Рекомендация: ${result.recommendedAction}`,
            result.degraded
                ? "Прогноз выполнен в degraded-режиме, учитывайте ограничения источников."
                : "Прогноз выполнен в штатном режиме.",
            result.limitations.length > 0 ? `Ограничения: ${result.limitations[0]}` : null,
        ]
            .filter(Boolean)
            .join(" ");
    }

    private estimateStrategyForecastConfidence(result: {
        degraded: boolean;
        riskTier: "low" | "medium" | "high";
        lineage?: Array<{ status: "ok" | "degraded" | "not_requested" | "missing" }>;
    }): number {
        let score = 0.8;
        if (result.degraded) {
            score -= 0.15;
        }
        if (result.riskTier === "high") {
            score -= 0.1;
        } else if (result.riskTier === "low") {
            score += 0.05;
        }
        const degradedLineageCount =
            result.lineage?.filter((item) => item.status === "degraded" || item.status === "missing").length ?? 0;
        score -= degradedLineageCount * 0.03;
        return Math.max(0.35, Math.min(0.95, Number(score.toFixed(2))));
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
