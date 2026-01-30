/**
 * Economy Adapters (Strict Orchestration)
 * Module 08 — MatrixCoin-Economy
 * STEP 5 — PERSISTENCE & API
 * 
 * ⚠️ STRICT RULE:
 * Guard -> Logic -> Audit -> Persist Audit -> Persist State/Flag -> Return
 * No interpretation of business rules.
 */

import { StoreEligibilityService } from './store-eligibility.service';
import { AuctionEventService } from './auction.service';
import { GMCRecognitionBridgeService } from './gmc-recognition.service';
import { EconomyGovernanceService } from './governance.service';

import { AuditEventRepository } from './audit-event.repository';
import {
    MCSnapshotRepository,
    AuctionEventRepository,
    GovernanceFlagRepository
} from './persistence.repositories';

import { StoreAccessContext } from '../core/store.types';
import { AuctionEventContext, AuctionParticipant } from '../core/auction.types';
import { GMCRecognitionContext } from '../core/gmc-recognition.types';
import { EconomyUsageContext } from '../core/governance.types';

// ============================================================================
// 1. STORE ACCESS ADAPTER
// ============================================================================
export class StoreAccessAdapterService {
    constructor(
        private readonly coreService: StoreEligibilityService,
        private readonly auditRepo: AuditEventRepository
    ) { }

    public async evaluateStoreAccess(userId: string, snapshot: any[], options?: any) {
        // 1. Logic + Audit Creation (Pure)
        const { decision, events } = this.coreService.evaluateStoreEligibilityService({
            userId,
            mcSnapshot: snapshot,
            isSystemMaintenance: options?.isSystemMaintenance,
            isUserRestricted: options?.isUserRestricted
        });

        // 2. Persist Audit (CRITICAL STEP)
        for (const event of events) {
            await this.auditRepo.saveEvent(event);
        }

        // 3. Return Decision
        return decision;
    }
}

// ============================================================================
// 2. AUCTION ADAPTER
// ============================================================================
export class AuctionAdapterService {
    constructor(
        private readonly coreService: AuctionEventService,
        private readonly auditRepo: AuditEventRepository,
        private readonly auctionRepo: AuctionEventRepository
    ) { }

    public async participate(context: AuctionEventContext, participant: AuctionParticipant) {
        // 1. Logic + Audit
        const { result, events } = this.coreService.participate(context, participant);

        // 2. Persist Audit (First)
        for (const event of events) {
            await this.auditRepo.saveEvent(event);
        }

        // 3. Persist Raw State (If needed, though participate mostly returns outcome)
        // Note: Participate logic usually updates context/state in memory loops. 
        // If we need to save the Auction State afterwards:
        // await this.auctionRepo.saveEventState(updatedContext); 
        // But core.participicipate is Pure. It returns Outcome. 
        // It does NOT mutate context.
        // Step 3 Logic update? 
        // Assuming context is updated by caller or we just record the attempt here.
        // For Step 5 Adapter, we stick to Audit. State updates are for Open/Close.

        return result;
    }

    public async openAuction(context: AuctionEventContext) {
        const { result, events } = this.coreService.openAuction(context);

        for (const event of events) {
            await this.auditRepo.saveEvent(event);
        }

        // Persist State
        await this.auctionRepo.saveEventState(context);

        return result;
    }

    public async closeAuction(context: AuctionEventContext) {
        const { result, events } = this.coreService.closeAuction(context);

        for (const event of events) {
            await this.auditRepo.saveEvent(event);
        }

        await this.auctionRepo.saveEventState(context);

        return result;
    }
}

// ============================================================================
// 3. GOVERNANCE ADAPTER
// ============================================================================
export class GovernanceAdapterService {
    constructor(
        private readonly coreService: EconomyGovernanceService,
        private readonly auditRepo: AuditEventRepository,
        private readonly flagRepo: GovernanceFlagRepository
    ) { }

    public async evaluateGovernance(context: EconomyUsageContext) {
        // 1. Logic
        const { decision, events } = this.coreService.evaluateGovernance(context);

        // 2. Persist Audit
        for (const event of events) {
            await this.auditRepo.saveEvent(event);
        }

        // 3. Persist Flags (Review Queue)
        // Only if not strictly Allowed
        await this.flagRepo.saveFlag(context.userId, context.usageContextId, decision);

        return decision;
    }
}
