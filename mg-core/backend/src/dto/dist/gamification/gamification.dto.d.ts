import { EmployeeStatus, EmployeeRank } from '../common/common.enums';
import { UUID, ISODateTime } from '../common/common.types';
export declare class StatusResponseDto {
    userId: UUID;
    status: EmployeeStatus;
    rank: EmployeeRank;
    currentGMC: number;
    nextStatusThreshold: number;
    progressPercent: number;
    privileges: string[];
}
export declare class LeaderboardEntryDto {
    userId: UUID;
    fullName: string;
    avatar?: string;
    position: string;
    score: number;
    rankChange: number;
}
export declare class AchievementResponseDto {
    id: UUID;
    name: string;
    description: string;
    icon: string;
    requiredRank: EmployeeRank;
    mcReward?: number;
    unlockedAt: ISODateTime;
}
export declare class ClaimRewardRequestDto {
    achievementId: UUID;
}
//# sourceMappingURL=gamification.dto.d.ts.map