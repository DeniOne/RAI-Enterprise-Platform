export enum AdvisorySignalType {
    RISK = 'RISK',
    HEALTH = 'HEALTH',
    EFFICIENCY = 'EFFICIENCY',
    STABILITY = 'STABILITY',
}

export enum AdvisoryLevel {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
}

export enum AdvisoryTrend {
    IMPROVING = 'IMPROVING',
    WORSENING = 'WORSENING',
    STABLE = 'STABLE',
}

export class AdvisorySignalDto {
    type: AdvisorySignalType;
    level: AdvisoryLevel;
    score: number; // 0-100
    message: string;
    confidence: number; // 0-1
    trend: AdvisoryTrend;
    sources: string[];
}
