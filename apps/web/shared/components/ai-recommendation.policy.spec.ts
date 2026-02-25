import { hasForensicAuthority, shouldDisableLedgerVerify, hasExplainabilityPolicyViolation, hasSurfaceContractViolation } from './ai-recommendation.policy';

describe('ai-recommendation policy', () => {
    it('gates forensic access by canSign/canOverride only', () => {
        expect(hasForensicAuthority({ canApprove: false, canEdit: true, canEscalate: true, canOverride: false, canSign: false })).toBe(false);
        expect(hasForensicAuthority({ canApprove: false, canEdit: true, canEscalate: true, canOverride: true, canSign: false })).toBe(true);
        expect(hasForensicAuthority({ canApprove: false, canEdit: true, canEscalate: true, canOverride: false, canSign: true })).toBe(true);
    });

    it('disables verify when trace is pending or missing', () => {
        expect(shouldDisableLedgerVerify('PENDING', 'trace-1')).toBe(true);
        expect(shouldDisableLedgerVerify('AVAILABLE', undefined)).toBe(true);
        expect(shouldDisableLedgerVerify('AVAILABLE', 'trace-1')).toBe(false);
    });

    it('flags AI render without explainability as policy violation', () => {
        expect(hasExplainabilityPolicyViolation(true, false)).toBe(true);
        expect(hasExplainabilityPolicyViolation(true, true)).toBe(false);
        expect(hasExplainabilityPolicyViolation(false, false)).toBe(false);
    });

    it('enforces surface contract: confidence/factors/trace-state', () => {
        expect(hasSurfaceContractViolation(undefined, 'AVAILABLE')).toBe(true);
        expect(hasSurfaceContractViolation({ confidence: 1.2, factors: [{ a: 1 }], verdict: 'OK' }, 'AVAILABLE')).toBe(true);
        expect(hasSurfaceContractViolation({ confidence: 0.7, factors: [], verdict: 'OK' }, 'AVAILABLE')).toBe(true);
        expect(hasSurfaceContractViolation({ confidence: 0.7, factors: [], verdict: 'INSUFFICIENT_EVIDENCE' }, 'AVAILABLE')).toBe(false);
        expect(hasSurfaceContractViolation({ confidence: 0.7, factors: [{ a: 1 }], verdict: 'OK' }, 'PENDING')).toBe(false);
    });
});
