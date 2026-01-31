"use strict";
/**
 * Economy Adapters (Strict Orchestration)
 * Module 08 — BusinessCoin-Economy
 * STEP 5 — PERSISTENCE & API
 *
 * ⚠️ STRICT RULE:
 * Guard -> Logic -> Audit -> Persist Audit -> Persist State/Flag -> Return
 * No interpretation of business rules.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GovernanceAdapterService = exports.AuctionAdapterService = exports.StoreAccessAdapterService = void 0;
// ============================================================================
// 1. STORE ACCESS ADAPTER
// ============================================================================
class StoreAccessAdapterService {
    coreService;
    auditRepo;
    constructor(coreService, auditRepo) {
        this.coreService = coreService;
        this.auditRepo = auditRepo;
    }
    async evaluateStoreAccess(userId, snapshot, options) {
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
exports.StoreAccessAdapterService = StoreAccessAdapterService;
// ============================================================================
// 2. AUCTION ADAPTER
// ============================================================================
class AuctionAdapterService {
    coreService;
    auditRepo;
    auctionRepo;
    constructor(coreService, auditRepo, auctionRepo) {
        this.coreService = coreService;
        this.auditRepo = auditRepo;
        this.auctionRepo = auctionRepo;
    }
    async participate(context, participant) {
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
    async openAuction(context) {
        const { result, events } = this.coreService.openAuction(context);
        for (const event of events) {
            await this.auditRepo.saveEvent(event);
        }
        // Persist State
        await this.auctionRepo.saveEventState(context);
        return result;
    }
    async closeAuction(context) {
        const { result, events } = this.coreService.closeAuction(context);
        for (const event of events) {
            await this.auditRepo.saveEvent(event);
        }
        await this.auctionRepo.saveEventState(context);
        return result;
    }
}
exports.AuctionAdapterService = AuctionAdapterService;
// ============================================================================
// 3. GOVERNANCE ADAPTER
// ============================================================================
class GovernanceAdapterService {
    coreService;
    auditRepo;
    flagRepo;
    constructor(coreService, auditRepo, flagRepo) {
        this.coreService = coreService;
        this.auditRepo = auditRepo;
        this.flagRepo = flagRepo;
    }
    async evaluateGovernance(context) {
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
exports.GovernanceAdapterService = GovernanceAdapterService;
