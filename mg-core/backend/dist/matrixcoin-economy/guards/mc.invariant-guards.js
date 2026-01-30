"use strict";
/**
 * MC Invariant Guards — Runtime Enforcement
 * Module 08 — MatrixCoin-Economy
 * STEP 2.2 — INVARIANT GUARDS
 *
 * ⚠️ CANONICAL: Based on STEP-2-STATE-LIFECYCLE.md Section 2
 *
 * Guards MUST fail loudly with invariant ID references.
 * NO silent failures allowed.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCInvariantViolation = void 0;
exports.guardMCHasExpiration = guardMCHasExpiration;
exports.guardMCExpirationAfterIssuance = guardMCExpirationAfterIssuance;
exports.guardMCPositiveAmount = guardMCPositiveAmount;
exports.guardMCHasOwner = guardMCHasOwner;
exports.guardMCValidSourceType = guardMCValidSourceType;
exports.guardMCNotTerminal = guardMCNotTerminal;
exports.guardMCNotFrozenForSpend = guardMCNotFrozenForSpend;
exports.guardMCSingleState = guardMCSingleState;
exports.guardMCManualCreation = guardMCManualCreation;
exports.guardMCManualTransition = guardMCManualTransition;
exports.guardMCNoAIOperations = guardMCNoAIOperations;
exports.guardMCNoMonetaryEquivalent = guardMCNoMonetaryEquivalent;
exports.guardMCNoKPICoupling = guardMCNoKPICoupling;
exports.guardSafeDoesNotExtendTTL = guardSafeDoesNotExtendTTL;
exports.guardSplitPreservesMetadata = guardSplitPreservesMetadata;
exports.guardMCStructuralInvariants = guardMCStructuralInvariants;
exports.guardMCCanSpend = guardMCCanSpend;
exports.guardMCCanFreeze = guardMCCanFreeze;
exports.guardMCCanUnfreeze = guardMCCanUnfreeze;
exports.guardMCHumanActor = guardMCHumanActor;
const economy_enums_1 = require("../core/economy.enums");
// ============================================================================
// ERROR TYPES
// ============================================================================
/**
 * Invariant violation error
 * Always includes invariant ID for audit and debugging
 */
class MCInvariantViolation extends Error {
    invariantId;
    code;
    context;
    constructor(invariantId, code, message, context) {
        super(`[${invariantId}] ${message}`);
        this.name = 'MCInvariantViolation';
        this.invariantId = invariantId;
        this.code = code;
        this.context = context;
        // Maintain proper stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, MCInvariantViolation);
        }
    }
}
exports.MCInvariantViolation = MCInvariantViolation;
// ============================================================================
// MC STRUCTURAL INVARIANT GUARDS
// ============================================================================
/**
 * MC-INV-001: Каждый MC обязан иметь expiresAt
 */
function guardMCHasExpiration(mc) {
    if (!mc.expiresAt) {
        throw new MCInvariantViolation('MC-INV-001', 'MISSING_EXPIRATION', 'MC must have expiresAt. MC without expiration is an architectural error.', { mcId: mc.id });
    }
}
/**
 * MC-INV-002: expiresAt > issuedAt
 */
function guardMCExpirationAfterIssuance(mc) {
    if (!mc.expiresAt || !mc.issuedAt) {
        return; // Will be caught by other guards
    }
    if (mc.expiresAt <= mc.issuedAt) {
        throw new MCInvariantViolation('MC-INV-002', 'INVALID_EXPIRATION', `expiresAt must be after issuedAt. Got: expiresAt=${mc.expiresAt.toISOString()}, issuedAt=${mc.issuedAt.toISOString()}`, { mcId: mc.id, expiresAt: mc.expiresAt, issuedAt: mc.issuedAt });
    }
}
/**
 * MC-INV-003: amount > 0
 */
function guardMCPositiveAmount(mc) {
    if (mc.amount === undefined || mc.amount === null) {
        throw new MCInvariantViolation('MC-INV-003', 'MISSING_AMOUNT', 'MC must have amount defined.', { mcId: mc.id });
    }
    if (mc.amount <= 0) {
        throw new MCInvariantViolation('MC-INV-003', 'INVALID_AMOUNT', `MC amount must be positive. Got: ${mc.amount}`, { mcId: mc.id, amount: mc.amount });
    }
}
/**
 * MC-INV-004: userId обязателен и неизменен
 */
function guardMCHasOwner(mc) {
    if (!mc.userId || mc.userId.trim() === '') {
        throw new MCInvariantViolation('MC-INV-004', 'MISSING_OWNER', 'MC must have userId (owner).', { mcId: mc.id });
    }
}
/**
 * MC-INV-005: sourceType ∈ допустимых источников
 */
