/**
 * AI Orchestrator - Phase 3
 * 
 * Canon: AI предлагает сценарии. Человек утверждает. Система исполняет ТОЛЬКО утверждённое.
 * 
 * ORCHESTRATOR = NON-SEMANTIC AGGREGATOR
 * 
 * Поведение: collect → tag → order → attach
 * 
 * ORCHESTRATOR НЕ ДЕЛАЕТ:
 * - НЕ анализирует данные
 * - НЕ генерирует рекомендации
 * - НЕ интерпретирует outputs агентов
 * - НЕ переписывает/суммаризирует/перефразирует
 * - НЕ объединяет смыслы
 * - НЕ выполняет действия
 * 
 * ORCHESTRATOR ДЕЛАЕТ:
 * - Вызывает агентов
 * - Сохраняет raw responses (verbatim)
 * - Собирает ScenarioProposal контейнер
 * - Выполняет ZERO интерпретации
 */

import {
    IScenarioProposal,
    ICreateScenarioInput,
    IAgentOutput,
    IScenarioOption,
    IAggregationTrace,
    AgentType,
    IEventSummary,
    IKPIRecord,
    IQualificationSummary,
} from '../../../types/core/ai.types';

import { AIAnalyst } from '../analyst';
import { AICoach } from '../coach';
import { AIAuditor } from '../auditor';
import { AIOpsAdvisor } from '../ops-advisor';
import { ILLMAdapter } from '../../../types/core/ai.types';

// =============================================================================
// AI ORCHESTRATOR ERROR
// =============================================================================

export class AIOrchestratorError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AIOrchestratorError';
    }
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DISCLAIMER =
    'Это сценарий, НЕ решение. ' +
    'Статус: NOT_EXECUTED. ' +
    'Требуется подтверждение человека.';

const REQUIRED_HUMAN_ACTION =
    'Просмотрите outputs агентов. ' +
    'Примите решение: APPROVE или REJECT.';

// =============================================================================
// AI ORCHESTRATOR
// =============================================================================

/**
 * AI Orchestrator - Non-Semantic Aggregator
 * 
 * collect → tag → order → attach
 * ZERO interpretation.
 */
export class AIOrchestratorEngine {
    private analyst: AIAnalyst;
    private coach: AICoach;
    private auditor: AIAuditor;
    private opsAdvisor: AIOpsAdvisor;

    private traces: IAggregationTrace[] = [];

    constructor(llmAdapter: ILLMAdapter) {
        this.analyst = new AIAnalyst(llmAdapter);
        this.coach = new AICoach(llmAdapter);
        this.auditor = new AIAuditor(llmAdapter);
        this.opsAdvisor = new AIOpsAdvisor(llmAdapter);
    }

    // =========================================================================
    // CREATE SCENARIO
    // =========================================================================

    /**
     * Создаёт ScenarioProposal
     * 
     * ZERO interpretation.
     * Только сбор и агрегация raw outputs.
     */
    async createScenario(input: ICreateScenarioInput): Promise<IScenarioProposal> {
        const scenarioId = this.generateScenarioId();
        const callOrder: IAggregationTrace['call_order'] = [];
        const agentOutputs: IAgentOutput[] = [];
        const options: IScenarioOption[] = [];
        const risks: string[] = [];

        // Collect outputs from agents (verbatim)
        for (const agentType of input.agents_to_call) {
            try {
                const output = await this.callAgent(agentType, input.context);

                callOrder.push({
                    agent: agentType,
                    method: output.method,
                    timestamp: output.called_at,
                });

                agentOutputs.push(output);

                // Extract options/risks verbatim (no interpretation)
                this.extractVerbatimData(output, options, risks);

            } catch (error) {
                // Log error but continue with other agents
                agentOutputs.push({
                    agent: agentType,
                    method: 'error',
                    raw_response: { error: error instanceof Error ? error.message : 'Unknown error' },
                    called_at: new Date(),
                });
            }
        }

        // Store trace (without reasoning)
        const trace: IAggregationTrace = {
            scenario_id: scenarioId,
            request: input.request,
            call_order: callOrder,
            created_at: new Date(),
        };
        this.traces.push(trace);

        // Assemble container (ZERO interpretation)
        return {
            scenario_id: scenarioId,
            created_at: new Date(),
            original_request: input.request,
            involved_agents: input.agents_to_call,
            agent_outputs: agentOutputs,
            options: options,
            risks: risks,
            required_human_action: REQUIRED_HUMAN_ACTION,
            status: 'NOT_EXECUTED',
            disclaimer: DISCLAIMER,
        };
    }

    // =========================================================================
    // AGENT CALLS (NO INTERPRETATION)
    // =========================================================================

