import { create } from 'zustand';
import { WorkspaceContext, WorkspaceEntityRef, SelectedRowSummary } from '@/shared/contracts/workspace-context';

interface WorkspaceContextStore {
    context: WorkspaceContext;

    // Actions
    setRoute: (route: string) => void;
    setRouteAndReset: (route: string) => void;
    setActiveEntityRefs: (refs: WorkspaceEntityRef[]) => void;
    setFilters: (filters: Record<string, string | number | boolean | null>) => void;
    setSelectedRowSummary: (summary: SelectedRowSummary | undefined) => void;
    setLastUserAction: (action: string) => void;

    /**
     * Сброс всех полей, кроме роута.
     * Вызывается при навигации, чтобы "страничные" данные не висели на новой странице.
     */
    resetPageContext: () => void;
}

const INITIAL_CONTEXT: WorkspaceContext = {
    route: '/',
};

export const useWorkspaceContextStore = create<WorkspaceContextStore>((set) => ({
    context: INITIAL_CONTEXT,

    setRoute: (route) => set((state) => ({
        context: { ...state.context, route }
    })),

    setRouteAndReset: (route) => set(() => ({
        context: { route }
    })),

    setActiveEntityRefs: (refs) => set((state) => ({
        context: { ...state.context, activeEntityRefs: refs }
    })),

    setFilters: (filters) => set((state) => ({
        context: { ...state.context, filters }
    })),

    setSelectedRowSummary: (summary) => set((state) => ({
        context: { ...state.context, selectedRowSummary: summary }
    })),

    setLastUserAction: (action) => set((state) => ({
        context: { ...state.context, lastUserAction: action }
    })),

    resetPageContext: () => set((state) => ({
        context: { route: state.context.route }
    })),
}));
