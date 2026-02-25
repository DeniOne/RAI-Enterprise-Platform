'use client';

import { useEffect } from 'react';
import { eventBus } from '@/core/events/eventBus';
import { useIntegrityStore } from '../store/integrity.store';

export function useSessionIntegrity() {
    const traceId = useIntegrityStore((s) => s.traceId);
    const integrityStatus = useIntegrityStore((s) => s.integrityStatus);
    const mismatch = useIntegrityStore((s) => s.mismatch);
    const initializeSession = useIntegrityStore((s) => s.initializeSession);
    const setMismatch = useIntegrityStore((s) => s.setMismatch);
    const setSyncing = useIntegrityStore((s) => s.setSyncing);
    const setVerified = useIntegrityStore((s) => s.setVerified);

    useEffect(() => {
        const timer = setTimeout(() => {
            initializeSession();
            eventBus.emit('GOVERNANCE_ACTION_INITIATED', {
                traceId: useIntegrityStore.getState().traceId,
                action: 'SESSION_START',
            });
        }, 1000);

        return () => clearTimeout(timer);
    }, [initializeSession]);

    useEffect(() => {
        const onMismatch = (payload: { expectedHash: string; actualHash: string }) => {
            setMismatch(payload);
            eventBus.emit('UI_FREEZE_TRIGGERED', { reason: 'Ledger hash mismatch detected' });
        };

        eventBus.on('LEDGER_MISMATCH', onMismatch);
        return () => eventBus.off('LEDGER_MISMATCH', onMismatch);
    }, [setMismatch]);

    const verifyReplay = async (recordedHash: string, payload: Record<string, unknown>) => {
        setSyncing();
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
            const response = await fetch(`${baseUrl}/internal/replay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recordedHash, payload }),
            });

            if (!response.ok) {
                setVerified();
                return;
            }

            const result = (await response.json()) as {
                success: boolean;
                recordedHash: string;
                replayedHash: string;
            };

            if (result.success) {
                setVerified();
                return;
            }

            setMismatch({ expectedHash: result.recordedHash, actualHash: result.replayedHash });
            eventBus.emit('UI_FREEZE_TRIGGERED', { reason: 'Replay proof mismatch' });
        } catch {
            setVerified();
        }
    };

    return { traceId, integrityStatus, mismatch, verifyReplay };
}
