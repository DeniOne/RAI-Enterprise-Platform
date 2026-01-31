"use strict";
/**
 * GMC Service — Minimal Implementation
 * Module 08 — BusinessCoin-Economy
 * STEP 2.4 — SERVICE IMPLEMENTATION
 *
 * ⚠️ CANONICAL: Based on STEP-2-STATE-LIFECYCLE.md
 *
 * Scope:
 * - recognizeGMC (Human only)
 *
 * GMC is IMMUTABLE. Service creates record + audit event.
 * NO DB Persistence yet.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GMCService = void 0;
const crypto_1 = require("crypto");
const gmc_invariant_guards_1 = require("../guards/gmc.invariant-guards");
const audit_types_1 = require("../core/audit.types");
// ============================================================================
// SERVICE CLASS
// ============================================================================
class GMCService {
    /**
     * Recognize GMC for a user
     * Validates all invariants and creates immutable GMC record
     */
    recognizeGMC(request) {
        // 1. Guard: Validate Request & Actor
        // Ensures Actor is HUMAN, Not AI, Justification exists, Category valid
        (0, gmc_invariant_guards_1.guardGMCRecognitionRequest)(request, 'HUMAN');
        const now = new Date();
        // 2. Construct GMC State (Immutable)
        const newGMC = {
            id: (0, crypto_1.randomUUID)(),
            userId: request.userId,
            amount: request.amount,
            category: request.category,
            justification: request.justification,
            recognizedBy: request.recognizedBy,
            recognizedAt: now
        };
        // 3. Double-check Structural Invariants on created object
        (0, gmc_invariant_guards_1.guardGMCStructuralInvariants)(newGMC);
        // 4. Create Audit Event
        const baseEvent = (0, audit_types_1.createBaseAuditEvent)(audit_types_1.AuditEventType.GMC_RECOGNIZED, request.recognizedBy, 'HUMAN');
        const auditEvent = {
            ...baseEvent,
            eventId: (0, crypto_1.randomUUID)(),
            eventType: audit_types_1.AuditEventType.GMC_RECOGNIZED,
            gmcId: newGMC.id,
            userId: newGMC.userId,
            amount: newGMC.amount,
            category: newGMC.category,
            justification: newGMC.justification,
            recognizedBy: newGMC.recognizedBy
        };
        // 5. Validate Event Structure
        (0, audit_types_1.validateGMCRecognizedEvent)(auditEvent);
        return { gmc: newGMC, auditEvent };
    }
}
exports.GMCService = GMCService;
