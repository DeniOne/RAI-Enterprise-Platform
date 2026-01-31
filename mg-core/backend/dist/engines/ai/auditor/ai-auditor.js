"use strict";
/**
 * AI Auditor - Phase 2.3
 *
 * Canon: AI сигнализирует. Человек решает.
 *
 * ЭТО НЕ ENFORCEMENT ENGINE.
 * ЭТО НЕ DECISION ENGINE.
 *
 * AI Auditor обнаруживает аномалии и нарушения.
 * Все алерты ADVISORY (консультативные).
 *
 * AI Auditor может ТОЛЬКО:
 * - detectAnomalies — поиск аномальных паттернов
 * - checkCompliance — проверка соответствия правилам
 *
 * AI Auditor НЕ МОЖЕТ:
 * - блокировать действия
 * - отменять транзакции
 * - применять штрафы
 * - изменять данные
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIAuditor = exports.AIAuditorError = void 0;
const ai_guardrails_1 = require("../ai-guardrails");
// =============================================================================
// AI AUDITOR ERROR
// =============================================================================
class AIAuditorError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AIAuditorError';
    }
}
exports.AIAuditorError = AIAuditorError;
// =============================================================================
// PROMPT TEMPLATES
// =============================================================================
const SYSTEM_CONTEXT = `
Ты — AI Auditor в системе RAI_EP.

РОЛЬ: Аудитор. Ты обнаруживаешь аномалии и нарушения. Ты НЕ принимаешь мер.

ЗАПРЕЩЕНО:
- Блокировать действия
- Отменять транзакции
- Применять штрафы
- Изменять данные
- Давать указания

РАЗРЕШЕНО:
- Сигнализировать об аномалиях
- Показывать факты
- Указывать на паттерны
- Предупреждать о рисках

КАТЕГОРИИ АНОМАЛИЙ:
- data_quality: пропуски, дубликаты, невалидные значения (PRIORITY)
- frequency: слишком много/мало событий (PRIORITY)
- timing: события в нетипичное время (non-critical)

ФОРМАТ ОТВЕТА (строго JSON):
{
  "summary": "краткое описание результатов",
  "anomalies": [
    {
      "category": "data_quality|frequency|timing",
      "severity": "info|warning|critical",
      "description": "...",
      "affected_event_ids": ["..."],
      "detected_pattern": "..."
    }
  ],
  "assumptions": ["..."]
}

Canon: AI сигнализирует. Человек решает.
`;
const COMPLIANCE_CONTEXT = `
Ты — AI Auditor в системе RAI_EP.

РОЛЬ: Проверка соответствия правилам RoleContract. НЕ enforcement.

ЗАПРЕЩЕНО:
- Применять санкции
- Изменять статусы
- Принимать решения

РАЗРЕШЕНО:
- Проверять соответствие правилам
- Сигнализировать о нарушениях
- Показывать факты

ФОРМАТ ОТВЕТА (строго JSON):
{
  "summary": "краткое описание",
  "violations": [
    {
      "rule_name": "...",
      "severity": "info|warning|critical",
      "description": "...",
      "rule_reference": "...",
      "affected_ids": ["..."]
    }
  ],
  "compliant_count": число,
  "total_checked": число,
  "assumptions": ["..."]
}
`;
// =============================================================================
// AI AUDITOR
// =============================================================================
/**
 * AI Auditor - Anomaly Detection & Compliance Checking
 *
 * Обнаруживает проблемы. Не принимает мер.
 */
