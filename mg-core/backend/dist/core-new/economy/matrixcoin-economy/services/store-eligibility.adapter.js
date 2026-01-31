"use strict";
/**
 * Store Eligibility Adapter Service
 * Module 08 — MatrixCoin-Economy
 * PHASE 0 — STORE (ELIGIBILITY LOGIC)
 *
 * ⚠️ THIN ORCHESTRATOR:
 * 1. Call Core Service
 * 2. Persist Audit (Mandatory)
 * 3. Return Decision
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreEligibilityAdapterService = void 0;
class StoreEligibilityAdapterService {
    coreService;
    auditRepo;
    constructor(coreService, auditRepo) {
        this.coreService = coreService;
        this.auditRepo = auditRepo;
    }
    /**
     * Evaluate Eligibility & Persist Audit.
     * Guaranteed Audit First flow not strictly possible since core returns both,
     * BUT we guarantee persistence before returning to controller.
     */
    evaluateEligibility(context) {
        // 1. Delegate to Core
        const { decision, events } = this.coreService.evaluateStoreEligibilityService({
            userId: context.userId,
            mcSnapshot: context.mcSnapshot,
            isSystemMaintenance: context.isSystemMaintenance,
            isUserRestricted: context.isUserRestricted
        });
        // 2. Persist Audit Events (Mandatory)
        for (const event of events) {
            this.auditRepo.saveEvent(event);
        }
        // 3. Return Decision
        return decision;
    }
}
exports.StoreEligibilityAdapterService = StoreEligibilityAdapterService;
