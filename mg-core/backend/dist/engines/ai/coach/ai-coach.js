"use strict";
/**
 * AI Coach - Phase 2.2
 *
 * Canon: AI рекомендует. Человек решает.
 *
 * ЭТО НЕ AGENTIC AI.
 * ЭТО НЕ DECISION ENGINE.
 *
 * AI Coach предоставляет ВАРИАНТЫ рекомендаций.
 * Все рекомендации NON-BINDING (необязательные).
 *
 * AI Coach может ТОЛЬКО:
 * - recommendGrowth — варианты развития
 * - suggestOptions — опции для достижения цели
 *
 * AI Coach НЕ МОЖЕТ:
 * - гарантировать результат
 * - обещать повышение
 * - принимать решения
 * - изменять данные
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AICoach = exports.AICoachError = void 0;
const ai_guardrails_1 = require("../ai-guardrails");
// =============================================================================
// AI COACH ERROR
// =============================================================================
class AICoachError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AICoachError';
    }
}
exports.AICoachError = AICoachError;
// =============================================================================
// CONSTANTS
// =============================================================================
const DISCLAIMER = 'Это рекомендации, а не требования. ' +
    'Результат зависит от многих факторов. ' +
    'Окончательное решение принимает человек.';
// =============================================================================
// PROMPT TEMPLATES
// =============================================================================
const SYSTEM_CONTEXT = `
Ты — AI Coach в системе RAI_EP.

РОЛЬ: Консультант по развитию. Ты предлагаешь ВАРИАНТЫ.

ЗАПРЕЩЕНО:
- Гарантировать результат
- Обещать повышение
- Давать категоричные указания
- Оценивать людей

РАЗРЕШЕНО:
- Предлагать варианты ("можно рассмотреть...")
- Показывать возможности
- Объяснять преимущества и риски
- Давать несколько опций

ФОРМАТ ОТВЕТА (строго JSON):
{
  "summary": "краткое описание ситуации",
  "recommendations": [
    {
      "area": "kpi|training|mentoring|experience|soft_skills",
      "priority": "low|medium|high",
      "title": "...",
      "description": "...",
      "rationale": "почему это может помочь",
      "expected_impact": "возможный эффект",
      "time_estimate_days": число или null,
      "related_facts": ["..."]
    }
  ],
  "assumptions": ["..."],
  "risks": ["..."]
}

Canon: AI рекомендует. Человек решает.
`;
// =============================================================================
// AI COACH
// =============================================================================
/**
 * AI Coach - Advisory Recommendations
 *
 * Предоставляет варианты развития. Не принимает решений.
 */
