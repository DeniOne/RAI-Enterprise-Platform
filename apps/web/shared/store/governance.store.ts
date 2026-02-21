import { create } from 'zustand';

/**
 * Отражает структуру процесса кворума из Prisma.
 */
interface QuorumProcess {
    traceId: string;
    level: 'R3' | 'R4';
    description: string;
    status: 'COLLECTING' | 'MET' | 'REJECTED';
    members: Array<{
        userId: string;
        userName: string;
        weight: number;
        signed: boolean;
    }>;
    threshold: number;
}

interface GovernanceState {
    activeEscalation: QuorumProcess | null;
    isQuorumModalOpen: boolean;
    setActiveEscalation: (escalation: QuorumProcess | null) => void;
    setQuorumModalOpen: (open: boolean) => void;
}

/**
 * useGovernanceStore — Глобальное состояние институционального контроля.
 * Используется для синхронизации EscalationBanner, QuorumVisualizer и WorkSurface blocking.
 */
export const useGovernanceStore = create<GovernanceState>((set) => ({
    activeEscalation: null,
    isQuorumModalOpen: false,
    setActiveEscalation: (activeEscalation) => set({ activeEscalation }),
    setQuorumModalOpen: (isQuorumModalOpen) => set({ isQuorumModalOpen }),
}));
