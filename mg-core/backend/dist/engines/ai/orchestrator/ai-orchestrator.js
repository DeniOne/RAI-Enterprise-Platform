"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIOrchestratorEngine = exports.AIOrchestratorError = void 0;
const analyst_1 = require("../analyst");
const coach_1 = require("../coach");
const auditor_1 = require("../auditor");
const ops_advisor_1 = require("../ops-advisor");
// =============================================================================
// AI ORCHESTRATOR ERROR
// =============================================================================
class AIOrchestratorError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AIOrchestratorError';
    }
}
exports.AIOrchestratorError = AIOrchestratorError;
// =============================================================================
// CONSTANTS
// =============================================================================
const DISCLAIMER = 'Это сценарий, НЕ решение. ' +
    'Статус: NOT_EXECUTED. ' +
    'Требуется подтверждение человека.';
const REQUIRED_HUMAN_ACTION = 'Просмотрите outputs агентов. ' +
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
class AIOrchestratorEngine {
    analyst;
    coach;
    auditor;
    opsAdvisor;
    traces = [];
    constructor(llmAdapter) {
        this.analyst = new analyst_1.AIAnalyst(llmAdapter);
        this.coach = new coach_1.AICoach(llmAdapter);
        this.auditor = new auditor_1.AIAuditor(llmAdapter);
        this.opsAdvisor = new ops_advisor_1.AIOpsAdvisor(llmAdapter);
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
    async createScenario(input) {
        const scenarioId = this.generateScenarioId();
        const callOrder = [];
        const agentOutputs = [];
        const options = [];
        const risks = [];
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
            }
            catch (error) {
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
        const trace = {
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
    async callAgent(agentType, context) {
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
    async callAnalyst(context, calledAt) {
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
    async callCoach(context, calledAt) {
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
    async callAuditor(context, calledAt) {
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
    async callOpsAdvisor(context, calledAt) {
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
    extractVerbatimData(output, options, risks) {
        const response = output.raw_response;
        // Extract options verbatim (if present)
        if (response && Array.isArray(response.recommendations)) {
            for (const rec of response.recommendations) {
                const r = rec;
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
                const o = opt;
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
                const r = risk;
                if (r && typeof r.description === 'string') {
                    risks.push(r.description);
                }
            }
        }
    }
    // =========================================================================
    // HELPERS
    // =========================================================================
    generateScenarioId() {
        return `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    defaultQualification() {
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
    getTrace(scenarioId) {
        return this.traces.find(t => t.scenario_id === scenarioId);
    }
    /**
     * Получить все traces
     */
    getAllTraces() {
        return [...this.traces];
    }
}
exports.AIOrchestratorEngine = AIOrchestratorEngine;
