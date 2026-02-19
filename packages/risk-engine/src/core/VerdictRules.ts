import { RiskSignal, RiskSeverity, RiskSource } from '@rai/prisma-client';
import { RiskFsmState } from './RiskFsm';

export enum ContractType {
    SEASONAL_OPTIMIZATION = 'SEASONAL_OPTIMIZATION',
    MULTI_YEAR_ADVISORY = 'MULTI_YEAR_ADVISORY',
    MANAGED_REGENERATIVE = 'MANAGED_REGENERATIVE'
}

export class VerdictRules {
    /**
     * Evaluates the target FSM state based on the provided signals and contract level.
     * Pure function: (Signals[], ContractType) -> Proposed State
     */
    static evaluate(signals: RiskSignal[], contractType: ContractType = ContractType.SEASONAL_OPTIMIZATION): RiskFsmState {
        if (!signals || signals.length === 0) {
            return RiskFsmState.CLEAR;
        }

        const hasCriticalRegenerative = signals.some(s => s.severity === RiskSeverity.CRITICAL && s.source === RiskSource.REGENERATIVE);
        const hasCriticalOther = signals.some(s => s.severity === RiskSeverity.CRITICAL && s.source !== RiskSource.REGENERATIVE);
        const hasHighLegal = signals.some(s => s.severity === RiskSeverity.HIGH && s.source === RiskSource.LEGAL);
        const hasHigh = signals.some(s => s.severity === RiskSeverity.HIGH);
        const hasMedium = signals.some(s => s.severity === RiskSeverity.MEDIUM);
        const hasLow = signals.some(s => s.severity === RiskSeverity.LOW);

        // 1. BLOCKED Conditions
        if (hasCriticalOther) return RiskFsmState.BLOCKED; // Universal Block for non-regenerative Critical risks
        if (hasHighLegal) return RiskFsmState.BLOCKED;    // Universal Block for High Legal risks

        if (hasCriticalRegenerative) {
            if (contractType === ContractType.MANAGED_REGENERATIVE) {
                return RiskFsmState.BLOCKED; // R4 results in hard block ONLY in Managed mode
            }
            return RiskFsmState.CRITICAL; // In Advisory/Seasonal, R4 is Restricted but NOT Blocked automatically
        }

        // 2. CRITICAL (Restricted) Conditions
        if (hasHigh) {
            if (contractType === ContractType.SEASONAL_OPTIMIZATION && !hasHighLegal) {
                // In advisory mode, R3 (HIGH) might only trigger ELEVATED unless it's legal
                return RiskFsmState.ELEVATED;
            }
            return RiskFsmState.CRITICAL;
        }

        // 3. ELEVATED (Conditional) Conditions
        if (hasMedium) return RiskFsmState.ELEVATED;

        // 4. OBSERVED (Allowed) Conditions
        if (hasLow) return RiskFsmState.OBSERVED;

        return RiskFsmState.CLEAR;
    }
}
