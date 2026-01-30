/**
 * Economy Governance Service
 * Module 08 — MatrixCoin-Economy
 * STEP 4 — POST-ECONOMY GOVERNANCE
 * 
 * ⚠️ SERVICE WRAPPER.
 * Guards → Logic → Audit
 * Answers: Is this allowed?
 */

import { randomUUID } from 'crypto';
import {
    EconomyUsageContext,
    GovernanceDecision
} from '../core/governance.types';
import {
    GovernanceStatus
} from '../core/economy.enums'; // Note: Result interface might not be in enums, using custom logic result
import {
    guardValidContext,
    guardKnownDomain,
    guardSnapshotIntegrity,
    GovernanceError
} from '../guards/governance.guards';
import { evaluateEconomyGovernance } from '../core/governance.logic';
import {
    createBaseAuditEvent,
    validateAuditEvent,
    AuditEventType,
    GovernanceEvaluatedEvent,
    GovernanceFlaggedEvent,
    GovernanceViolationEvent
} from '../core/audit.types';
import { GovernanceRestriction, GovernanceReviewLevel, GovernanceViolationReason } from '../core/economy.enums';

export interface GovernanceServiceResult {
    readonly decision: GovernanceDecision;
    readonly events: any[];
}

export class EconomyGovernanceService {

    /**
     * Evaluate Governance Rules for a given context
     */
    public evaluateGovernance(context: EconomyUsageContext): GovernanceServiceResult {
        const timestamp = new Date();
        const events: any[] = [];

        try {
            // 1. Guards
            guardValidContext(context);
            guardKnownDomain(context);
            guardSnapshotIntegrity(context);

            // 2. Logic
            const decision = evaluateEconomyGovernance(context);

            // 3. Audit (Evaluation Record)
            const evalEvent: GovernanceEvaluatedEvent = {
                ...createBaseAuditEvent(AuditEventType.GOVERNANCE_EVALUATED, 'SYSTEM', 'SYSTEM'),
                eventId: randomUUID(),
                eventType: AuditEventType.GOVERNANCE_EVALUATED,
                usageContextId: context.usageContextId,
                userId: context.userId,
                domain: context.domain,
                status: decision.status,
                evaluatedAt: timestamp
            };
            validateAuditEvent(evalEvent);
            events.push(evalEvent);

            // 4. Audit (Flags or Violations)
            if (decision.status === GovernanceStatus.ALLOWED_WITH_REVIEW) {
                const flagEvent: GovernanceFlaggedEvent = {
                    ...createBaseAuditEvent(AuditEventType.GOVERNANCE_FLAGGED, 'SYSTEM', 'SYSTEM'),
                    eventId: randomUUID(),
                    eventType: AuditEventType.GOVERNANCE_FLAGGED,
                    usageContextId: context.usageContextId,
                    userId: context.userId,
                    domain: context.domain,
                    reviewLevel: decision.reviewLevel,
                    reason: decision.explanation || 'Review Required',
                    flaggedAt: timestamp
                };
                validateAuditEvent(flagEvent);
                events.push(flagEvent);

            } else if (decision.status === GovernanceStatus.DISALLOWED) {
                const violationEvent: GovernanceViolationEvent = {
                    ...createBaseAuditEvent(AuditEventType.GOVERNANCE_VIOLATION, 'SYSTEM', 'SYSTEM'),
                    eventId: randomUUID(),
                    eventType: AuditEventType.GOVERNANCE_VIOLATION,
                    usageContextId: context.usageContextId,
                    userId: context.userId,
                    domain: context.domain,
                    violationReason: decision.violationReason || GovernanceViolationReason.SYSTEM_INVARIANT_BREACH,
                    restriction: decision.restriction,
                    detectedAt: timestamp
                };
                validateAuditEvent(violationEvent);
                events.push(violationEvent);
            }

            return { decision, events };

        } catch (error) {
            if (error instanceof GovernanceError) {
                // If guard fails, strictly DISALLOW and Log Violation
                const violationEvent: GovernanceViolationEvent = {
                    ...createBaseAuditEvent(AuditEventType.GOVERNANCE_VIOLATION, 'SYSTEM', 'SYSTEM'),
                    eventId: randomUUID(),
                    eventType: AuditEventType.GOVERNANCE_VIOLATION,
                    usageContextId: context.usageContextId,
                    userId: context.userId,
                    domain: context.domain,
                    violationReason: error.reason,
                    restriction: GovernanceRestriction.BLOCK_OPERATION,
                    detectedAt: timestamp
                };
                validateAuditEvent(violationEvent);
                events.push(violationEvent);

                const decision: GovernanceDecision = {
                    status: GovernanceStatus.DISALLOWED,
                    restriction: GovernanceRestriction.BLOCK_OPERATION,
                    reviewLevel: GovernanceReviewLevel.CRITICAL,
                    violationReason: error.reason,
                    explanation: error.message,
                    evaluatedAt: timestamp
                };

                return { decision, events };
            }
            throw error;
        }
    }
}
