/**
 * Economy Analytics DTOs
 * PHASE 4 — Analytics, Observability & Governance
 */

export class EconomyOverviewDto {
    totalIssuedMC: number;
    totalSpentMC: number;
    totalBurnedMC: number;
    activeWalletsCount: number;
    timestamp: Date;
}

export class StoreActivityDto {
    itemId: string;
    itemTitle: string;
    purchaseCount: number;
    totalVolumeMC: number;
}

export class WalletTrendPointDto {
    timestamp: Date;
    mcBalance: number;
    gmcBalance: number;
}

export class AuditLogEntryDto {
    id: string;
    timestamp: Date;
    action: string;
    details: any;
    userId: string;
}
