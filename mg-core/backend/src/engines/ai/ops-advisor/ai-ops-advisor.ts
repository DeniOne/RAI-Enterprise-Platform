/**
 * AI Ops Advisor - Phase 2.4
 * 
 * Canon: AI рекомендует. Человек решает.
 * 
 * ЭТО НЕ AUTOMATION ENGINE.
 * ЭТО НЕ ORCHESTRATOR.
 * ЭТО НЕ AGENTIC AI.
 * 
 * AI Ops Advisor — advisory layer для ops/admins.
 * Только рекомендации и сигналы. Никаких действий.
 * 
 * AI Ops Advisor может ТОЛЬКО:
 * - suggestOptimizations — предложения по оптимизации
 * - identifyWaste — выявление потерь (Kaizen)
 * 
 * AI Ops Advisor НЕ МОЖЕТ:
 * - выполнять действия
 * - автоматизировать процессы
 * - orchestrate других агентов
 * - изменять данные
 */

import {
    ILLMAdapter,
    IOptimizationReport,
    IWasteReport,
    ISuggestOptimizationsInput,
    IIdentifyWasteInput,
    IOptimization,
    IWaste,
    OptimizationArea,
    WasteCategory,
    ImplementationEffort,
    IEventSummary,
    IKPIRecord,
} from '../../../types/core/ai.types';
import { checkGuardrails, REFUSAL_MESSAGE } from '../ai-guardrails';

// =============================================================================
// AI OPS ADVISOR ERROR
// =============================================================================

export class AIOpsAdvisorError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'AIOpsAdvisorError';
    }
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DISCLAIMER =
    'Это рекомендации, не указания к действию. ' +
    'Внедрение остаётся на усмотрение руководства. ' +
    'AI не гарантирует результат.';

// =============================================================================
// PROMPT TEMPLATES
// =============================================================================

const OPTIMIZATION_CONTEXT = `
Ты — AI Ops Advisor в системе MatrixGin.

РОЛЬ: Консультант по оптимизации. Ты предлагаешь идеи, НЕ действуешь.

ЗАПРЕЩЕНО:
- Давать императивные указания ("нужно", "обязательно", "сделайте")
- Обещать результат
- Автоматизировать процессы
- Принимать решения

РАЗРЕШЕНО:
- Предлагать варианты ("можно рассмотреть...")
- Показывать возможности
- Указывать потенциальный эффект
- Оценивать усилия для внедрения

ОБЛАСТИ ОПТИМИЗАЦИИ:
- process: улучшение процессов
- scheduling: оптимизация расписания
- training: улучшение обучения
- resources: оптимизация ресурсов

ФОРМАТ ОТВЕТА (строго JSON):
{
  "summary": "краткое описание",
  "optimizations": [
    {
      "area": "process|scheduling|training|resources",
      "title": "...",
      "description": "...",
      "potential_impact": "...",
      "implementation_effort": "low|medium|high",
      "related_facts": ["..."]
    }
  ],
  "assumptions": ["..."]
}

Canon: AI рекомендует. Человек решает.
`;

const WASTE_CONTEXT = `
Ты — AI Ops Advisor в системе MatrixGin.

РОЛЬ: Консультант по выявлению потерь (Kaizen). Ты показываешь проблемы, НЕ решаешь их.

ЗАПРЕЩЕНО:
- Давать императивные указания
- Применять корректировки
- Изменять данные
- Принимать решения

РАЗРЕШЕНО:
- Выявлять неэффективности
- Показывать паттерны потерь
- Оценивать масштаб проблемы
- Связывать с конкретными событиями

КАТЕГОРИИ ПОТЕРЬ (Kaizen / Lean):
- time: потери времени
- rework: переделки
- waiting: ожидание
- overprocessing: избыточная обработка

ФОРМАТ ОТВЕТА (строго JSON):
{
  "summary": "краткое описание",
  "waste_items": [
    {
      "category": "time|rework|waiting|overprocessing",
      "description": "...",
      "estimated_loss": "...",
      "affected_event_ids": ["..."]
    }
  ],
  "assumptions": ["..."]
}

Canon: AI сигнализирует. Человек решает.
`;

