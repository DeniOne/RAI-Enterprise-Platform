/**
 * Economy Persistence Repositories
 * Module 08 — MatrixCoin-Economy
 * STEP 5 — PERSISTENCE & API
 * 
 * ⚠️ STRICT SEPARATION:
 * - Separate Classes
 * - No Shared Logic
 * - Strict Mapping
 */

import { PrismaClient } from '@prisma/client';
import { MCState } from '../core/mc.types';
import { AuctionEventContext, AuctionEventResult } from '../core/auction.types';
import { GovernanceDecision, EconomyUsageContext } from '../core/governance.types';
import { GovernanceRestriction } from '../core/economy.enums'; // For mapping
import { randomUUID } from 'crypto';

// ============================================================================
// MC SNAPSHOT REPOSITORY
// ============================================================================
export class MCSnapshotRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async saveSnapshot(userId: string, snapshot: readonly MCState[]): Promise<void> {
        const totalAmount = snapshot.reduce((acc, mc) => acc + mc.amount, 0);

        // @ts-ignore
        await this.prisma.matrixCoinSnapshot.create({
            data: {
                snapshot_id: randomUUID(),
                user_id: userId,
                total_amount: totalAmount, // Decimal mapping handled by Prisma
                mc_state_json: snapshot as any,
                captured_at: new Date()
            }
        });
    }

    async findUserSnapshot(userId: string): Promise<MCState[]> {
        // @ts-ignore
        const latest = await this.prisma.matrixCoinSnapshot.findFirst({
            where: { user_id: userId },
            orderBy: { captured_at: 'desc' }
        });

        if (!latest) return [];
        return latest.mc_state_json as any;
    }
}

// ============================================================================
// AUCTION EVENT REPOSITORY
// ============================================================================
export class AuctionEventRepository {
    constructor(private readonly prisma: PrismaClient) { }

    /**
     * Persist RAW Auction Event State.
     * No interpretation of "Next Step". Just storage.
     */
    async saveEventState(context: AuctionEventContext): Promise<void> {
        // @ts-ignore
        await this.prisma.auctionEventState.upsert({
            where: { event_id: context.eventId },
            update: {
                status: context.status,
                state_payload: context as any
            },
            create: {
                event_id: context.eventId,
                status: context.status,
                state_payload: context as any
            }
        });
    }
}

// ============================================================================
// GOVERNANCE FLAG REPOSITORY
// ============================================================================
export class GovernanceFlagRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async saveFlag(
        userId: string,
        contextId: string,
        decision: GovernanceDecision
    ): Promise<void> {
        // Only persist if something noteworthy happened
        if (decision.restriction === GovernanceRestriction.NONE && !decision.violationReason) {
            return;
        }

        // @ts-ignore
        await this.prisma.governanceFlag.create({
            data: {
                flag_id: randomUUID(),
                user_id: userId,
                context_id: contextId,
                review_level: decision.reviewLevel,
                status: 'PENDING',
                reason: decision.explanation || decision.violationReason || 'Flagged',
                payload: decision as any,
                flagged_at: decision.evaluatedAt
            }
        });
    }
}
