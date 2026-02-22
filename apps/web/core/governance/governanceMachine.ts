import { createMachine, assign } from 'xstate';
import { InstitutionalEffect, InstitutionalConflict } from './InstitutionalContracts';

/**
 * @file governanceMachine.ts
 * @description Каноническая FSM для протокола Two-Phase Execution.
 * ОБНОВЛЕНО v2.2.0: Поддержка Deterministic Impact Engine (Phase 4).
 */

export type RiskLevel = 'R1' | 'R2' | 'R3' | 'R4';

export interface GovernanceContext {
    traceId: string;
    operation: string;
    riskLevel: RiskLevel;
    actor?: string;
    reason?: string;
    error?: string;
    effects: InstitutionalEffect[];
    conflicts: InstitutionalConflict[];
}

export type GovernanceEvent =
    | { type: 'START'; operation: string; traceId: string; riskLevel?: RiskLevel }
    | { type: 'ANALYZE_EFFECTS'; effects: InstitutionalEffect[] }
    | { type: 'DETECT_CONFLICT'; conflicts: InstitutionalConflict[] }
    | { type: 'RESOLVE_CONFLICT'; conflictId: string }
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
        effects: [],
        conflicts: [],
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
                ANALYZE_EFFECTS: {
                    target: 'effect_analysis',
                    actions: assign(({ event }) => {
                        if (event.type !== 'ANALYZE_EFFECTS') return {};
                        return { effects: event.effects };
                    }),
                },
            },
        },
        effect_analysis: {
            // Invariant-4.1: Должен быть хотя бы один эффект
            always: [
                {
                    target: 'conflict_detected',
                    guard: ({ context }) => context.conflicts.length > 0
                },
                {
                    target: 'pending',
                    guard: ({ context }) => context.effects.length > 0 && context.conflicts.length === 0
                },
                {
                    target: 'rejected',
                    guard: ({ context }) => context.effects.length === 0,
                    actions: assign({ error: (_) => 'Invariant-4.1 Violation: No effects produced' })
                }
            ],
            on: {
                DETECT_CONFLICT: {
                    target: 'conflict_detected',
                    actions: assign(({ event }) => {
                        if (event.type !== 'DETECT_CONFLICT') return {};
                        return { conflicts: event.conflicts };
                    }),
                }
            }
        },
        conflict_detected: {
            on: {
                RESOLVE_CONFLICT: {
                    target: 'initiated',
                    actions: assign(({ context, event }) => {
                        if (event.type !== 'RESOLVE_CONFLICT') return {};
                        return {
                            // Очищаем эффекты для принудительного повторного анализа (Invariant-4.3)
                            effects: [],
                            conflicts: context.conflicts.filter(c => c.conflictId !== event.conflictId)
                        };
                    })
                },
                REJECT: 'rejected'
            }
        },
        pending: {
            always: [
                {
                    target: 'escalated',
                    guard: ({ context }) =>
                        context.riskLevel === 'R3' ||
                        context.riskLevel === 'R4' ||
                        context.effects.some(e => e.requiresEscalation)
                }
            ],
            on: {
                APPROVE: {
                    target: 'approved',
                    guard: ({ context }) =>
                        context.riskLevel !== 'R3' &&
                        context.riskLevel !== 'R4' &&
                        !context.effects.some(e => e.requiresEscalation)
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
