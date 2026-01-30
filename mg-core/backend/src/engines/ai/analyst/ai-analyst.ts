/**
 * AI Analyst - Phase 2.1
 * 
 * Canon: AI объясняет. Человек решает.
 * 
 * ЭТО НЕ AGENTIC AI.
 * ЭТО НЕ ORCHESTRATOR.
 * ЭТО НЕ DECISION ENGINE.
 * 
 * Это EXPLAINABILITY LAYER поверх ERP.
 * 
 * AI Analyst может ТОЛЬКО:
 * - explainKPIChanges
 * - describeTrends
 * - highlightRisks
 * - summarizeState
 * 
 * AI Analyst НЕ МОЖЕТ:
 * - analyze "что делать"
 * - recommend actions
 * - optimize процессы
 * - сравнивать людей с выводами
 */

import {
    ILLMAdapter,
    IExplanationOutput,
    IExplainKPIChangesInput,
    IDescribeTrendsInput,
    IHighlightRisksInput,
    ISummarizeStateInput,
    IFactReference,
    IRisk,
    IKPIRecord,
    IEventSummary,
    IRewardSummary,
} from '../../../types/core/ai.types';
import { checkGuardrails, REFUSAL_MESSAGE } from '../ai-guardrails';


// =============================================================================
// AI ANALYST ERROR
// =============================================================================

export class AIAnalystError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AIAnalystError';
    }
}

// =============================================================================
// PROMPT TEMPLATES
// =============================================================================

const SYSTEM_CONTEXT = `
Ты — AI Analyst в системе MatrixGin.

РОЛЬ: Explainability Layer. Ты ТОЛЬКО объясняешь факты.

ЗАПРЕЩЕНО:
- Давать советы ("нужно", "следует", "рекомендую")
- Принимать решения
- Оценивать людей
- Использовать императивы

РАЗРЕШЕНО:
- Описывать факты
- Отмечать тренды
- Подсвечивать риски (без советов)
- Указывать предположения

ФОРМАТ ОТВЕТА (строго JSON):
{
  "summary": "краткое резюме",
  "observed_facts": [{"type": "EVENT|KPI|QUALIFICATION|REWARD", "id": "...", "description": "..."}],
  "detected_risks": [{"severity": "LOW|MEDIUM|HIGH", "description": "...", "related_facts": ["..."]}],
  "assumptions": ["..."],
  "notes": ["..."]
}

Canon: AI объясняет. Человек решает.
`;

// =============================================================================
// AI ANALYST
// =============================================================================

/**
 * AI Analyst - Explainability Layer
 * 
 * Читает факты. Объясняет следствия. Не управляет системой.
 */
export class AIAnalyst {
    private llm: ILLMAdapter;

    constructor(llmAdapter: ILLMAdapter) {
        this.llm = llmAdapter;
    }

    // =========================================================================
    // EXPLAIN KPI CHANGES
    // =========================================================================

    /**
     * Объяснить изменения KPI за период
     * 
     * ТОЛЬКО объяснение, НЕ рекомендации.
     */
    async explainKPIChanges(input: IExplainKPIChangesInput): Promise<IExplanationOutput> {
        const prompt = this.buildExplainKPIPrompt(input);
        return this.executeWithGuardrails(prompt, 'explainKPIChanges');
    }

    private buildExplainKPIPrompt(input: IExplainKPIChangesInput): string {
        const kpiList = input.kpi_records.map((k: IKPIRecord) =>
            `- ${k.kpi_name}: ${k.value} ${k.unit} (период: ${k.period_start.toISOString().split('T')[0]} - ${k.period_end.toISOString().split('T')[0]})`
        ).join('\n');

        const eventsList = input.events.slice(0, 10).map((e: IEventSummary) =>
            `- [${e.type}] ${e.summary} (${e.timestamp.toISOString().split('T')[0]})`
        ).join('\n');

        return `${SYSTEM_CONTEXT}

ЗАДАЧА: Объяснить изменения KPI для пользователя ${input.user_id}

ПЕРИОД: ${input.period_start.toISOString().split('T')[0]} — ${input.period_end.toISOString().split('T')[0]}

KPI ЗАПИСИ:
${kpiList || 'Нет данных'}

СОБЫТИЯ:
${eventsList || 'Нет событий'}

Объясни, что повлияло на KPI. НЕ давай советов.`;
    }

    // =========================================================================
    // DESCRIBE TRENDS
    // =========================================================================

    /**
     * Описать тренды KPI
     * 
     * ТОЛЬКО описание, НЕ прогнозы и НЕ рекомендации.
     */
    async describeTrends(input: IDescribeTrendsInput): Promise<IExplanationOutput> {
        const prompt = this.buildDescribeTrendsPrompt(input);
        return this.executeWithGuardrails(prompt, 'describeTrends');
    }

    private buildDescribeTrendsPrompt(input: IDescribeTrendsInput): string {
        const kpiList = input.kpi_history.map((k: IKPIRecord) =>
            `- ${k.kpi_name}: ${k.value} ${k.unit} (${k.period_start.toISOString().split('T')[0]})`
        ).join('\n');

        return `${SYSTEM_CONTEXT}

ЗАДАЧА: Описать тренды KPI

ПЕРИОД АНАЛИЗА: ${input.period_count} ${input.period_type}

ИСТОРИЯ KPI:
${kpiList || 'Нет данных'}

Опиши наблюдаемые тренды. НЕ делай прогнозов. НЕ давай советов.`;
    }

    // =========================================================================
    // HIGHLIGHT RISKS
    // =========================================================================

