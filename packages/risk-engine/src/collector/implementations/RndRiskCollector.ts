import { RiskSignalCollector } from '../RiskSignalCollector';
import { RiskSignal, RiskSource, RiskSeverity, RiskReferenceType, PrismaClient, ExperimentState } from '@rai/prisma-client';

export class RndRiskCollector implements RiskSignalCollector {
    constructor(private prisma: PrismaClient) { }

    async collect(companyId: string): Promise<RiskSignal[]> {
        const signals: RiskSignal[] = [];

        // 1. Experiments running without conclusion (Long running?)
        // Or simply Experiments active but flagged?
        // User Canon: "experiment without conclusion -> RiskSignal(HIGH)"
        // But active experiments generally don't have conclusions yet.
        // Maybe check for "COMPLETED" state but no Conclusion?
        // Or "ANALYSIS" state too long? 
        // Let's implement: "ANALYSIS" state for > 7 days without conclusion -> HIGH

        // For B6 simplicity, let's just flag Experiments in "ANALYSIS" without conclusion as ELEVATED/HIGH risk of delay.
        const stalledExperiments = await this.prisma.experiment.findMany({
            where: {
                program: { companyId },
                state: ExperimentState.ANALYSIS,
                conclusion: { is: null }
            }
        });

        for (const exp of stalledExperiments) {
            signals.push({
                id: `rnd-${exp.id}`,
                source: RiskSource.RND,
                severity: RiskSeverity.HIGH,
                reasonCode: 'RND-NO-CONCLUSION',
                description: `Experiment ${exp.name} is in analysis but lacks conclusion.`,
                referenceType: RiskReferenceType.EXPERIMENT,
                referenceId: exp.id,
                companyId,
                createdAt: new Date()
            } as any);
        }

        return signals;
    }
}
