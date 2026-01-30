/**
 * PHASE 4.5 - AI Feedback Loop
 * Ethics Guard: Validates feedback comments for ethical compliance
 * 
 * Canon: Feedback ≠ HR Tool, Feedback ≠ Personal Evaluation
 * 
 * Prevents:
 * - Personal evaluations of employees
 * - Toxic language
 * - Punishment/sanction demands
 */

export interface EthicsValidationResult {
    valid: boolean;
    reason?: string;
    violationType?: 'PERSON_EVALUATION' | 'TOXIC_LANGUAGE' | 'PUNISHMENT_DEMAND';
}

export class FeedbackEthicsGuard {
    /**
     * Validate feedback comment for ethical compliance
     */
    validate(comment: string | null | undefined): EthicsValidationResult {
        // Empty comments are always valid
        if (!comment || comment.trim().length === 0) {
            return { valid: true };
        }

        const normalizedComment = comment.toLowerCase();

        // 1. Check for personal evaluations
        const personEvaluationResult = this.checkPersonEvaluation(normalizedComment);
        if (!personEvaluationResult.valid) {
            return personEvaluationResult;
        }

        // 2. Check for toxic language
        const toxicLanguageResult = this.checkToxicLanguage(normalizedComment);
        if (!toxicLanguageResult.valid) {
            return toxicLanguageResult;
        }

        // 3. Check for punishment demands
        const punishmentResult = this.checkPunishmentDemands(normalizedComment);
        if (!punishmentResult.valid) {
            return punishmentResult;
        }

        return { valid: true };
    }

    /**
     * Check for personal evaluations of people
     */
    private checkPersonEvaluation(comment: string): EthicsValidationResult {
        const patterns = [
            // Negative evaluations
            /\b(плохой|тупой|ленивый|глупый|бестолковый|некомпетентный)\s+(сотрудник|работник|человек|менеджер|директор|руководитель|коллега)/i,
            // Positive evaluations (also forbidden - feedback is about AI, not people)
            /\b(хороший|умный|талантливый|способный)\s+(сотрудник|работник|человек|менеджер|директор|руководитель|коллега)/i,
            // Action demands on people
            /\b(уволить|наказать|премировать|штрафовать|повысить|понизить)\s+\w+/i,
            // Blame assignment
            /\b(виноват|виновен|ответственен)\s+\w+/i,
        ];

        for (const pattern of patterns) {
            if (pattern.test(comment)) {
                return {
                    valid: false,
                    reason: 'Feedback should focus on AI recommendations, not personal evaluations of people',
                    violationType: 'PERSON_EVALUATION',
                };
            }
        }

        return { valid: true };
    }

    /**
     * Check for toxic language
     */
    private checkToxicLanguage(comment: string): EthicsValidationResult {
        const toxicWords = [
            'идиот',
            'дурак',
            'тупица',
            'мудак',
            'дебил',
            'кретин',
            'придурок',
            'олух',
            'болван',
        ];

        for (const word of toxicWords) {
            const pattern = new RegExp(`\\b${word}\\b`, 'i');
            if (pattern.test(comment)) {
                return {
                    valid: false,
                    reason: 'Please keep feedback professional and constructive',
                    violationType: 'TOXIC_LANGUAGE',
                };
            }
        }

        return { valid: true };
    }

    /**
     * Check for punishment/sanction demands
     */
    private checkPunishmentDemands(comment: string): EthicsValidationResult {
        const patterns = [
            /\b(штраф|санкция|выговор|увольнение|наказание)\b/i,
            /\b(должны?\s+(уволить|наказать|оштрафовать))/i,
            /\b(требую|требуем)\s+(наказ|штраф|увольн)/i,
        ];

        for (const pattern of patterns) {
            if (pattern.test(comment)) {
                return {
                    valid: false,
                    reason: 'Feedback cannot be used to demand punishments or sanctions',
                    violationType: 'PUNISHMENT_DEMAND',
                };
            }
        }

        return { valid: true };
    }
}

export const feedbackEthicsGuard = new FeedbackEthicsGuard();
