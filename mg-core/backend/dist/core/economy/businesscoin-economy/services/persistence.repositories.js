"use strict";
/**
 * Economy Persistence Repositories
 * Module 08 — BusinessCoin-Economy
 * STEP 5 — PERSISTENCE & API
 *
 * ⚠️ STRICT SEPARATION:
 * - Separate Classes
 * - No Shared Logic
 * - Strict Mapping
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GovernanceFlagRepository = exports.AuctionEventRepository = exports.MCSnapshotRepository = void 0;
const economy_enums_1 = require("../core/economy.enums"); // For mapping
const crypto_1 = require("crypto");
// ============================================================================
// MC SNAPSHOT REPOSITORY
// ============================================================================
class MCSnapshotRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async saveSnapshot(userId, snapshot) {
        const totalAmount = snapshot.reduce((acc, mc) => acc + mc.amount, 0);
        // @ts-ignore
        await this.prisma.BusinessCoinSnapshot.create({
            data: {
                snapshot_id: (0, crypto_1.randomUUID)(),
                user_id: userId,
                total_amount: totalAmount, // Decimal mapping handled by Prisma
                mc_state_json: snapshot,
                captured_at: new Date()
            }
        });
    }
    async findUserSnapshot(userId) {
        // @ts-ignore
        const latest = await this.prisma.BusinessCoinSnapshot.findFirst({
            where: { user_id: userId },
            orderBy: { captured_at: 'desc' }
        });
        if (!latest)
            return [];
        return latest.mc_state_json;
    }
}
exports.MCSnapshotRepository = MCSnapshotRepository;
// ============================================================================
// AUCTION EVENT REPOSITORY
// ============================================================================
class AuctionEventRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Persist RAW Auction Event State.
     * No interpretation of "Next Step". Just storage.
     */
    async saveEventState(context) {
        // @ts-ignore
        await this.prisma.auctionEventState.upsert({
            where: { event_id: context.eventId },
            update: {
                status: context.status,
                state_payload: context
            },
            create: {
                event_id: context.eventId,
                status: context.status,
                state_payload: context
            }
        });
    }
}
exports.AuctionEventRepository = AuctionEventRepository;
// ============================================================================
// GOVERNANCE FLAG REPOSITORY
// ============================================================================
class GovernanceFlagRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async saveFlag(userId, contextId, decision) {
        // Only persist if something noteworthy happened
        if (decision.restriction === economy_enums_1.GovernanceRestriction.NONE && !decision.violationReason) {
            return;
        }
        // @ts-ignore
        await this.prisma.governanceFlag.create({
            data: {
                flag_id: (0, crypto_1.randomUUID)(),
                user_id: userId,
                context_id: contextId,
                review_level: decision.reviewLevel,
                status: 'PENDING',
                reason: decision.explanation || decision.violationReason || 'Flagged',
                payload: decision,
                flagged_at: decision.evaluatedAt
            }
        });
    }
}
exports.GovernanceFlagRepository = GovernanceFlagRepository;
