import { create } from 'zustand';

export type IntegrityStatus = 'VERIFIED' | 'MISMATCH' | 'SYNCING';

interface LedgerMismatchPayload {
    expectedHash: string;
    actualHash: string;
}

interface IntegrityState {
    traceId: string;
    integrityStatus: IntegrityStatus;
    mismatch?: LedgerMismatchPayload;
    initializeSession: () => void;
    setVerified: (traceId?: string) => void;
    setMismatch: (payload: LedgerMismatchPayload) => void;
    setSyncing: () => void;
}

const generateTraceId = (): string => `TX-${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

export const useIntegrityStore = create<IntegrityState>((set, get) => ({
    traceId: 'TX-INITIALIZING...',
    integrityStatus: 'SYNCING',
    mismatch: undefined,
    initializeSession: () => {
        const current = get();
        if (current.traceId !== 'TX-INITIALIZING...') return;
        const traceId = generateTraceId();
        set({ traceId, integrityStatus: 'VERIFIED', mismatch: undefined });
    },
    setVerified: (traceId) => set({
        traceId: traceId ?? get().traceId,
        integrityStatus: 'VERIFIED',
        mismatch: undefined,
    }),
    setMismatch: (payload) => set({ integrityStatus: 'MISMATCH', mismatch: payload }),
    setSyncing: () => set({ integrityStatus: 'SYNCING' }),
}));

