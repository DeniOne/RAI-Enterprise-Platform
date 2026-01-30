import { ISODate } from '../common/common.types';
export declare class DailyPlanResponseDto {
    date: ISODate;
    tasks: string[];
    priorities: string[];
    aiRecommendation?: string;
}
export declare class MorningFeedbackRequestDto {
    mood: string;
    readinessLevel: string;
    photoUrl?: string;
    plannedTasks: string[];
}
export declare class EveningFeedbackRequestDto {
    completedTasks: string[];
    planCompletionPercent: number;
    blockers: string;
    achievements: string;
}
export declare class SMARTReportRequestDto {
    specific: string;
    measurable: string;
    achievable: string;
    relevant: string;
    timeBound: string;
}
//# sourceMappingURL=feedback.dto.d.ts.map