const ALLOWED_SOURCE_TYPES = new Set([
    'MANUAL_GRANT',
    'EVENT_PARTICIPATION',
    'PEER_TRANSFER',
]);
function guardMCValidSourceType(mc) {
    if (!mc.sourceType) {
        throw new MCInvariantViolation('MC-INV-005', 'MISSING_SOURCE_TYPE', 'MC must have sourceType.', { mcId: mc.id });
    }
    if (!ALLOWED_SOURCE_TYPES.has(mc.sourceType)) {
        throw new MCInvariantViolation('MC-INV-005', 'INVALID_SOURCE_TYPE', `Invalid sourceType: ${mc.sourceType}. Allowed: ${Array.from(ALLOWED_SOURCE_TYPES).join(', ')}`, { mcId: mc.id, sourceType: mc.sourceType });
    }
}
// ============================================================================
// MC LIFECYCLE INVARIANT GUARDS
// ============================================================================
/**
 * MC-INV-010: MC в терминальном состоянии не может изменять состояние
 */
function guardMCNotTerminal(mc, operation) {
    const terminalStates = [economy_enums_1.MCLifecycleState.EXPIRED, economy_enums_1.MCLifecycleState.SPENT];
    if (mc.lifecycleState && terminalStates.includes(mc.lifecycleState)) {
        throw new MCInvariantViolation('MC-INV-010', 'TERMINAL_STATE_VIOLATION', `Cannot perform ${operation} on MC in terminal state: ${mc.lifecycleState}`, { mcId: mc.id, state: mc.lifecycleState, operation });
    }
}
/**
 * MC-INV-011: MC не может перейти из FROZEN в SPENT напрямую
 */
function guardMCNotFrozenForSpend(mc) {
    if (mc.lifecycleState === economy_enums_1.MCLifecycleState.FROZEN) {
        throw new MCInvariantViolation('MC-INV-011', 'FROZEN_SPEND_FORBIDDEN', 'Cannot spend MC from FROZEN state. Unfreeze first.', { mcId: mc.id, state: mc.lifecycleState });
    }
}
/**
 * MC-INV-012: MC не может быть в двух состояниях одновременно
 * (This is enforced by type system, but we add runtime check)
 */
function guardMCSingleState(mc) {
    if (!mc.lifecycleState) {
        throw new MCInvariantViolation('MC-INV-012', 'MISSING_STATE', 'MC must have exactly one lifecycleState.', { mcId: mc.id });
    }
    const validStates = [
        economy_enums_1.MCLifecycleState.ACTIVE,
        economy_enums_1.MCLifecycleState.FROZEN,
        economy_enums_1.MCLifecycleState.EXPIRED,
        economy_enums_1.MCLifecycleState.SPENT,
    ];
    if (!validStates.includes(mc.lifecycleState)) {
        throw new MCInvariantViolation('MC-INV-012', 'INVALID_STATE', `MC has invalid lifecycleState: ${mc.lifecycleState}`, { mcId: mc.id, state: mc.lifecycleState });
    }
}
/**
 * MC-INV-020: MC не создаётся автоматически
 */
function guardMCManualCreation(actorType) {
    if (actorType !== 'HUMAN') {
        throw new MCInvariantViolation('MC-INV-020', 'AUTOMATED_CREATION_FORBIDDEN', `MC cannot be created automatically. Actor type: ${actorType}. Only HUMAN allowed.`, { actorType });
    }
}
/**
 * MC-INV-021: MC не изменяет состояние автоматически
 */
function guardMCManualTransition(actorType) {
    if (actorType !== 'HUMAN') {
        throw new MCInvariantViolation('MC-INV-021', 'AUTOMATED_TRANSITION_FORBIDDEN', `MC state cannot be changed automatically. Actor type: ${actorType}. Only HUMAN allowed.`, { actorType });
    }
}
/**
 * MC-INV-022: AI не может инициировать операции с MC
 */
function guardMCNoAIOperations(actorType) {
    if (actorType === 'AI') {
        throw new MCInvariantViolation('MC-INV-022', 'AI_OPERATION_FORBIDDEN', 'AI cannot initiate MC operations. This is an absolute prohibition.', { actorType });
    }
}
/**
 * MC-INV-023: MC не имеет денежного эквивалента
 * (This is a constraint check, not a runtime guard typically)
 */
function guardMCNoMonetaryEquivalent(monetaryValue) {
    if (monetaryValue !== undefined && monetaryValue !== null) {
        throw new MCInvariantViolation('MC-INV-023', 'MONETARY_EQUIVALENT_FORBIDDEN', 'MC cannot have monetary equivalent. This is an architectural error.', { monetaryValue });
    }
}
/**
 * MC-INV-024: MC не используется для расчёта KPI
 * (Design-time check, enforced via integration boundaries)
 */
function guardMCNoKPICoupling(kpiContext) {
    if (kpiContext) {
        throw new MCInvariantViolation('MC-INV-024', 'KPI_COUPLING_FORBIDDEN', 'MC cannot be used for KPI calculations. This is an integration boundary violation.', { kpiContext });
    }
}
// ============================================================================
// MC SAFE & SPLIT INVARIANT GUARDS
// ============================================================================
/**
 * MC-INV-030: Safe не продлевает expiresAt
 */
