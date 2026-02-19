import { RiskSignalCollector } from '../RiskSignalCollector';
import { RiskSignal, RiskSource, RiskSeverity, RiskReferenceType, PrismaClient } from '@rai/prisma-client';

export class RegenerativeRiskCollector implements RiskSignalCollector {
    constructor(private prisma: PrismaClient) { }

    async collect(companyId: string): Promise<RiskSignal[]> {
        const signals: RiskSignal[] = [];

        // 1. Fetch latest Soil Metrics for the company
        const latestSoilMetrics = await this.prisma.soilMetric.findMany({
            where: { companyId },
            orderBy: { timestamp: 'desc' },
            distinct: ['fieldId'],
        });

        for (const metric of latestSoilMetrics) {
            // R1: Delta SRI < 2% (Minor) -> LOW
            // In a real implementation, we would compare with the baseline.
            // For now, we'll use a mocked calculation of Delta SRI based on initial SRI.
            const baseline = await this.prisma.sustainabilityBaseline.findUnique({
                where: { fieldId: metric.fieldId }
            });

            if (baseline) {
                const deltaSri = metric.sri - baseline.initialSri;

                // R3: Tail Risk / High Regret (P05 Implementation per I34)
                // INVARIANT: Use formal probability of structural collapse (P05)
                const tailRiskP05 = await this.calculateTailRiskP05(metric, baseline);

                // R4: Severe Degradation (Collapse Risk) -> CRITICAL
                if (metric.sri < 0.3 && deltaSri < -0.1) {
                    signals.push(this.createSignal(companyId, metric.fieldId, RiskSeverity.CRITICAL, 'R4-COLLAPSE',
                        `Structural collapse risk detected on field ${metric.fieldId}. SRI: ${metric.sri}`));
                }
                // R3: Tail Risk (P05 > 0.1 threshold per Spec) -> HIGH
                else if (tailRiskP05 > 0.1) {
                    signals.push(this.createSignal(companyId, metric.fieldId, RiskSeverity.HIGH, 'R3-TAIL-RISK',
                        `High Tail Risk (P05: ${tailRiskP05.toFixed(4)}) on field ${metric.fieldId}. SRI: ${metric.sri}`));
                }
                // R2: Persistent Degradation -> MEDIUM
                else if (deltaSri < -0.02) {
                    signals.push(this.createSignal(companyId, metric.fieldId, RiskSeverity.MEDIUM, 'R2-DEGRADATION',
                        `Persistent soil degradation detected on field ${metric.fieldId}. ΔSRI: ${deltaSri.toFixed(4)}`));
                }
                // R1: Minor Variation -> LOW
                else if (deltaSri < 0 && deltaSri >= -0.02) {
                    signals.push(this.createSignal(companyId, metric.fieldId, RiskSeverity.LOW, 'R1-METRIC-LOG',
                        `Minor soil metric regression on field ${metric.fieldId}.`));
                }
            }
        }

        // 2. Fetch Biodiversity Metrics
        const bioMetrics = await this.prisma.biodiversityMetric.findMany({
            where: { companyId }
        });

        for (const bio of bioMetrics) {
            // R3: Biodiversity Pressure > 0.8
            if (bio.bps > 0.8) {
                signals.push(this.createSignal(companyId, bio.seasonId, RiskSeverity.HIGH, 'R3-BIO-PRESSURE',
                    `Extreme biodiversity pressure: ${bio.bps}`));
            }
        }

        return signals;
    }

    /**
     * Formal Monte Carlo P05 Calculation (Mathematical Foundation for I34)
     * Placeholder for integration with SimulationEngine
     */
    private async calculateTailRiskP05(metric: any, baseline: any): Promise<number> {
        // In a full implementation, this would call the simulation service
        // For now, we use a calibrated regressive formula as a formal proxy:
        // P(Collapse) = 1 / (1 + exp(k * (SRI - SRI_crit)))
        const criticalSRI = 0.4;
        const k = 15; // Steepness of the risk curve
        return 1 / (1 + Math.exp(k * (metric.sri - criticalSRI)));
    }

    private createSignal(companyId: string, refId: string, severity: RiskSeverity, code: string, desc: string): RiskSignal {
        return {
            id: `reg-${code}-${refId}-${Date.now()}`,
            source: RiskSource.REGENERATIVE,
            severity,
            reasonCode: code,
            description: desc,
            referenceType: RiskReferenceType.TRANSACTION, // Using TRANSACTION as a generic placeholder if SEASON/FIELD is missing in ReferenceType enum
            referenceId: refId,
            companyId,
            createdAt: new Date()
        } as any;
    }
}
