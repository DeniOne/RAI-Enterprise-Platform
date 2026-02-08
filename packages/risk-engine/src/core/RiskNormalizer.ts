import { RiskSignal, RiskSeverity } from '@rai/prisma-client';

export class RiskNormalizer {
    /**
     * Normalizes a list of risk signals to ensure they adhere to a consistent severity scale.
     * Can be used to upgrade/downgrade signals based on global policies.
     */
    static normalize(signals: RiskSignal[]): RiskSignal[] {
        return signals.map(signal => {
            // Example Rule: R&D Signals without a conclusion should be at least HIGH?
            // For B6, we assume collectors produce correct severities.
            // This normalizer acts as a safety guard.

            // Example: If description contains "BLOCKER", force CRITICAL
            if (signal.description?.toUpperCase().includes('BLOCKER')) {
                return { ...signal, severity: RiskSeverity.CRITICAL };
            }

            return signal;
        });
    }
}