// =============================================================================
// AI OPS ADVISOR
// =============================================================================

/**
 * AI Ops Advisor - Advisory Layer for Operations
 * 
 * Рекомендует оптимизации. Не выполняет действий.
 */
export class AIOpsAdvisor {
    private llm: ILLMAdapter;

    constructor(llmAdapter: ILLMAdapter) {
        this.llm = llmAdapter;
    }

    // =========================================================================
    // SUGGEST OPTIMIZATIONS
    // =========================================================================

    /**
     * Предложения по оптимизации
     * 
     * Возвращает ВАРИАНТЫ, не указания.
     */
    async suggestOptimizations(input: ISuggestOptimizationsInput): Promise<IOptimizationReport> {
        const prompt = this.buildOptimizationsPrompt(input);

        const guardrailCheck = checkGuardrails(prompt);
        if (!guardrailCheck.allowed) {
            throw new AIOpsAdvisorError(REFUSAL_MESSAGE);
        }

        try {
            const response = await this.llm.generate(prompt);
            return this.parseOptimizationReport(response);
        } catch (error) {
            if (error instanceof AIOpsAdvisorError) throw error;
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new AIOpsAdvisorError(`suggestOptimizations failed: ${message}`);
        }
    }

    private buildOptimizationsPrompt(input: ISuggestOptimizationsInput): string {
        const areas = input.focus_areas || ['process', 'scheduling', 'training', 'resources'];

        const eventsList = input.events.slice(0, 30).map((e: IEventSummary) =>
            `- [${e.type}] ${e.summary}`
        ).join('\n');

        const kpiList = input.kpi_history.slice(-10).map((k: IKPIRecord) =>
            `- ${k.kpi_name}: ${k.value} ${k.unit}`
        ).join('\n');

        // Event type distribution
        const typeCounts: Record<string, number> = {};
        for (const e of input.events) {
            typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
        }
        const typeDistribution = Object.entries(typeCounts)
            .map(([type, count]) => `${type}: ${count}`)
            .join(', ');

        return `${OPTIMIZATION_CONTEXT}

ЗАДАЧА: Предложить варианты оптимизации

ПЕРИОД: ${input.period_start.toISOString()} — ${input.period_end.toISOString()}
ОБЛАСТИ ФОКУСА: ${areas.join(', ')}
ВСЕГО СОБЫТИЙ: ${input.events.length}

РАСПРЕДЕЛЕНИЕ ПО ТИПАМ:
${typeDistribution}

НЕДАВНИЕ СОБЫТИЯ:
${eventsList || 'Нет данных'}

НЕДАВНИЕ KPI:
${kpiList || 'Нет данных'}

Предложи 2-4 варианта оптимизации. НЕ давай указаний. Только варианты.`;
    }

    private parseOptimizationReport(response: string): IOptimizationReport {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                return this.createFallbackOptimizationReport(response);
            }

            const parsed = JSON.parse(jsonMatch[0]);