function guardSafeDoesNotExtendTTL(originalExpiresAt, newExpiresAt) {
    if (newExpiresAt > originalExpiresAt) {
        throw new MCInvariantViolation('MC-INV-030', 'SAFE_TTL_EXTENSION_FORBIDDEN', `Safe cannot extend MC TTL. Original: ${originalExpiresAt.toISOString()}, Attempted: ${newExpiresAt.toISOString()}`, { originalExpiresAt, newExpiresAt });
    }
}
function guardSplitPreservesMetadata(ctx) {
    if (ctx.newIssuedAt.getTime() !== ctx.originalIssuedAt.getTime()) {
        throw new MCInvariantViolation('MC-INV-031', 'SPLIT_ISSUEDDATE_MISMATCH', `Split must preserve issuedAt. Original: ${ctx.originalIssuedAt.toISOString()}, New: ${ctx.newIssuedAt.toISOString()}`, { ...ctx, originalIssuedAt: ctx.originalIssuedAt.toISOString(), newIssuedAt: ctx.newIssuedAt.toISOString() });
    }
    if (ctx.newSourceType !== ctx.originalSourceType) {
        throw new MCInvariantViolation('MC-INV-031', 'SPLIT_SOURCETYPE_MISMATCH', `Split must preserve sourceType. Original: ${ctx.originalSourceType}, New: ${ctx.newSourceType}`, { originalSourceType: ctx.originalSourceType, newSourceType: ctx.newSourceType });
    }
    if (ctx.newSourceId !== ctx.originalSourceId) {
        throw new MCInvariantViolation('MC-INV-031', 'SPLIT_SOURCEID_MISMATCH', `Split must preserve sourceId. Original: ${ctx.originalSourceId}, New: ${ctx.newSourceId}`, { originalSourceId: ctx.originalSourceId, newSourceId: ctx.newSourceId });
    }
}
// ============================================================================
// COMPOSITE GUARDS
// ============================================================================
/**
 * Validate all structural invariants for MC
 */
function guardMCStructuralInvariants(mc) {
    guardMCHasExpiration(mc);
    guardMCExpirationAfterIssuance(mc);
    guardMCPositiveAmount(mc);
    guardMCHasOwner(mc);
    guardMCValidSourceType(mc);
    guardMCSingleState(mc);
}
/**
 * Validate MC for spend operation
 */
function guardMCCanSpend(mc, now) {
    guardMCStructuralInvariants(mc);
    guardMCNotTerminal(mc, 'SPEND');
    guardMCNotFrozenForSpend(mc);
    // Check expiration
    if (mc.expiresAt && mc.expiresAt <= now) {
        throw new MCInvariantViolation('MC-INV-002', 'MC_EXPIRED', `Cannot spend expired MC. expiresAt: ${mc.expiresAt.toISOString()}, now: ${now.toISOString()}`, { mcId: mc.id, expiresAt: mc.expiresAt, now });
    }
}
/**
 * Validate MC for freeze operation
 */
function guardMCCanFreeze(mc, now) {
    guardMCStructuralInvariants(mc);
    guardMCNotTerminal(mc, 'FREEZE');
    if (mc.lifecycleState !== economy_enums_1.MCLifecycleState.ACTIVE) {
        throw new MCInvariantViolation('MC-INV-011', 'FREEZE_REQUIRES_ACTIVE', `Cannot freeze MC from state: ${mc.lifecycleState}. Only ACTIVE can be frozen.`, { mcId: mc.id, state: mc.lifecycleState });
    }
    // Check expiration
    if (mc.expiresAt && mc.expiresAt <= now) {
        throw new MCInvariantViolation('MC-INV-002', 'CANNOT_FREEZE_EXPIRED', `Cannot freeze expired MC. expiresAt: ${mc.expiresAt.toISOString()}, now: ${now.toISOString()}`, { mcId: mc.id, expiresAt: mc.expiresAt, now });
    }
}
/**
 * Validate MC for unfreeze operation
 */
function guardMCCanUnfreeze(mc, now) {
    guardMCStructuralInvariants(mc);
    guardMCNotTerminal(mc, 'UNFREEZE');
    if (mc.lifecycleState !== economy_enums_1.MCLifecycleState.FROZEN) {
        throw new MCInvariantViolation('MC-INV-011', 'UNFREEZE_REQUIRES_FROZEN', `Cannot unfreeze MC from state: ${mc.lifecycleState}. Only FROZEN can be unfrozen.`, { mcId: mc.id, state: mc.lifecycleState });
    }
    // Check expiration (MC can expire while frozen per MC-INV-030)
    if (mc.expiresAt && mc.expiresAt <= now) {
        throw new MCInvariantViolation('MC-INV-030', 'FROZEN_MC_EXPIRED', `MC expired while frozen. Safe does not protect from expiration. expiresAt: ${mc.expiresAt.toISOString()}`, { mcId: mc.id, expiresAt: mc.expiresAt, now });
    }
}
/**
 * Validate actor for any MC operation
 */
function guardMCHumanActor(actorType) {
    guardMCManualCreation(actorType);
    guardMCManualTransition(actorType);
    guardMCNoAIOperations(actorType);
}
