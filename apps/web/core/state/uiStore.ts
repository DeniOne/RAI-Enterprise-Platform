import { create } from 'zustand';

interface UIState {
    isSidebarOpen: boolean;
    isLocked: boolean;
    activeEscalationsCount: number;
    toggleSidebar: () => void;
    setLocked: (locked: boolean) => void;
    incrementEscalations: () => void;
    decrementEscalations: () => void;
}

export const useUiStore = create<UIState>((set) => ({
    isSidebarOpen: true,
    isLocked: false,
    activeEscalationsCount: 0,
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    setLocked: (locked: boolean) => set({ isLocked: locked }),
    incrementEscalations: () => set((state) => ({ activeEscalationsCount: state.activeEscalationsCount + 1 })),
    decrementEscalations: () => set((state) => ({ activeEscalationsCount: Math.max(0, state.activeEscalationsCount - 1) })),
}));
