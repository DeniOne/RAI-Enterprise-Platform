"use strict";
/**
 * Qualification Recorder - Phase 1.2
 *
 * Записывает результат оценки как QUALIFICATION_PROPOSED Event.
 *
 * ВАЖНО: Это НЕ решение, а ПРЕДЛОЖЕНИЕ.
 * Решение о изменении квалификации принимает человек.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordQualificationProposal = recordQualificationProposal;
// =============================================================================
// QUALIFICATION RECORDER
// =============================================================================
/**
 * Записать результат оценки как QUALIFICATION_PROPOSED Event
 *
 * @param prisma - Prisma клиент
 * @param evaluation - Результат оценки
 * @returns Созданный Event
 */
async function recordQualificationProposal(prisma, evaluation) {
    // Serialize evidence to plain JSON array for Prisma
    const serializedEvidence = evaluation.evidence.map(e => ({
        type: e.type,
        description: e.description,
        value: e.value,
        polarity: e.polarity,
        source_event_id: e.source_event_id,
    }));
    return prisma.event.create({
        data: {
            type: 'QUALIFICATION_PROPOSED',
            source: 'system',
            subject_id: evaluation.user_id,
            subject_type: 'user',
            payload: {
                user_id: evaluation.user_id,
                role_id: evaluation.role_id,
                current_level: evaluation.current_level,
                proposed_level: calculateProposedLevel(evaluation),
                state: evaluation.state,
                days_at_current_level: evaluation.days_at_current_level,
                evidence: serializedEvidence,
                reason: generateReason(evaluation),
            },
            metadata: {
                evaluated_at: evaluation.evaluated_at.toISOString(),
            },
            timestamp: evaluation.evaluated_at,
        },
    });
}
/**
 * Рассчитать предложенный уровень
 *
 * ВАЖНО: Это ПРЕДЛОЖЕНИЕ, не решение!
 */
function calculateProposedLevel(evaluation) {
    switch (evaluation.state) {
        case 'eligible_for_upgrade':
            return Math.min(evaluation.current_level + 1, 5);
        case 'risk_of_downgrade':
            return Math.max(evaluation.current_level - 1, 1);
        case 'stable':
        default:
            return evaluation.current_level;
    }
}
/**
 * Генерировать причину предложения
 */
function generateReason(evaluation) {
    const positiveEvidence = evaluation.evidence.filter(e => e.polarity === 'positive');
    const negativeEvidence = evaluation.evidence.filter(e => e.polarity === 'negative');
    switch (evaluation.state) {
        case 'eligible_for_upgrade':
            return `Готов к повышению. Положительных факторов: ${positiveEvidence.length}`;
        case 'risk_of_downgrade':
            return `Риск понижения. Негативных факторов: ${negativeEvidence.length}`;
        case 'stable':
        default:
            return 'Стабильное состояние';
    }
}
