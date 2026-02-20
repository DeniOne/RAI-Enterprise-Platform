import { createMachine, assign } from 'xstate';

/**
 * @file governanceMachine.ts
 * @description Каноническая FSM для протокола Two-Phase Execution.
 * Реализует инварианты детерминированного управления.
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
                    actions: assign(({ event }) => ({
                        operation: event.operation,
                        traceId: event.traceId,
                        riskLevel: event.riskLevel || 'R1',
                    })),
                },
            },
        },
        initiated: {
            on: {
                PROPOSE: {
                    target: 'pending',
                    actions: assign(({ event }) => ({
                        riskLevel: event.riskLevel,
                        reason: event.reason,
                    })),
                },
            },
        },
        pending: {
            on: {
                APPROVE: 'approved',
                REJECT: {
                    target: 'rejected',
                    actions: assign(({ event }) => ({
                        reason: event.reason,
                    })),
                },
            },
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
