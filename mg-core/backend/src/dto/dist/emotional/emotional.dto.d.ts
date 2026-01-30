import { UUID, ISODateTime, EmotionalTone } from '../common/common.types';
export declare class CompanyMoodResponseDto {
    averageTone: EmotionalTone;
    dominantEmotion: string;
    trend: number;
    calculatedAt: ISODateTime;
}
export declare class BurnoutRiskResponseDto {
    employeeId: UUID;
    employeeName: string;
    riskScore: number;
    riskFactors: string[];
    recommendation: string;
}
//# sourceMappingURL=emotional.dto.d.ts.map