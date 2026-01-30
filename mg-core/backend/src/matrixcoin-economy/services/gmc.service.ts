/**
 * GMC Service — Minimal Implementation
 * Module 08 — MatrixCoin-Economy
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

import { randomUUID } from 'crypto';
import {
    GMCState,
    GMCRecognitionRequest
} from '../core/gmc.types';
import {
    guardGMCRecognitionRequest,
    guardGMCStructuralInvariants
} from '../guards/gmc.invariant-guards';
import {
    AuditEventType,
    GMCAuditEventRecognized,
    createBaseAuditEvent,
    validateGMCRecognizedEvent
} from '../core/audit.types';

// ============================================================================
// TYPES
// ============================================================================

export interface GMCRecognitionResult {
    readonly gmc: GMCState;
    readonly auditEvent: GMCAuditEventRecognized;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class GMCService {

    /**
     * Recognize GMC for a user
     * Validates all invariants and creates immutable GMC record
     */
    public recognizeGMC(request: GMCRecognitionRequest): GMCRecognitionResult {
        // 1. Guard: Validate Request & Actor
        // Ensures Actor is HUMAN, Not AI, Justification exists, Category valid
        guardGMCRecognitionRequest(request, 'HUMAN');

        const now = new Date();

        // 2. Construct GMC State (Immutable)
        const newGMC: GMCState = {
            id: randomUUID(),
            userId: request.userId,
            amount: request.amount,
            category: request.category,
            justification: request.justification,
            recognizedBy: request.recognizedBy,
            recognizedAt: now
        };

        // 3. Double-check Structural Invariants on created object
        guardGMCStructuralInvariants(newGMC);

        // 4. Create Audit Event
        const baseEvent = createBaseAuditEvent(
            AuditEventType.GMC_RECOGNIZED,
            request.recognizedBy,
            'HUMAN'
        );

        const auditEvent: GMCAuditEventRecognized = {
            ...baseEvent,
            eventId: randomUUID(),
            eventType: AuditEventType.GMC_RECOGNIZED,
            gmcId: newGMC.id,
            userId: newGMC.userId,
            amount: newGMC.amount,
            category: newGMC.category,
            justification: newGMC.justification,
            recognizedBy: newGMC.recognizedBy
        };

        // 5. Validate Event Structure
        validateGMCRecognizedEvent(auditEvent);

        return { gmc: newGMC, auditEvent };
    }
}