    private async callAgent(
        agentType: AgentType,
        context: ICreateScenarioInput['context']
    ): Promise<IAgentOutput> {
        const calledAt = new Date();

        switch (agentType) {
            case 'analyst':
                return this.callAnalyst(context, calledAt);
            case 'coach':
                return this.callCoach(context, calledAt);
            case 'auditor':
                return this.callAuditor(context, calledAt);
            case 'ops_advisor':
                return this.callOpsAdvisor(context, calledAt);
            default:
                throw new AIOrchestratorError(`Unknown agent type: ${agentType}`);
        }
    }

    private async callAnalyst(
        context: ICreateScenarioInput['context'],
        calledAt: Date
    ): Promise<IAgentOutput> {
        const response = await this.analyst.summarizeState({
            user_id: context.user_id || 'unknown',
            qualification: context.qualification || this.defaultQualification(),
            recent_kpis: context.kpi_history || [],
            recent_rewards: [],
        });

        return {
            agent: 'analyst',
            method: 'summarizeState',
            raw_response: response,
            called_at: calledAt,
        };
    }

    private async callCoach(
        context: ICreateScenarioInput['context'],
        calledAt: Date
    ): Promise<IAgentOutput> {
        const response = await this.coach.recommendGrowth({
            user_id: context.user_id || 'unknown',
            qualification: context.qualification || this.defaultQualification(),
            kpi_history: context.kpi_history || [],
            events: context.events || [],
        });

        return {
            agent: 'coach',
            method: 'recommendGrowth',
            raw_response: response,
            called_at: calledAt,
        };
    }

    private async callAuditor(
        context: ICreateScenarioInput['context'],
        calledAt: Date
    ): Promise<IAgentOutput> {
        const response = await this.auditor.detectAnomalies({
            events: context.events || [],
            period_start: context.period_start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            period_end: context.period_end || new Date(),
        });

        return {
            agent: 'auditor',
            method: 'detectAnomalies',
            raw_response: response,
            called_at: calledAt,
        };
    }

    private async callOpsAdvisor(
        context: ICreateScenarioInput['context'],
        calledAt: Date
    ): Promise<IAgentOutput> {
        const response = await this.opsAdvisor.suggestOptimizations({
            events: context.events || [],
            kpi_history: context.kpi_history || [],
            period_start: context.period_start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            period_end: context.period_end || new Date(),
        });

        return {
            agent: 'ops_advisor',
            method: 'suggestOptimizations',
            raw_response: response,
            called_at: calledAt,
        };
    }

    // =========================================================================
    // VERBATIM DATA EXTRACTION (NO INTERPRETATION)
    // =========================================================================

    /**
     * Извлекает options и risks ТОЛЬКО если они явно указаны агентом.
     * ZERO interpretation. Verbatim only.
     */
    private extractVerbatimData(
        output: IAgentOutput,
        options: IScenarioOption[],
        risks: string[]
    ): void {
        const response = output.raw_response as Record<string, unknown>;

        // Extract options verbatim (if present)
        if (response && Array.isArray(response.recommendations)) {
            for (const rec of response.recommendations) {
                const r = rec as Record<string, unknown>;
                if (r && typeof r.title === 'string') {
                    options.push({
                        option_id: `${output.agent}_${options.length}`,
                        title: r.title,
                        description: typeof r.description === 'string' ? r.description : '',
                        source_agent: output.agent,
                    });
                }
            }
        }

        if (response && Array.isArray(response.optimizations)) {
            for (const opt of response.optimizations) {
                const o = opt as Record<string, unknown>;
                if (o && typeof o.title === 'string') {
                    options.push({
                        option_id: `${output.agent}_${options.length}`,
                        title: o.title,
                        description: typeof o.description === 'string' ? o.description : '',
                        source_agent: output.agent,
                    });
                }
            }
        }

        // Extract risks verbatim (if present)
        if (response && Array.isArray(response.risks)) {
            for (const risk of response.risks) {
                if (typeof risk === 'string') {
                    risks.push(risk);
                }
            }
        }

        if (response && Array.isArray(response.detected_risks)) {
            for (const risk of response.detected_risks) {
                const r = risk as Record<string, unknown>;
                if (r && typeof r.description === 'string') {
                    risks.push(r.description);
                }
            }
        }
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    private generateScenarioId(): string {
        return `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private defaultQualification(): IQualificationSummary {
        return {
            user_id: 'unknown',
            current_level: 1,
            state: 'stable',
            days_at_level: 0,
        };
    }

    /**
     * Получить trace для аудита
     */
    getTrace(scenarioId: string): IAggregationTrace | undefined {
        return this.traces.find(t => t.scenario_id === scenarioId);
    }

    /**
     * Получить все traces
     */
    getAllTraces(): IAggregationTrace[] {
        return [...this.traces];
    }
}
