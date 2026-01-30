/**
 * PHASE 4.5 - AI Feedback Loop
 * DTO: Feedback Analytics Response
 */

export interface FeedbackAnalyticsDto {
    totalFeedback: number;
    byType: {
        HELPFUL: number;
        NOT_APPLICABLE: number;
        UNSURE: number;
    };
    percentages: {
        helpful: number;
        notApplicable: number;
        unsure: number;
    };
    periodStart: string;
    periodEnd: string;
    generatedAt: string;
}
