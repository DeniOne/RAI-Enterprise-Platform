import { UUID, ISODateTime } from '../common/common.types';
export declare class KnowledgeSearchRequestDto {
    query: string;
    tags?: string[];
    limit?: number;
}
export declare class KnowledgeItemResponseDto {
    id: UUID;
    title: string;
    content: string;
    category: string;
    tags: string[];
    relevanceScore: number;
    updatedAt: ISODateTime;
}
//# sourceMappingURL=knowledge.dto.d.ts.map