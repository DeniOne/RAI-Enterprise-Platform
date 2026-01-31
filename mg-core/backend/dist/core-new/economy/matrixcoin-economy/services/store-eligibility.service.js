"use strict";
/**
 * Store Eligibility Service — Minimal Implementation
 * Module 08 — MatrixCoin-Economy
 * PHASE 0 — STORE (ELIGIBILITY LOGIC)
 *
 * ⚠️ ELIGIBILITY ≠ PURCHASE
 * Этот сервис ТОЛЬКО проверяет доступ к Store, НЕ выполняет транзакции.
 *
 * ⚠️ SERVICE WRAPPER.
 * Guards → Logic → Audit
 * No DB logic (snapshot passed in).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StoreEligibilityService = void 0;
const crypto_1 = require("crypto");
const economy_enums_1 = require("../core/economy.enums");
const store_eligibility_guards_1 = require("../guards/store-eligibility.guards");
const store_eligibility_logic_1 = require("../core/store-eligibility.logic");
const audit_types_1 = require("../core/audit.types");
class StoreEligibilityService {
    /**
     * Evaluates Store Eligibility with full Audit trail
     *
     * ВАЖНО: Этот метод НЕ выполняет покупки, НЕ списывает MC.
     * Только проверяет, может ли пользователь получить доступ к Store.
     */
    evaluateStoreEligibilityService(params) {
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
            (0, store_eligibility_guards_1.guardValidContext)(context);
            (0, store_eligibility_guards_1.guardSystemOperational)(isSystemMaintenance);
            (0, store_eligibility_guards_1.guardUserNotRestricted)(isUserRestricted);
            // 2. Pure Logic Evaluation
            const decision = (0, store_eligibility_logic_1.evaluateStoreEligibility)(context);
            // 3. Audit Event (Evaluated)
            const baseEvent = (0, audit_types_1.createBaseAuditEvent)(audit_types_1.AuditEventType.STORE_ELIGIBILITY_EVALUATED, userId, 'HUMAN' // Assumption: Store eligibility is user-driven
            );
            const auditEvent = {
                ...baseEvent,
                eventId: (0, crypto_1.randomUUID)(),
                eventType: audit_types_1.AuditEventType.STORE_ELIGIBILITY_EVALUATED,
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
            // Handle known Eligibility Errors
            if (error instanceof store_eligibility_guards_1.StoreEligibilityError) {
                // 3b. Audit Event (Denied)
                const baseEvent = (0, audit_types_1.createBaseAuditEvent)(audit_types_1.AuditEventType.STORE_ELIGIBILITY_DENIED, userId, 'HUMAN');
                const auditEvent = {
                    ...baseEvent,
                    eventId: (0, crypto_1.randomUUID)(),
                    eventType: audit_types_1.AuditEventType.STORE_ELIGIBILITY_DENIED,
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
exports.StoreEligibilityService = StoreEligibilityService;
