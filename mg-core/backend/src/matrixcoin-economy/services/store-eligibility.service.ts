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

import { randomUUID } from 'crypto';
import {
    StoreEligibilityContext,
    StoreEligibilityDecision,
    StoreEligibilityDeniedReason
} from '../core/store.types';
import {
    StoreEligibilityStatus
} from '../core/economy.enums';
import { MCState } from '../core/mc.types';
import {
    guardSystemOperational,
    guardUserNotRestricted,
    guardValidContext,
    StoreEligibilityError
} from '../guards/store-eligibility.guards';
import { evaluateStoreEligibility } from '../core/store-eligibility.logic';
import {
    createBaseAuditEvent,
    validateAuditEvent,
    AuditEventType,
    StoreEligibilityEvaluatedEvent,
    StoreEligibilityDeniedEvent
} from '../core/audit.types';

export interface StoreEligibilityServiceParams {
    readonly userId: string;
    readonly mcSnapshot: readonly MCState[];
    readonly isSystemMaintenance?: boolean;
    readonly isUserRestricted?: boolean;
}

export interface StoreEligibilityServiceResult {
    readonly decision: StoreEligibilityDecision;
    readonly events: any[]; // Typed loosely here to avoid import cycle issues if any, but ideally EconomyAuditEvent[]
}

export class StoreEligibilityService {

    /**
     * Evaluates Store Eligibility with full Audit trail
     * 
     * ВАЖНО: Этот метод НЕ выполняет покупки, НЕ списывает MC.
     * Только проверяет, может ли пользователь получить доступ к Store.
     */
    public evaluateStoreEligibilityService(params: StoreEligibilityServiceParams): StoreEligibilityServiceResult {
        const timestamp = new Date();
        const { userId, mcSnapshot, isSystemMaintenance = false, isUserRestricted = false } = params;

        const context: StoreEligibilityContext = {
            userId,
            mcSnapshot,
            timestamp,
            isSystemMaintenance,
            isUserRestricted
        };

        const events: any[] = [];

        try {
            // 1. Structural/System Guards
            guardValidContext(context);
            guardSystemOperational(isSystemMaintenance);
            guardUserNotRestricted(isUserRestricted);

            // 2. Pure Logic Evaluation
            const decision = evaluateStoreEligibility(context);

            // 3. Audit Event (Evaluated)
            const baseEvent = createBaseAuditEvent(
                AuditEventType.STORE_ELIGIBILITY_EVALUATED,
                userId,
                'HUMAN' // Assumption: Store eligibility is user-driven
            );

            const auditEvent: StoreEligibilityEvaluatedEvent = {
                ...baseEvent,
                eventId: randomUUID(),
                eventType: AuditEventType.STORE_ELIGIBILITY_EVALUATED,
                userId,
                snapshotBalance: decision.availableBalance,
                decision: decision.status,
                denialReason: decision.denialReason,
                evaluatedAt: decision.evaluatedAt
            };

            // Validate and Log (Simulated)
            validateAuditEvent(auditEvent);
            events.push(auditEvent);

            return { decision, events };

        } catch (error) {
            // Handle known Eligibility Errors
            if (error instanceof StoreEligibilityError) {
                // 3b. Audit Event (Denied)
                const baseEvent = createBaseAuditEvent(
                    AuditEventType.STORE_ELIGIBILITY_DENIED,
                    userId,
                    'HUMAN'
                );

                const auditEvent: StoreEligibilityDeniedEvent = {
                    ...baseEvent,
                    eventId: randomUUID(),
                    eventType: AuditEventType.STORE_ELIGIBILITY_DENIED,
                    userId,
                    denialReason: error.reason,
                    attemptTimestamp: timestamp
                };

                validateAuditEvent(auditEvent);
                events.push(auditEvent);

                const decision: StoreEligibilityDecision = {
                    status: StoreEligibilityStatus.INELIGIBLE,
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
