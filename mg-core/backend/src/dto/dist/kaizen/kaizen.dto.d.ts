import { UUID, ISODateTime } from '../common/common.types';
export declare class ImprovementProposalRequestDto {
    title: string;
    description: string;
    expectedImpact: string;
    category?: string;
}
export declare class ImprovementResponseDto {
    id: UUID;
    authorId: UUID;
    title: string;
    description: string;
    status: string;
    votes: number;
    mcReward?: number;
    createdAt: ISODateTime;
}
//# sourceMappingURL=kaizen.dto.d.ts.map