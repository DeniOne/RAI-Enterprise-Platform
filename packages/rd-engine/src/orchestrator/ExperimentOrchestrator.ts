import {
    PrismaClient,
    ExperimentState,
    ProtocolStatus,
    Experiment,
    Protocol
} from '@rai/prisma-client';

export class ExperimentOrchestrator {
    constructor(private prisma: PrismaClient) { }

    /**
     * Единственная точка перехода состояний эксперимента.
     * Реализует жесткие бизнес-гарды (Invariants).
     */
    async transitionState(experimentId: string, targetState: ExperimentState, actorId: string): Promise<Experiment> {
        const experiment = await this.prisma.experiment.findUnique({
            where: { id: experimentId },
            include: { protocol: true, trials: { include: { _count: { select: { measurements: true } } } } }
        });

        if (!experiment) {
            throw new Error(`Experiment ${experimentId} not found`);
        }

        // Валидация перехода
        await this.validateTransition(experiment, targetState);

        // Выполнение побочных эффектов перехода
        return await this.prisma.$transaction(async (tx) => {
            // 1. Если переходим в ANALYSIS — блокируем все замеры
            if (targetState === ExperimentState.ANALYSIS) {
                await tx.measurement.updateMany({
                    where: { trial: { experimentId } },
                    data: { locked: true }
                });
            }

            // 2. Обновляем статус
            return await tx.experiment.update({
                where: { id: experimentId },
                data: { state: targetState }
            });
        });
    }

    private async validateTransition(experiment: any, targetState: ExperimentState) {
        const currentState = experiment.state;

        // Прямой переход в тот же стейт — скип
        if (currentState === targetState) return;

        // 🔒 GUARD: RUNNING требует утвержденного протокола
        if (targetState === ExperimentState.RUNNING) {
            if (!experiment.activeProtocolId) {
                throw new Error('Cannot start experiment: No active protocol assigned');
            }

            const protocol = await this.prisma.protocol.findUnique({
                where: { id: experiment.activeProtocolId }
            });

            if (!protocol || protocol.status !== ProtocolStatus.APPROVED) {
                throw new Error('Cannot start experiment: Protocol must be APPROVED');
            }
        }

        // 🔒 GUARD: ANALYSIS требует закрытия всех триалов
        if (targetState === ExperimentState.ANALYSIS) {
            const openTrials = await this.prisma.trial.count({
                where: {
                    experimentId: experiment.id,
                    endDate: null
                }
            });

            if (openTrials > 0) {
                throw new Error(`Cannot start analysis: ${openTrials} trials are still running`);
            }
        }

        // 🔒 GUARD: CONCLUSION_ISSUED требует наличия результата
        if (targetState === ExperimentState.CONCLUSION_ISSUED) {
            const resultExists = await this.prisma.researchResult.findUnique({
                where: { experimentId: experiment.id }
            });

            if (!resultExists) {
                throw new Error('Cannot issue conclusion: Statistical results are missing');
            }
        }
    }

    /**
     * Утверждение протокола (делает его неизменяемым).
     */
    async approveProtocol(protocolId: string, approvedBy: string): Promise<Protocol> {
        const protocol = await this.prisma.protocol.findUnique({ where: { id: protocolId } });

        if (!protocol) throw new Error('Protocol not found');
        if (protocol.status === ProtocolStatus.APPROVED) return protocol;

        return await this.prisma.protocol.update({
            where: { id: protocolId },
            data: {
                status: ProtocolStatus.APPROVED,
                approvedAt: new Date(),
                approvedBy
            }
        });
    }
}