class AICoach {
    llm;
    constructor(llmAdapter) {
        this.llm = llmAdapter;
    }
    // =========================================================================
    // RECOMMEND GROWTH
    // =========================================================================
    /**
     * Рекомендации по развитию
     *
     * Возвращает ВАРИАНТЫ, не указания.
     */
    async recommendGrowth(input) {
        const prompt = this.buildRecommendGrowthPrompt(input);
        return this.executeWithGuardrails(prompt, 'recommendGrowth');
    }
    buildRecommendGrowthPrompt(input) {
        const kpiList = input.kpi_history.slice(-5).map((k) => `- ${k.kpi_name}: ${k.value} ${k.unit}`).join('\n');
        const eventsList = input.events.slice(-10).map((e) => `- [${e.type}] ${e.summary}`).join('\n');
        const qual = input.qualification;
        const reqInfo = input.level_requirements
            ? `KPI targets: ${JSON.stringify(input.level_requirements.kpi_targets)}, курсов: ${input.level_requirements.required_courses}, дней: ${input.level_requirements.min_days_at_level}`
            : 'Нет данных о требованиях';
        return `${SYSTEM_CONTEXT}

ЗАДАЧА: Предложить варианты развития для пользователя ${input.user_id}

ТЕКУЩЕЕ СОСТОЯНИЕ:
- Уровень: ${qual.current_level}
- Состояние: ${qual.state}
- Дней на уровне: ${qual.days_at_level}

ПОСЛЕДНИЕ KPI:
${kpiList || 'Нет данных'}

НЕДАВНЯЯ АКТИВНОСТЬ:
${eventsList || 'Нет событий'}

ТРЕБОВАНИЯ УРОВНЯ:
${reqInfo}

Предложи 2-4 ВАРИАНТА развития. НЕ гарантируй результат. НЕ обещай повышение.`;
    }
    // =========================================================================
    // SUGGEST OPTIONS
    // =========================================================================
    /**
     * Варианты для достижения цели
     *
     * Показывает ВОЗМОЖНЫЕ пути, не единственный правильный.
     */
    async suggestOptions(input) {
        const prompt = this.buildSuggestOptionsPrompt(input);
        return this.executeWithGuardrails(prompt, 'suggestOptions');
    }
    buildSuggestOptionsPrompt(input) {
        const kpiList = input.current_kpis.map((k) => `- ${k.kpi_name}: ${k.value} ${k.unit}`).join('\n');
        const target = input.target_level || input.current_level + 1;
        const reqInfo = input.next_level_requirements
            ? `KPI targets: ${JSON.stringify(input.next_level_requirements.kpi_targets)}, курсов: ${input.next_level_requirements.required_courses}`
            : 'Нет данных о требованиях';
        const coursesInfo = input.available_courses?.length
            ? `Доступные курсы: ${input.available_courses.join(', ')}`
            : 'Нет данных о курсах';
        return `${SYSTEM_CONTEXT}

ЗАДАЧА: Показать варианты для пользователя ${input.user_id}

ТЕКУЩИЙ УРОВЕНЬ: ${input.current_level}
ЦЕЛЕВОЙ УРОВЕНЬ: ${target}

ТЕКУЩИЕ KPI:
${kpiList || 'Нет данных'}

ТРЕБОВАНИЯ ДЛЯ УРОВНЯ ${target}:
${reqInfo}

${coursesInfo}

Покажи 2-4 ВАРИАНТА пути. Каждый вариант — это возможность, не единственный путь.`;
    }
    // =========================================================================
    // EXECUTION WITH GUARDRAILS
    // =========================================================================
    async executeWithGuardrails(prompt, methodName) {
        // Проверка guardrails
        const guardrailCheck = (0, ai_guardrails_1.checkGuardrails)(prompt);
        if (!guardrailCheck.allowed) {
            throw new AICoachError(ai_guardrails_1.REFUSAL_MESSAGE);
        }
        try {
            const response = await this.llm.generate(prompt);
            return this.parseResponse(response, methodName);
        }
        catch (error) {
            if (error instanceof AICoachError) {
                throw error;
            }
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new AICoachError(`${methodName} failed: ${message}`);
        }
    }
    parseResponse(response, methodName) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                return this.createFallbackOutput(response, methodName);
            }
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                summary: parsed.summary || response.slice(0, 200),
                recommendations: this.parseRecommendations(parsed.recommendations),
                assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
                risks: Array.isArray(parsed.risks) ? parsed.risks : [],
                disclaimer: DISCLAIMER,
            };
        }
        catch {
            return this.createFallbackOutput(response, methodName);
        }
    }
    parseRecommendations(recs) {
        if (!Array.isArray(recs))
            return [];
        return recs.map((r) => ({
            area: this.validateArea(r?.area) || 'experience',
            priority: this.validatePriority(r?.priority) || 'medium',
            title: String(r?.title || 'Рекомендация'),
            description: String(r?.description || ''),
            rationale: String(r?.rationale || ''),
            expected_impact: String(r?.expected_impact || ''),
            time_estimate_days: typeof r?.time_estimate_days === 'number' ? r.time_estimate_days : undefined,
            related_facts: Array.isArray(r?.related_facts) ? r.related_facts.map(String) : [],
        }));
    }
    validateArea(area) {
        const validAreas = ['kpi', 'training', 'mentoring', 'experience', 'soft_skills'];
        return validAreas.includes(area) ? area : null;
    }
    validatePriority(priority) {
        const validPriorities = ['low', 'medium', 'high'];
        return validPriorities.includes(priority) ? priority : null;
    }
    createFallbackOutput(response, methodName) {
        return {
            summary: response.slice(0, 500),
            recommendations: [],
            assumptions: [`Response from ${methodName} was not in expected JSON format`],
            risks: [],
            disclaimer: DISCLAIMER,
        };
    }
}
exports.AICoach = AICoach;
