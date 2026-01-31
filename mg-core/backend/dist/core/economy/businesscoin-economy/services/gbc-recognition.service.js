"use strict";
/**
 * GMC Recognition Bridge Service
 * Module 08 — BusinessCoin-Economy
 * STEP 3.3 — GMC RECOGNITION BRIDGE
 *
 * ⚠️ SERVICE WRAPPER.
 * Guards → Logic → Audit
 * Emits Recognition Signals (Flagged Events) for human review.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GMCRecognitionBridgeService = void 0;
const crypto_1 = require("crypto");
const economy_enums_1 = require("../core/economy.enums");
const gmc_recognition_guards_1 = require("../guards/gmc-recognition.guards");
const gmc_recognition_logic_1 = require("../core/gmc-recognition.logic");
const audit_types_1 = require("../core/audit.types");
class GMCRecognitionBridgeService {
    /**
     * Evaluate Recognition for a completed Auction Event Participant
     */
    evaluateRecognition(params) {
        const timestamp = new Date();
        const { auctionEventId, auctionStatus, participantId, mcSnapshot } = params;
        // 1. Inject Random Factor (System Source of Non-Determinism)
        const randomFactor = Math.random();
        const context = {
            auctionEventId,
            auctionStatus,
            participantId,
            mcSnapshot,
            randomFactor,
            now: timestamp
        };
        const events = [];
        try {
            // 2. Guards
            (0, gmc_recognition_guards_1.guardAuctionClosed)(context);
            (0, gmc_recognition_guards_1.guardParticipantValid)(context);
            (0, gmc_recognition_guards_1.guardMCSnapshotPresent)(context);
            // 3. Logic
            const decision = (0, gmc_recognition_logic_1.evaluateGMCRecognition)(context);
            // 4. Audit (Evaluated)
            const baseEvent = (0, audit_types_1.createBaseAuditEvent)(audit_types_1.AuditEventType.GMC_RECOGNITION_EVALUATED, 'SYSTEM', 'SYSTEM');
            const evaluatedEvent = {
                ...baseEvent,
                eventId: (0, crypto_1.randomUUID)(),
                eventType: audit_types_1.AuditEventType.GMC_RECOGNITION_EVALUATED,
                auctionEventId,
                participantId,
                mcSnapshot, // Read-only snapshot
                status: decision.status,
                evaluatedAt: decision.evaluatedAt
            };
            (0, audit_types_1.validateAuditEvent)(evaluatedEvent);
            events.push(evaluatedEvent);
            // 5. Audit (Flagged - Signal)
            if (decision.status === economy_enums_1.GMCRecognitionStatus.ELIGIBLE) {
                const flaggedEvent = {
                    ...(0, audit_types_1.createBaseAuditEvent)(audit_types_1.AuditEventType.GMC_RECOGNITION_FLAGGED, 'SYSTEM', 'SYSTEM'),
                    eventId: (0, crypto_1.randomUUID)(),
                    eventType: audit_types_1.AuditEventType.GMC_RECOGNITION_FLAGGED,
                    auctionEventId,
                    participantId,
                    mcSnapshot,
                    trigger: decision.trigger || economy_enums_1.GMCRecognitionTrigger.PROBABILISTIC_CHECK,
                    flaggedAt: timestamp
                };
                (0, audit_types_1.validateAuditEvent)(flaggedEvent);
                events.push(flaggedEvent);
                // In real system: Notify Human Admins
            }
            return { decision, events };
        }
        catch (error) {
            // Handle Denials (Guard Failures)
            if (error instanceof gmc_recognition_guards_1.GMCRecognitionError) {
                const deniedEvent = {
                    ...(0, audit_types_1.createBaseAuditEvent)(audit_types_1.AuditEventType.GMC_RECOGNITION_DENIED, 'SYSTEM', 'SYSTEM'),
                    eventId: (0, crypto_1.randomUUID)(),
                    eventType: audit_types_1.AuditEventType.GMC_RECOGNITION_DENIED,
                    auctionEventId,
                    participantId,
                    mcSnapshot,
                    denialReason: error.reason,
                    deniedAt: timestamp
                };
                (0, audit_types_1.validateAuditEvent)(deniedEvent);
                events.push(deniedEvent);
                const decision = {
                    status: economy_enums_1.GMCRecognitionStatus.DENIED,
                    deniedReason: error.reason,
                    evaluatedAt: timestamp
                };
                return { decision, events };
            }
            throw error;
        }
    }
}
exports.GMCRecognitionBridgeService = GMCRecognitionBridgeService;
