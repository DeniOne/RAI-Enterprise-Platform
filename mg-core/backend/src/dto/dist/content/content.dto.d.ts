import { UUID } from '../common/common.types';
export declare class GenerateContentRequestDto {
    prompt: string;
    type: 'text' | 'image' | 'video';
    style?: string;
    platform?: string;
}
export declare class ContentEngagementStatsDto {
    contentId: UUID;
    views: number;
    likes: number;
    shares: number;
    comments: number;
    engagementRate: number;
}
//# sourceMappingURL=content.dto.d.ts.map