import { create } from 'zustand';

/**
 * Отражает структуру процесса Техсовета из Prisma/legacy quorum service.
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
    quorumDecisionHandler: (() => void) | null;
    setActiveEscalation: (escalation: QuorumProcess | null) => void;
    setQuorumModalOpen: (open: boolean) => void;
    setQuorumDecisionHandler: (handler: (() => void) | null) => void;
    confirmTechCouncilDecision: () => boolean;
}

/**
 * useGovernanceStore — Глобальное состояние Техсовета и эскалации.
 * Используется для синхронизации EscalationBanner, QuorumVisualizer и блокировки WorkSurface.
 */
export const useGovernanceStore = create<GovernanceState>((set, get) => ({
    activeEscalation: null,
    isQuorumModalOpen: false,
    quorumDecisionHandler: null,
    setActiveEscalation: (activeEscalation) => set({ activeEscalation }),
    setQuorumModalOpen: (isQuorumModalOpen) => set({ isQuorumModalOpen }),
    setQuorumDecisionHandler: (quorumDecisionHandler) => set({ quorumDecisionHandler }),
    confirmTechCouncilDecision: () => {
        const handler = get().quorumDecisionHandler;
        if (!handler) return false;
        handler();
        return true;
    },
}));
