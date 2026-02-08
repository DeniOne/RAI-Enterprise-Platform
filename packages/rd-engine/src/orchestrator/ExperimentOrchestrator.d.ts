import { PrismaClient, ExperimentState, Experiment, Protocol } from '@rai/prisma-client';
export declare class ExperimentOrchestrator {
    private prisma;
    constructor(prisma: PrismaClient);
    transitionState(experimentId: string, targetState: ExperimentState, actorId: string): Promise<Experiment>;
    private validateTransition;
    approveProtocol(protocolId: string, approvedBy: string): Promise<Protocol>;
}
