import { act } from '@testing-library/react';
import { useWorkspaceContextStore } from '@/lib/stores/workspace-context-store';

describe('WorkspaceContext store lifecycle', () => {
    beforeEach(() => {
        useWorkspaceContextStore.setState({
            context: { route: '/' },
        });
    });

    it('resets page-scoped fields when route changes', () => {
        act(() => {
            useWorkspaceContextStore.getState().setActiveEntityRefs([{ kind: 'contract', id: 'c-1' }]);
            useWorkspaceContextStore.getState().setFilters({ severity: 'warning' });
            useWorkspaceContextStore.getState().setSelectedRowSummary({
                kind: 'contract',
                id: 'c-1',
                title: 'C-001',
                status: 'DRAFT',
            });
            useWorkspaceContextStore.getState().setLastUserAction('open-contract:c-1');
            useWorkspaceContextStore.getState().setRouteAndReset('/consulting/yield');
        });

        expect(useWorkspaceContextStore.getState().context).toEqual({
            route: '/consulting/yield',
        });
    });
});
