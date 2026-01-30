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

import { StoreEligibilityService } from './store-eligibility.service';
import { AuditEventRepository } from './audit-event.repository';
import { StoreEligibilityContext, StoreEligibilityDecision } from '../core/store.types';

export class StoreEligibilityAdapterService {
    constructor(
        private readonly coreService: StoreEligibilityService,
        private readonly auditRepo: AuditEventRepository
    ) { }

    /**
     * Evaluate Eligibility & Persist Audit.
     * Guaranteed Audit First flow not strictly possible since core returns both,
     * BUT we guarantee persistence before returning to controller.
     */
    public evaluateEligibility(context: StoreEligibilityContext): StoreEligibilityDecision {
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
