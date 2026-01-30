"use strict";
/**
 * Store Access Adapter Service
 * Module 08 — MatrixCoin-Economy
 * STEP 5 — PERSISTENCE & API
 *
 * ⚠️ THIN ORCHESTRATOR:
 * 1. Call Core Service
 * 2. Persist Audit (Mandatory)
 * 3. Return Decision
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreAccessAdapterService = void 0;
class StoreAccessAdapterService {
    coreService;
    auditRepo;
    constructor(coreService, auditRepo) {
        this.coreService = coreService;
        this.auditRepo = auditRepo;
    }
    /**
     * Evaluate Access & Persist Audit.
     * Guaranteed Audit First flow not strictly possible since core returns both,
     * BUT we guarantee persistence before returning to controller.
     */
    evaluateAccess(context) {
        // 1. Delegate to Core
        // Core service handles its own try/catch to return decision + emit events internally?
        // Wait, Core Service implemented in Step 3 sends nothing to DB. 
        // It returns decision? No, let's check StoreAccessService signature from Step 3 Snapshot.
        // It returns StoreAccessDecision. But where are the events?
        // Ah, Core Service in Step 3 generates events but does not return them in the signature we saw?
        // Correction: We need to see how Core Service exposes events.
        // If Core Service swallows events, we can't persist them.
        // Let's assume Core Service returns { decision, events } or we access them via a callback/observer?
        // Or did we implementation inside Core Service pure logic return everything?
        // RE-READING STEP 3 CODE VIA SNAPSHOT/MEMORY:
        // Core Service: evaluateStoreAccessService(params) : StoreAccessDecision.
        // Inside it emits nothing external. 
        // WAIT. The prompt says "wraps guards, pure logic, and audit event creation".
        // Use View File to confirm StoreAccessService implementation.
        // If it doesn't return events, we must adapt.
        // Placeholder until checked:
        // Assuming we need to recreate the audit event here using the decision? 
        // NO. That violates "Core defines Audit".
        // Core Service SHOULD return the event.
        // Let's do a quick View File on store-access.service.ts to be sure.
        throw new Error("Audit Event Access Check Needed");
    }
}
exports.StoreAccessAdapterService = StoreAccessAdapterService;
