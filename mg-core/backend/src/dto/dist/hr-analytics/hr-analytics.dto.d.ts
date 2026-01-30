import { UUID, ISODateTime } from '../common/common.types';
export declare class NetworkNodeDto {
    id: UUID;
    label: string;
    centralityScore: number;
    group: string;
}
export declare class NetworkLinkDto {
    source: UUID;
    target: UUID;
    weight: number;
}
export declare class NetworkAnalysisResponseDto {
    nodes: NetworkNodeDto[];
    links: NetworkLinkDto[];
    analyzedAt: ISODateTime;
}
export declare class MicroSurveyRequestDto {
    title: string;
    questions: string[];
    targetPercentage: number;
}
//# sourceMappingURL=hr-analytics.dto.d.ts.map