            return {
                summary: parsed.summary || response.slice(0, 200),
                optimizations: this.parseOptimizations(parsed.optimizations),
                assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
                disclaimer: DISCLAIMER,
            };
        } catch {
            return this.createFallbackOptimizationReport(response);
        }
    }

    private parseOptimizations(opts: unknown): IOptimization[] {
        if (!Array.isArray(opts)) return [];

        return opts.map((o: Record<string, unknown>) => ({
            area: this.validateArea(o?.area) || 'process',
            title: String(o?.title || 'Оптимизация'),
            description: String(o?.description || ''),
            potential_impact: String(o?.potential_impact || ''),
            implementation_effort: this.validateEffort(o?.implementation_effort) || 'medium',
            related_facts: Array.isArray(o?.related_facts) ? o.related_facts.map(String) : [],
        }));
    }

    private createFallbackOptimizationReport(response: string): IOptimizationReport {
        return {
            summary: response.slice(0, 500),
            optimizations: [],
            assumptions: ['Response was not in expected JSON format'],
            disclaimer: DISCLAIMER,
        };
    }

    // =========================================================================
    // IDENTIFY WASTE
    // =========================================================================

    /**
     * Выявление потерь (Kaizen)
     * 
     * Показывает проблемы. Не решает их.
     */
    async identifyWaste(input: IIdentifyWasteInput): Promise<IWasteReport> {
        const prompt = this.buildWastePrompt(input);

        const guardrailCheck = checkGuardrails(prompt);
        if (!guardrailCheck.allowed) {
            throw new AIOpsAdvisorError(REFUSAL_MESSAGE);
        }

        try {
            const response = await this.llm.generate(prompt);
            return this.parseWasteReport(response, input);
        } catch (error) {
            if (error instanceof AIOpsAdvisorError) throw error;
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new AIOpsAdvisorError(`identifyWaste failed: ${message}`);
        }
    }

    private buildWastePrompt(input: IIdentifyWasteInput): string {
        const categories = input.categories || ['time', 'rework', 'waiting', 'overprocessing'];

        const eventsList = input.events.slice(0, 50).map((e: IEventSummary) =>
            `- [${e.id}] ${e.type} | ${e.timestamp.toISOString()} | ${e.summary}`
        ).join('\n');

        // Time gaps analysis hint
        const timeGapsHint = input.events.length > 1
            ? 'Обрати внимание на временные промежутки между событиями.'
            : '';

        return `${WASTE_CONTEXT}

ЗАДАЧА: Выявить потери и неэффективности

ПЕРИОД: ${input.period_start.toISOString()} — ${input.period_end.toISOString()}
КАТЕГОРИИ ДЛЯ ПОИСКА: ${categories.join(', ')}
ВСЕГО СОБЫТИЙ: ${input.events.length}

${timeGapsHint}

СОБЫТИЯ:
${eventsList || 'Нет данных'}

Выяви потери. НЕ применяй корректировки. Только покажи проблемы.`;
    }

    private parseWasteReport(response: string, input: IIdentifyWasteInput): IWasteReport {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                return this.createFallbackWasteReport(response, input);
            }

            const parsed = JSON.parse(jsonMatch[0]);

            return {
                summary: parsed.summary || response.slice(0, 200),
                waste_items: this.parseWasteItems(parsed.waste_items),
                total_events_analyzed: input.events.length,
                assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
                disclaimer: DISCLAIMER,
            };
        } catch {
            return this.createFallbackWasteReport(response, input);
        }
    }

    private parseWasteItems(items: unknown): IWaste[] {
        if (!Array.isArray(items)) return [];

        return items.map((w: Record<string, unknown>) => ({
            category: this.validateWasteCategory(w?.category) || 'time',
            description: String(w?.description || ''),
            estimated_loss: String(w?.estimated_loss || ''),
            affected_event_ids: Array.isArray(w?.affected_event_ids)
                ? w.affected_event_ids.map(String)
                : [],
        }));
    }

    private createFallbackWasteReport(response: string, input: IIdentifyWasteInput): IWasteReport {
        return {
            summary: response.slice(0, 500),
            waste_items: [],
            total_events_analyzed: input.events.length,
            assumptions: ['Response was not in expected JSON format'],
            disclaimer: DISCLAIMER,
        };
    }

    // =========================================================================
    // VALIDATORS
    // =========================================================================

    private validateArea(area: unknown): OptimizationArea | null {
        const valid: OptimizationArea[] = ['process', 'scheduling', 'training', 'resources'];
        return valid.includes(area as OptimizationArea) ? area as OptimizationArea : null;
    }

    private validateEffort(effort: unknown): ImplementationEffort | null {
        const valid: ImplementationEffort[] = ['low', 'medium', 'high'];
        return valid.includes(effort as ImplementationEffort) ? effort as ImplementationEffort : null;
    }

    private validateWasteCategory(category: unknown): WasteCategory | null {
        const valid: WasteCategory[] = ['time', 'rework', 'waiting', 'overprocessing'];
        return valid.includes(category as WasteCategory) ? category as WasteCategory : null;
    }
}
