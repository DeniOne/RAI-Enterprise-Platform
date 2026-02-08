import { RiskSignal, RiskSeverity, RiskSource } from '@rai/prisma-client';
import { RiskFsmState } from './RiskFsm';

export class VerdictRules {
    /**
     * Evaluates the target FSM state based on the provided signals.
     * Pure function: Signals[] -> Proposed State
     */
    static evaluate(signals: RiskSignal[]): RiskFsmState {
        if (!signals || signals.length === 0) {
            return RiskFsmState.CLEAR;
        }

        const hasCritical = signals.some(s => s.severity === RiskSeverity.CRITICAL);
        const hasHighLegal = signals.some(s => s.severity === RiskSeverity.HIGH && s.source === RiskSource.LEGAL);
        const hasHigh = signals.some(s => s.severity === RiskSeverity.HIGH);
        const hasMedium = signals.some(s => s.severity === RiskSeverity.MEDIUM);
        const hasLow = signals.some(s => s.severity === RiskSeverity.LOW);

        // 1. BLOCKED Conditions
        if (hasCritical) return RiskFsmState.BLOCKED;
        if (hasHighLegal) return RiskFsmState.BLOCKED;

        // 2. CRITICAL (Restricted) Conditions
        if (hasHigh) return RiskFsmState.CRITICAL;

        // 3. ELEVATED (Conditional) Conditions
        if (hasMedium) return RiskFsmState.ELEVATED;

        // 4. OBSERVED (Allowed) Conditions
        if (hasLow) return RiskFsmState.OBSERVED;

        return RiskFsmState.CLEAR;
    }
}
