/**
 * @file InstitutionalContracts.ts
 * @description Канонические контракты Фазы 4 для Institutional Control Plane.
 * ВЕРСИЯ: 1.0.0 (Institutional Grade)
 */

export type RiskTier = 'R1' | 'R2' | 'R3' | 'R4';

/**
 * @interface InstitutionalEffect
 * @description Детерминированный эффект действия в управлении.
 */
export interface InstitutionalEffect {
    readonly effectId: string;
    readonly sourceDecisionId: string;
    readonly domain: string;
    readonly action: string;
    readonly impactLevel: RiskTier;
    readonly timestamp: number;
    readonly originState: string;
    readonly targetState: string;
    readonly traceId: string;
    readonly requiresEscalation: boolean;
    /** Канонический хеш, устанавливаемый после коммита в Ledger */
    immutableHash?: string;
}

/**
 * @interface InstitutionalConflict
 * @description Формализованный институциональный конфликт между доменами.
 */
export interface InstitutionalConflict {
    readonly conflictId: string;
    readonly domainA: string;
    readonly domainB: string;
    readonly severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    readonly blocking: boolean;
    /** Порядок эскалации, вычисленный через InstitutionalGraph */
    readonly escalationPath: {
        readonly nodeId: string;
        readonly authorityRequired: string;
        readonly order: number;
    }[];
    resolutionState: 'OPEN' | 'ESCALATED' | 'RESOLVED';
}