class AIAuditor {
    llm;
    constructor(llmAdapter) {
        this.llm = llmAdapter;
    }
    // =========================================================================
    // DETECT ANOMALIES
    // =========================================================================
    /**
     * Обнаружение аномалий в событиях
     *
     * Приоритет: data_quality, frequency
     * Non-critical: timing
     */
    async detectAnomalies(input) {
        const prompt = this.buildDetectAnomaliesPrompt(input);
        const guardrailCheck = (0, ai_guardrails_1.checkGuardrails)(prompt);
        if (!guardrailCheck.allowed) {
            throw new AIAuditorError(ai_guardrails_1.REFUSAL_MESSAGE);
        }
        try {
            const response = await this.llm.generate(prompt);
            return this.parseAnomalyReport(response, input);
        }
        catch (error) {
            if (error instanceof AIAuditorError)
                throw error;
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new AIAuditorError(`detectAnomalies failed: ${message}`);
        }
    }
    buildDetectAnomaliesPrompt(input) {
        const categories = input.categories || ['data_quality', 'frequency', 'timing'];
        const eventsList = input.events.slice(0, 50).map((e) => `- [${e.id}] ${e.type} | ${e.timestamp.toISOString()} | ${e.summary}`).join('\n');
        // Simple pre-analysis for context
        const eventCounts = {};
        for (const e of input.events) {
            eventCounts[e.type] = (eventCounts[e.type] || 0) + 1;
        }
        const countsStr = Object.entries(eventCounts)
            .map(([type, count]) => `${type}: ${count}`)
            .join(', ');
        return `${SYSTEM_CONTEXT}

ЗАДАЧА: Найти аномалии в событиях

ПЕРИОД: ${input.period_start.toISOString()} — ${input.period_end.toISOString()}
КАТЕГОРИИ ДЛЯ ПРОВЕРКИ: ${categories.join(', ')}
ВСЕГО СОБЫТИЙ: ${input.events.length}

РАСПРЕДЕЛЕНИЕ ПО ТИПАМ:
${countsStr}

СОБЫТИЯ (первые 50):
${eventsList || 'Нет событий'}

Найди аномалии. НЕ предпринимай действий. Только сигнализируй.`;
    }
    parseAnomalyReport(response, input) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                return this.createFallbackAnomalyReport(response, input);
            }
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                summary: parsed.summary || response.slice(0, 200),
                anomalies: this.parseAnomalies(parsed.anomalies),
                scan_period: {
                    start: input.period_start,
                    end: input.period_end,
                },
                total_events_scanned: input.events.length,
                assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
            };
        }
        catch {
            return this.createFallbackAnomalyReport(response, input);
        }
    }
    parseAnomalies(anomalies) {
        if (!Array.isArray(anomalies))
            return [];
        return anomalies.map((a) => ({
            category: this.validateCategory(a?.category) || 'data_quality',
            severity: this.validateSeverity(a?.severity) || 'info',
            description: String(a?.description || ''),
            affected_event_ids: Array.isArray(a?.affected_event_ids)
                ? a.affected_event_ids.map(String)
                : [],
            detected_pattern: String(a?.detected_pattern || ''),
        }));
    }
    createFallbackAnomalyReport(response, input) {
        return {
            summary: response.slice(0, 500),
            anomalies: [],
            scan_period: {
                start: input.period_start,
                end: input.period_end,
            },
            total_events_scanned: input.events.length,
            assumptions: ['Response was not in expected JSON format'],
        };
    }
    // =========================================================================
    // CHECK COMPLIANCE
    // =========================================================================
    /**
     * Проверка соответствия правилам RoleContract
     *
     * Только проверка. Без санкций.
     */
    async checkCompliance(input) {
        const prompt = this.buildCheckCompliancePrompt(input);
        const guardrailCheck = (0, ai_guardrails_1.checkGuardrails)(prompt);
        if (!guardrailCheck.allowed) {
            throw new AIAuditorError(ai_guardrails_1.REFUSAL_MESSAGE);
        }
        try {
            const response = await this.llm.generate(prompt);
            return this.parseComplianceReport(response, input);
        }
        catch (error) {
            if (error instanceof AIAuditorError)
                throw error;
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new AIAuditorError(`checkCompliance failed: ${message}`);
        }
    }
    buildCheckCompliancePrompt(input) {
        const kpiList = input.kpi_records.map((k) => `- ${k.kpi_name}: ${k.value} ${k.unit}`).join('\n');
        const eventsList = input.events.slice(0, 30).map((e) => `- [${e.type}] ${e.summary}`).join('\n');
        const req = input.role_requirements;
        return `${COMPLIANCE_CONTEXT}

ЗАДАЧА: Проверить соответствие пользователя ${input.user_id} правилам RoleContract

ТРЕБОВАНИЯ УРОВНЯ ${req.level}:
- KPI targets: ${JSON.stringify(req.kpi_targets)}
- Требуется курсов: ${req.required_courses}
- Минимум дней на уровне: ${req.min_days_at_level}

ТЕКУЩИЕ KPI:
${kpiList || 'Нет данных'}

НЕДАВНИЕ СОБЫТИЯ:
${eventsList || 'Нет событий'}

Проверь соответствие. НЕ применяй санкции. Только сигнализируй.`;
    }
    parseComplianceReport(response, input) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                return this.createFallbackComplianceReport(response, input);
            }
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                summary: parsed.summary || response.slice(0, 200),
                violations: this.parseViolations(parsed.violations),
                compliant_count: typeof parsed.compliant_count === 'number' ? parsed.compliant_count : 0,
                total_checked: typeof parsed.total_checked === 'number' ? parsed.total_checked : 0,
                assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions : [],
            };
        }
        catch {
            return this.createFallbackComplianceReport(response, input);
        }
    }
    parseViolations(violations) {
        if (!Array.isArray(violations))
            return [];
        return violations.map((v) => ({
            rule_name: String(v?.rule_name || 'Unknown'),
            severity: this.validateSeverity(v?.severity) || 'warning',
            description: String(v?.description || ''),
            rule_reference: v?.rule_reference ? String(v.rule_reference) : undefined,
            affected_ids: Array.isArray(v?.affected_ids) ? v.affected_ids.map(String) : [],
        }));
    }
    createFallbackComplianceReport(response, input) {
        return {
            summary: response.slice(0, 500),
            violations: [],
            compliant_count: 0,
            total_checked: input.kpi_records.length,
            assumptions: ['Response was not in expected JSON format'],
        };
    }
    // =========================================================================
    // VALIDATORS
    // =========================================================================
    validateCategory(category) {
        const valid = ['data_quality', 'frequency', 'timing'];
        return valid.includes(category) ? category : null;
    }
    validateSeverity(severity) {
        const valid = ['info', 'warning', 'critical'];
        return valid.includes(severity) ? severity : null;
    }
}
exports.AIAuditor = AIAuditor;
