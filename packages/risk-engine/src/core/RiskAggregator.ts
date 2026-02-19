import { RiskSignal, RiskTargetType, RiskAssessment, PrismaClient } from '@rai/prisma-client';
import { RiskFsm, RiskFsmState } from './RiskFsm';
import { VerdictRules, ContractType } from './VerdictRules';
import { RiskNormalizer } from './RiskNormalizer';
import { RiskSignalCollector } from '../collector/RiskSignalCollector';

export class RiskAggregator {
    constructor(
        private prisma: PrismaClient,
        private collectors: RiskSignalCollector[]
    ) { }

    async assess(
        companyId: string,
        targetType: RiskTargetType,
        targetId: string,
        contractType: ContractType = ContractType.SEASONAL_OPTIMIZATION
    ): Promise<RiskAssessment> {
        // 1. Collect Signals
        const allSignals: RiskSignal[] = [];
        for (const collector of this.collectors) {
            const signals = await collector.collect(companyId);
            allSignals.push(...signals);
        }

        // 2. Normalize
        const normalizedSignals = RiskNormalizer.normalize(allSignals);

        // 3. Determine Proposed State (Stateless)
        const proposedState = VerdictRules.evaluate(normalizedSignals, contractType);

        // 4. Retrieve Current FSM State
        const currentState = await this.getCurrentFsmState(companyId, targetType, targetId);

        // 5. Apply FSM Transition Logic (Stateful)
        const nextState = RiskFsm.transition(currentState, proposedState);

        // 6. Compute Final Verdict
        const verdict = RiskFsm.getVerdict(nextState);

        // 7. Persist Result (State Transition History)
        await this.persistFsmState(companyId, targetType, targetId, nextState, currentState, normalizedSignals);

        // 8. Construct Assessment Object
        return {
            id: 'generated-in-memory', // or DB ID
            targetType,
            targetId,
            verdict,
            explanation: {
                fsmState: nextState,
                previous: currentState,
                signals: normalizedSignals.map(s => ({
                    source: s.source,
                    severity: s.severity,
                    reasonCode: s.reasonCode,
                    description: s.description,
                    refId: s.referenceId
                })),
                since: new Date().toISOString() // TODO: Fetch real 'since' from DB
            },
            companyId,
            company: {} as any, // Mock for type satisfaction
            assessedAt: new Date(),
            score: null
        };
    }

    private async getCurrentFsmState(companyId: string, targetType: RiskTargetType, targetId: string): Promise<RiskFsmState> {
        const lastHistory = await this.prisma.riskStateHistory.findFirst({
            where: { companyId, targetType, targetId },
            orderBy: { createdAt: 'desc' }
        });

        return (lastHistory?.toState as RiskFsmState) || RiskFsmState.CLEAR;
    }

    private async persistFsmState(
        companyId: string,
        targetType: RiskTargetType,
        targetId: string,
        nextState: RiskFsmState,
        previousState: RiskFsmState,
        signals: RiskSignal[]
    ): Promise<void> {
        if (nextState === previousState) return;

        await this.prisma.riskStateHistory.create({
            data: {
                companyId,
                targetType,
                targetId,
                fromState: previousState,
                toState: nextState,
                reason: `System Update: ${signals.length} signals active.`
            }
        });
    }

    /**
     * Records a formal decision result (B6.1 Traceability)
     */
    async recordDecision(
        companyId: string,
        actionType: string,
        targetId: string,
        assessment: RiskAssessment,
        traceId?: string
    ): Promise<void> {
        await this.prisma.decisionRecord.create({
            data: {
                companyId,
                actionType,
                targetId,
                riskVerdict: assessment.verdict,
                riskState: assessment.explanation.fsmState,
                explanation: assessment.explanation as any,
                traceId
            }
        });
    }
}
