import { UUID, ISODateTime } from '../common/common.types';
export declare class SocialScreeningRequestDto {
    candidateName: string;
    socialLinks: string[];
}
export declare class SocialMoodResponseDto {
    userId: UUID;
    platform: string;
    mood: string;
    confidenceScore: number;
    analyzedAt: ISODateTime;
}
//# sourceMappingURL=social.dto.d.ts.map