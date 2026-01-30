"use strict";
/**
 * Economy Analytics DTOs
 * PHASE 4 — Analytics, Observability & Governance
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogEntryDto = exports.WalletTrendPointDto = exports.StoreActivityDto = exports.EconomyOverviewDto = void 0;
class EconomyOverviewDto {
    totalIssuedMC;
    totalSpentMC;
    totalBurnedMC;
    activeWalletsCount;
    timestamp;
}
exports.EconomyOverviewDto = EconomyOverviewDto;
class StoreActivityDto {
    itemId;
    itemTitle;
    purchaseCount;
    totalVolumeMC;
}
exports.StoreActivityDto = StoreActivityDto;
class WalletTrendPointDto {
    timestamp;
    mcBalance;
    gmcBalance;
}
exports.WalletTrendPointDto = WalletTrendPointDto;
class AuditLogEntryDto {
    id;
    timestamp;
    action;
    details;
    userId;
}
exports.AuditLogEntryDto = AuditLogEntryDto;
