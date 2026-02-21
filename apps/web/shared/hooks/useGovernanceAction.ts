'use client';

import { useMachine } from '@xstate/react';
import { governanceMachine, RiskLevel } from '@/core/governance/governanceMachine';
import { useSessionIntegrity } from './useSessionIntegrity';
import { useAuthority } from '@/core/governance/AuthorityContext';
import { useEffect } from 'react';
import { useGovernanceStore } from '../store/governance.store';
import { useUiStore } from '@/core/state/uiStore';

/**
 * @hook useGovernanceAction
 * @description Центральный хук для выполнения любых критических действий через FSM.
 * ОБНОВЛЕНО v2.1.2: Добавлена отладка и фикс таймингов для стабильности переходов.
 */
export function useGovernanceAction(operationName: string) {
    const { traceId } = useSessionIntegrity();
    const { canSign } = useAuthority();

    // UI Stores (Projection Layers)
    const setGlobalLock = useUiStore((state) => state.setLocked);
    const setActiveEscalation = useGovernanceStore((state) => state.setActiveEscalation);

    const [state, send] = useMachine(governanceMachine);

    // ЭФФЕКТ: Синхронизация проекции состояния (Zustand) с источником истины (FSM)
    useEffect(() => {
        const { value, context } = state;
        console.log(`[FSM-DEBUG] State changed to: ${JSON.stringify(value)} | Risk: ${context.riskLevel}`);

        // 1. Управление глобальной блокировкой
        const needsLock = value === 'pending' || value === 'escalated' || value === 'collecting_signatures';
        setGlobalLock(needsLock);

        // 2. Управление баннером эскалации
        if (value === 'escalated' || value === 'collecting_signatures' || value === 'quorum_met') {
            setActiveEscalation({
                traceId: context.traceId || traceId || 'TRC-UNK-0000',
                level: context.riskLevel as 'R3' | 'R4',
                description: `Требуется институциональное подтверждение для: ${operationName}`,
                status: value === 'quorum_met' ? 'MET' : 'COLLECTING',
                threshold: 0.6,
                members: [
                    { userId: 'USR-SEC-01', userName: 'Агроном-инспектор', weight: 40, signed: value === 'quorum_met' },
                    { userId: 'USR-SEC-02', userName: 'Риск-офицер', weight: 40, signed: value === 'quorum_met' },
                    { userId: 'USR-SEC-03', userName: 'Генеральный директор', weight: 20, signed: false },
                ]
            });
        } else if (value === 'idle' || value === 'executed' || value === 'rejected' || value === 'approved') {
            setActiveEscalation(null);
        }

    }, [state.value, state.context, traceId, operationName, setGlobalLock, setActiveEscalation]);

    const initiate = (risk: RiskLevel = 'R1') => {
        const finalTrace = traceId || `TRC-LOG-${Date.now().toString().slice(-4)}`;
        console.log(`[FSM-ACTION] Starting ${operationName} with Trace: ${finalTrace} | Risk: ${risk}`);

        send({ type: 'START', operation: operationName, traceId: finalTrace, riskLevel: risk });

        // Даем машине время на переход в 'initiated' перед отправкой PROPOSE
        setTimeout(() => {
            console.log(`[FSM-ACTION] Proposing state transition...`);
            send({ type: 'PROPOSE', riskLevel: risk, reason: 'System initiated protocol' });
        }, 300);
    };

    const escalate = () => {
        console.log(`[FSM-ACTION] Explicit Escalation Triggered`);
        send({ type: 'ESCALATE' });
    };

    const markQuorumMet = () => {
        console.log(`[FSM-ACTION] Simulating Quorum Met`);
        send({ type: 'QUORUM_MET' });
    };

    const approve = () => {
        if (!canSign) {
            console.warn('[FSM-AUTH] User lack canSign capability');
            return;
        }
        console.log(`[FSM-ACTION] Final Approval Triggered`);
        send({ type: 'APPROVE' });
    };

    const execute = () => {
        console.log(`[FSM-ACTION] Final Execution in Ledger`);
        send({ type: 'EXECUTE' });
    };

    const reject = (reason: string) => {
        console.log(`[FSM-ACTION] Action REJECTED: ${reason}`);
        send({ type: 'REJECT', reason });
    };

    return {
        state: state.value,
        context: state.context,
        canApprove: canSign && (state.value === 'pending' || state.value === 'quorum_met'),
        canExecute: state.value === 'approved',
        canEscalate: state.value === 'escalated',
        initiate,
        escalate,
        markQuorumMet,
        approve,
        execute,
        reject,
        isPending: state.value === 'pending' || state.value === 'collecting_signatures' || state.value === 'escalated'
    };
}
