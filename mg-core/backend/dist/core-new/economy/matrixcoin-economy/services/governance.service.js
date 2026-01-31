"use strict";
/**
 * Economy Governance Service
 * Module 08 — MatrixCoin-Economy
 * STEP 4 — POST-ECONOMY GOVERNANCE
 *
 * ⚠️ SERVICE WRAPPER.
 * Guards → Logic → Audit
 * Answers: Is this allowed?
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EconomyGovernanceService = void 0;
const crypto_1 = require("crypto");
const economy_enums_1 = require("../core/economy.enums"); // Note: Result interface might not be in enums, using custom logic result
const governance_guards_1 = require("../guards/governance.guards");
const governance_logic_1 = require("../core/governance.logic");
const audit_types_1 = require("../core/audit.types");
const economy_enums_2 = require("../core/economy.enums");
class EconomyGovernanceService {
    /**
     * Evaluate Governance Rules for a given context
     */
    evaluateGovernance(context) {
        const timestamp = new Date();
        const events = [];
        try {
            // 1. Guards
            (0, governance_guards_1.guardValidContext)(context);
            (0, governance_guards_1.guardKnownDomain)(context);
            (0, governance_guards_1.guardSnapshotIntegrity)(context);
            // 2. Logic
            const decision = (0, governance_logic_1.evaluateEconomyGovernance)(context);
            // 3. Audit (Evaluation Record)
            const evalEvent = {
                ...(0, audit_types_1.createBaseAuditEvent)(audit_types_1.AuditEventType.GOVERNANCE_EVALUATED, 'SYSTEM', 'SYSTEM'),
                eventId: (0, crypto_1.randomUUID)(),
                eventType: audit_types_1.AuditEventType.GOVERNANCE_EVALUATED,
                usageContextId: context.usageContextId,
                userId: context.userId,
                domain: context.domain,
                status: decision.status,
                evaluatedAt: timestamp
            };
            (0, audit_types_1.validateAuditEvent)(evalEvent);
            events.push(evalEvent);
            // 4. Audit (Flags or Violations)
            if (decision.status === economy_enums_1.GovernanceStatus.ALLOWED_WITH_REVIEW) {
                const flagEvent = {
                    ...(0, audit_types_1.createBaseAuditEvent)(audit_types_1.AuditEventType.GOVERNANCE_FLAGGED, 'SYSTEM', 'SYSTEM'),
                    eventId: (0, crypto_1.randomUUID)(),
                    eventType: audit_types_1.AuditEventType.GOVERNANCE_FLAGGED,
                    usageContextId: context.usageContextId,
                    userId: context.userId,
                    domain: context.domain,
                    reviewLevel: decision.reviewLevel,
                    reason: decision.explanation || 'Review Required',
                    flaggedAt: timestamp
                };
                (0, audit_types_1.validateAuditEvent)(flagEvent);
                events.push(flagEvent);
            }
            else if (decision.status === economy_enums_1.GovernanceStatus.DISALLOWED) {
                const violationEvent = {
                    ...(0, audit_types_1.createBaseAuditEvent)(audit_types_1.AuditEventType.GOVERNANCE_VIOLATION, 'SYSTEM', 'SYSTEM'),
                    eventId: (0, crypto_1.randomUUID)(),
                    eventType: audit_types_1.AuditEventType.GOVERNANCE_VIOLATION,
                    usageContextId: context.usageContextId,
                    userId: context.userId,
                    domain: context.domain,
                    violationReason: decision.violationReason || economy_enums_2.GovernanceViolationReason.SYSTEM_INVARIANT_BREACH,
                    restriction: decision.restriction,
                    detectedAt: timestamp
                };
                (0, audit_types_1.validateAuditEvent)(violationEvent);
                events.push(violationEvent);
            }
            return { decision, events };
        }
        catch (error) {
            if (error instanceof governance_guards_1.GovernanceError) {
                // If guard fails, strictly DISALLOW and Log Violation
                const violationEvent = {
                    ...(0, audit_types_1.createBaseAuditEvent)(audit_types_1.AuditEventType.GOVERNANCE_VIOLATION, 'SYSTEM', 'SYSTEM'),
                    eventId: (0, crypto_1.randomUUID)(),
                    eventType: audit_types_1.AuditEventType.GOVERNANCE_VIOLATION,
                    usageContextId: context.usageContextId,
                    userId: context.userId,
                    domain: context.domain,
                    violationReason: error.reason,
                    restriction: economy_enums_2.GovernanceRestriction.BLOCK_OPERATION,
                    detectedAt: timestamp
                };
                (0, audit_types_1.validateAuditEvent)(violationEvent);
                events.push(violationEvent);
                const decision = {
                    status: economy_enums_1.GovernanceStatus.DISALLOWED,
                    restriction: economy_enums_2.GovernanceRestriction.BLOCK_OPERATION,
                    reviewLevel: economy_enums_2.GovernanceReviewLevel.CRITICAL,
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
exports.EconomyGovernanceService = EconomyGovernanceService;