    /**
     * Подсветить риски на основе событий
     * 
     * ТОЛЬКО подсветка, НЕ рекомендации по устранению.
     */
    async highlightRisks(input: IHighlightRisksInput): Promise<IExplanationOutput> {
        const prompt = this.buildHighlightRisksPrompt(input);
        return this.executeWithGuardrails(prompt, 'highlightRisks');
    }

    private buildHighlightRisksPrompt(input: IHighlightRisksInput): string {
        const eventsList = input.events.map((e: IEventSummary) =>
            `- [${e.type}] ${e.summary} (${e.timestamp.toISOString().split('T')[0]})`
        ).join('\n');

        const qualInfo = input.qualification_state
            ? `Квалификация: уровень ${input.qualification_state.current_level}, состояние: ${input.qualification_state.state}, дней на уровне: ${input.qualification_state.days_at_level}`
            : 'Нет данных о квалификации';

        const kpiInfo = input.recent_kpis
            ? input.recent_kpis.map((k: IKPIRecord) => `- ${k.kpi_name}: ${k.value} ${k.unit}`).join('\n')
            : 'Нет данных о KPI';

        return `${SYSTEM_CONTEXT}

ЗАДАЧА: Подсветить риски на основе фактов

СОБЫТИЯ:
${eventsList || 'Нет событий'}

КВАЛИФИКАЦИЯ:
${qualInfo}

ПОСЛЕДНИЕ KPI:
${kpiInfo}

Подсветь риски БЕЗ советов по их устранению.`;
    }

    // =========================================================================
    // SUMMARIZE STATE
    // =========================================================================

    /**
     * Суммаризовать текущее состояние пользователя
     * 
     * ТОЛЬКО факты, НЕ оценки и НЕ рекомендации.
     */
    async summarizeState(input: ISummarizeStateInput): Promise<IExplanationOutput> {
        const prompt = this.buildSummarizeStatePrompt(input);
        return this.executeWithGuardrails(prompt, 'summarizeState');
    }

    private buildSummarizeStatePrompt(input: ISummarizeStateInput): string {
        const kpiList = input.recent_kpis.map((k: IKPIRecord) =>
            `- ${k.kpi_name}: ${k.value} ${k.unit}`
        ).join('\n');

        const rewardsList = input.recent_rewards.map((r: IRewardSummary) =>
            `- ${r.reward_type}: ${r.amount} (${r.reason})`
        ).join('\n');

        const qual = input.qualification;

        return `${SYSTEM_CONTEXT}

ЗАДАЧА: Суммаризовать состояние пользователя ${input.user_id}

КВАЛИФИКАЦИЯ:
- Уровень: ${qual.current_level}
- Состояние: ${qual.state}
- Дней на уровне: ${qual.days_at_level}

ПОСЛЕДНИЕ KPI:
${kpiList || 'Нет данных'}

ПОСЛЕДНИЕ НАГРАДЫ:
${rewardsList || 'Нет наград'}

Опиши текущее состояние ФАКТАМИ. НЕ оценивай человека. НЕ давай советов.`;
    }

    // =========================================================================
    // EXECUTION WITH GUARDRAILS
    // =========================================================================

    private async executeWithGuardrails(
        prompt: string,
        methodName: string
    ): Promise<IExplanationOutput> {
        // Проверка guardrails на сам prompt (на всякий случай)
        const guardrailCheck = checkGuardrails(prompt);
        if (!guardrailCheck.allowed) {
            throw new AIAnalystError(REFUSAL_MESSAGE);
        }

        try {
            const response = await this.llm.generate(prompt);
            return this.parseResponse(response, methodName);
        } catch (error) {
            if (error instanceof AIAnalystError) {
                throw error;
            }
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new AIAnalystError(`${methodName} failed: ${message}`);
        }
    }

    private parseResponse(response: string, methodName: string): IExplanationOutput {
        try {
            // Попытка найти JSON в ответе
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                // Если JSON не найден, создаём структуру из текста
                return this.createFallbackOutput(response, methodName);
            }

            const parsed = JSON.parse(jsonMatch[0]);

            // Валидация структуры
            return {
                summary: parsed.summary || response.slice(0, 200),
                observed_facts: this.parseFactReferences(parsed.observed_facts),
                detected_risks: this.parseRisks(parsed.detected_risks),
                assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
                notes: Array.isArray(parsed.notes) ? parsed.notes : [],
            };
        } catch {
            return this.createFallbackOutput(response, methodName);
        }
    }

    private parseFactReferences(facts: unknown): IFactReference[] {
        if (!Array.isArray(facts)) return [];

        return facts.map(f => ({
            type: this.validateFactType(f?.type) || 'EVENT',
            id: String(f?.id || 'unknown'),
            description: String(f?.description || ''),
        }));
    }

    private validateFactType(type: unknown): IFactReference['type'] | null {
        const validTypes = ['EVENT', 'KPI', 'QUALIFICATION', 'REWARD'];
        return validTypes.includes(String(type)) ? type as IFactReference['type'] : null;
    }

    private parseRisks(risks: unknown): IRisk[] {
        if (!Array.isArray(risks)) return [];

        return risks.map(r => ({
            severity: this.validateSeverity(r?.severity) || 'LOW',
            description: String(r?.description || ''),
            related_facts: Array.isArray(r?.related_facts) ? r.related_facts.map(String) : [],
        }));
    }

    private validateSeverity(severity: unknown): IRisk['severity'] | null {
        const validSeverities = ['LOW', 'MEDIUM', 'HIGH'];
        return validSeverities.includes(String(severity)) ? severity as IRisk['severity'] : null;
    }

    private createFallbackOutput(response: string, methodName: string): IExplanationOutput {
        return {
            summary: response.slice(0, 500),
            observed_facts: [],
            detected_risks: [],
            assumptions: [`Response from ${methodName} was not in expected JSON format`],
            notes: [response],
        };
    }
}
