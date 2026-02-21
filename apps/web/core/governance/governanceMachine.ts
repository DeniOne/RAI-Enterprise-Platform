import { createMachine, assign } from 'xstate';

/**
 * @file governanceMachine.ts
 * @description Каноническая FSM для протокола Two-Phase Execution.
 * ОБНОВЛЕНО v2.1.1: Фикс синтаксиса XState v5 для стабильных переходов.
 */

export type RiskLevel = 'R1' | 'R2' | 'R3' | 'R4';

export interface GovernanceContext {
    traceId: string;
    operation: string;
    riskLevel: RiskLevel;
    actor?: string;
    reason?: string;
    error?: string;
}

export type GovernanceEvent =
    | { type: 'START'; operation: string; traceId: string; riskLevel?: RiskLevel }
    | { type: 'PROPOSE'; riskLevel: RiskLevel; reason?: string }
    | { type: 'APPROVE' }
    | { type: 'ESCALATE' }
    | { type: 'QUORUM_MET' }
    | { type: 'REJECT'; reason: string }
    | { type: 'EXECUTE' }
    | { type: 'RETRY' }
    | { type: 'CLOSE' };

export const governanceMachine = createMachine({
    id: 'governance',
    initial: 'idle',
    types: {} as {
        context: GovernanceContext;
        events: GovernanceEvent;
    },
    context: {
        traceId: '',
        operation: '',
        riskLevel: 'R1',
    },
    states: {
        idle: {
            on: {
                START: {
                    target: 'initiated',
                    actions: assign(({ event }) => {
                        if (event.type !== 'START') return {};
                        return {
                            operation: event.operation,
                            traceId: event.traceId,
                            riskLevel: event.riskLevel || 'R1',
                        };
                    }),
                },
            },
        },
        initiated: {
            on: {
                PROPOSE: {
                    target: 'pending',
                    actions: assign(({ event }) => {
                        if (event.type !== 'PROPOSE') return {};
                        return {
                            riskLevel: event.riskLevel,
                            reason: event.reason,
                        };
                    }),
                },
            },
        },
        pending: {
            always: [
                {
                    target: 'escalated',
                    guard: ({ context }) => context.riskLevel === 'R3' || context.riskLevel === 'R4'
                }
            ],
            on: {
                APPROVE: {
                    target: 'approved',
                    guard: ({ context }) => context.riskLevel !== 'R3' && context.riskLevel !== 'R4'
                },
                REJECT: {
                    target: 'rejected',
                    actions: assign(({ event }) => {
                        if (event.type !== 'REJECT') return {};
                        return {
                            reason: event.reason,
                        };
                    }),
                },
            },
        },
        escalated: {
            on: {
                ESCALATE: 'collecting_signatures',
                REJECT: 'rejected'
            }
        },
        collecting_signatures: {
            on: {
                QUORUM_MET: 'quorum_met',
                REJECT: 'rejected'
            }
        },
        quorum_met: {
            on: {
                APPROVE: 'approved',
                REJECT: 'rejected'
            }
        },
        approved: {
            on: {
                EXECUTE: 'executed',
            },
        },
        rejected: {
            on: {
                RETRY: 'initiated',
                CLOSE: 'idle',
            },
        },
        executed: {
            type: 'final',
        },
    },
});
