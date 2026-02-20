'use client';

import { useMachine } from '@xstate/react';
import { governanceMachine, RiskLevel } from '@/core/governance/governanceMachine';
import { useSessionIntegrity } from './useSessionIntegrity';
import { useAuthority } from '@/core/governance/AuthorityContext';
import { useEffect } from 'react';
import { useUiStore } from '@/core/state/uiStore';

/**
 * @hook useGovernanceAction
 * @description Центральный хук для выполнения любых критических действий через FSM.
 * Гарантирует двухфазное выполнение и привязку к TraceID.
 */
export function useGovernanceAction(operationName: string) {
    const { traceId } = useSessionIntegrity();
    const { canSign } = useAuthority();
    const setGlobalLock = useUiStore((state) => state.setLocked);

    const [state, send] = useMachine(governanceMachine);

    // Синхронизация глобальной блокировки UI при состоянии PENDING
    useEffect(() => {
        if (state.value === 'pending') {
            setGlobalLock(true);
        } else {
            setGlobalLock(false);
        }
    }, [state.value, setGlobalLock]);

    const initiate = (risk: RiskLevel = 'R1') => {
        send({ type: 'START', operation: operationName, traceId, riskLevel: risk });
        // Автоматический переход в PENDING для демонстрации Фазы 2
        setTimeout(() => {
            send({ type: 'PROPOSE', riskLevel: risk, reason: 'System initiated protocol' });
        }, 500);
    };

    const approve = () => {
        if (!canSign) {
            console.error('ACCESS_DENIED: User has no canSign capability');
            return;
        }
        send({ type: 'APPROVE' });
    };

    const execute = () => {
        send({ type: 'EXECUTE' });
    };

    return {
        state: state.value,
        context: state.context,
        canApprove: canSign && state.value === 'pending',
        canExecute: state.value === 'approved',
        initiate,
        approve,
        execute,
        isPending: state.value === 'pending'
    };
}
