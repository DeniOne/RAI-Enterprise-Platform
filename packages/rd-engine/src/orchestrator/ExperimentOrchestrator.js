"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExperimentOrchestrator = void 0;
const prisma_client_1 = require("@rai/prisma-client");
class ExperimentOrchestrator {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async transitionState(experimentId, targetState, actorId) {
        const experiment = await this.prisma.experiment.findUnique({
            where: { id: experimentId },
            include: { protocol: true, trials: { include: { _count: { select: { measurements: true } } } } }
        });
        if (!experiment) {
            throw new Error(`Experiment ${experimentId} not found`);
        }
        await this.validateTransition(experiment, targetState);
        return await this.prisma.$transaction(async (tx) => {
            if (targetState === prisma_client_1.ExperimentState.ANALYSIS) {
                await tx.measurement.updateMany({
                    where: { trial: { experimentId } },
                    data: { locked: true }
                });
            }
            return await tx.experiment.update({
                where: { id: experimentId },
                data: { state: targetState }
            });
        });
    }
    async validateTransition(experiment, targetState) {
        const currentState = experiment.state;
        if (currentState === targetState)
            return;
        if (targetState === prisma_client_1.ExperimentState.RUNNING) {
            if (!experiment.activeProtocolId) {
                throw new Error('Cannot start experiment: No active protocol assigned');
            }
            const protocol = await this.prisma.protocol.findUnique({
                where: { id: experiment.activeProtocolId }
            });
            if (!protocol || protocol.status !== prisma_client_1.ProtocolStatus.APPROVED) {
                throw new Error('Cannot start experiment: Protocol must be APPROVED');
            }
        }
        if (targetState === prisma_client_1.ExperimentState.ANALYSIS) {
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
        if (targetState === prisma_client_1.ExperimentState.CONCLUSION_ISSUED) {
            const resultExists = await this.prisma.researchResult.findUnique({
                where: { experimentId: experiment.id }
            });
            if (!resultExists) {
                throw new Error('Cannot issue conclusion: Statistical results are missing');
            }
        }
    }
    async approveProtocol(protocolId, approvedBy) {
        const protocol = await this.prisma.protocol.findUnique({ where: { id: protocolId } });
        if (!protocol)
            throw new Error('Protocol not found');
        if (protocol.status === prisma_client_1.ProtocolStatus.APPROVED)
            return protocol;
        return await this.prisma.protocol.update({
            where: { id: protocolId },
            data: {
                status: prisma_client_1.ProtocolStatus.APPROVED,
                approvedAt: new Date(),
                approvedBy
            }
        });
    }
}
exports.ExperimentOrchestrator = ExperimentOrchestrator;
//# sourceMappingURL=ExperimentOrchestrator.js.map