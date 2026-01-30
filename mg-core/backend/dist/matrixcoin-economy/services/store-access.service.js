"use strict";
/**
 * Store Access Service — Minimal Implementation
 * Module 08 — MatrixCoin-Economy
 * STEP 3.1 — STORE (ACCESS LOGIC)
 *
 * ⚠️ SERVICE WRAPPER.
 * Guards → Logic → Audit
 * No DB logic (snapshot passed in).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreAccessService = void 0;
const crypto_1 = require("crypto");
const economy_enums_1 = require("../core/economy.enums");
const store_access_guards_1 = require("../guards/store-access.guards");
const store_access_logic_1 = require("../core/store-access.logic");
const audit_types_1 = require("../core/audit.types");
class StoreAccessService {
    /**
     * Evaluates Store Access with full Audit trail
     */
    evaluateStoreAccessService(params) {
        const timestamp = new Date();
        const { userId, mcSnapshot, isSystemMaintenance = false, isUserRestricted = false } = params;
        const context = {
            userId,
            mcSnapshot,
            timestamp,
            isSystemMaintenance,
            isUserRestricted
        };
        const events = [];
        try {
            // 1. Structural/System Guards
            (0, store_access_guards_1.guardValidContext)(context);
            (0, store_access_guards_1.guardSystemOperational)(isSystemMaintenance);
            (0, store_access_guards_1.guardUserNotRestricted)(isUserRestricted);
            // 2. Pure Logic Evaluation
            const decision = (0, store_access_logic_1.evaluateStoreAccess)(context);
            // 3. Audit Event (Evaluated)
            const baseEvent = (0, audit_types_1.createBaseAuditEvent)(audit_types_1.AuditEventType.STORE_ACCESS_EVALUATED, userId, 'HUMAN' // Assumption: Store access is user-driven
            );
            const auditEvent = {
                ...baseEvent,
                eventId: (0, crypto_1.randomUUID)(),
                eventType: audit_types_1.AuditEventType.STORE_ACCESS_EVALUATED,
                userId,
                snapshotBalance: decision.availableBalance,
                decision: decision.status,
                denialReason: decision.denialReason,
                evaluatedAt: decision.evaluatedAt
            };
            // Validate and Log (Simulated)
            (0, audit_types_1.validateAuditEvent)(auditEvent);
            events.push(auditEvent);
            return { decision, events };
        }
        catch (error) {
            // Handle known Access Errors
            if (error instanceof store_access_guards_1.StoreAccessError) {
                // 3b. Audit Event (Denied)
                const baseEvent = (0, audit_types_1.createBaseAuditEvent)(audit_types_1.AuditEventType.STORE_ACCESS_DENIED, userId, 'HUMAN');
                const auditEvent = {
                    ...baseEvent,
                    eventId: (0, crypto_1.randomUUID)(),
                    eventType: audit_types_1.AuditEventType.STORE_ACCESS_DENIED,
                    userId,
                    denialReason: error.reason,
                    attemptTimestamp: timestamp
                };
                (0, audit_types_1.validateAuditEvent)(auditEvent);
                events.push(auditEvent);
                const decision = {
                    status: economy_enums_1.StoreEligibilityStatus.INELIGIBLE,
                    denialReason: error.reason,
                    availableBalance: 0,
                    evaluatedAt: timestamp
                };
                return { decision, events };
            }
            // Rethrow unexpected errors
            throw error;
        }
    }
}
exports.StoreAccessService = StoreAccessService;
