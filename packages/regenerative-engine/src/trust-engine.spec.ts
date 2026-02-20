import { describe, it, expect } from '@jest/globals';
import { TrustEngine } from './trust-engine';

describe('TrustEngine', () => {
    it('should calculate trust with verified signature and fresh data', () => {
        const score = TrustEngine.calculateTrustScore({
            isSignatureVerified: true,
            sourceReputation: 0.9,
            dataAgeDays: 10
        });
        expect(score).toBe(0.9);
    });

    it('should penalize unverified signature heavily', () => {
        const score = TrustEngine.calculateTrustScore({
            isSignatureVerified: false,
            sourceReputation: 0.9,
            dataAgeDays: 10
        });
        // 0.9 * 0.1 = 0.09 -> Math.max(0.1, 0.09) = 0.1
        expect(score).toBe(0.1);
    });

    it('should penalize staleness over 30 days', () => {
        const score = TrustEngine.calculateTrustScore({
            isSignatureVerified: true,
            sourceReputation: 1.0,
            dataAgeDays: 40 // 10 days extra -> 20% penalty
        });
        // 1.0 * (1 - 0.2) = 0.8
        expect(score).toBe(0.8);
    });

    it('should penalize drift', () => {
        const score = TrustEngine.calculateTrustScore({
            isSignatureVerified: true,
            sourceReputation: 1.0,
            dataAgeDays: 10,
            driftPenalty: 0.5
        });
        // 1.0 * (1 - 0.5) = 0.5
        expect(score).toBe(0.5);
    });
});
