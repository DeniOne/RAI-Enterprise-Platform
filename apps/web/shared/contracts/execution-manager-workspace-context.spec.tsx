import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useWorkspaceContextStore } from '@/lib/stores/workspace-context-store';

jest.mock('next/navigation', () => ({
    useRouter: jest.fn(() => ({
        push: jest.fn(),
    })),
    useSearchParams: jest.fn(() => ({
        get: (key: string) => {
            if (key === 'entity') return 'op-42';
            return null;
        },
    })),
}));

jest.mock('@tanstack/react-query', () => ({
    useQueryClient: jest.fn(() => ({
        invalidateQueries: jest.fn(),
    })),
    useQuery: jest.fn(() => ({
        data: [
            {
                id: 'op-42',
                name: 'Внесение удобрений',
                mapStage: { name: 'Подкормка' },
                executionRecord: { status: 'IN_PROGRESS' },
                resources: [],
                riskLevel: 'R2',
            },
        ],
        isLoading: false,
        error: null,
    })),
    useMutation: jest.fn(),
}));

jest.mock('@/shared/hooks/useGovernanceAction', () => ({
    useGovernanceAction: jest.fn(() => ({
        context: { effects: [], conflicts: [], traceId: 'trace-1', riskLevel: 'R1' },
        state: 'idle',
        isPending: false,
        canExecute: false,
        initiate: jest.fn(),
        execute: jest.fn(),
        detectConflict: jest.fn(),
        resolveConflict: jest.fn(),
    })),
}));

jest.mock('@/core/governance/Providers', () => ({
    useAuthSimulationStore: jest.fn(() => ({
        currentRole: 'MANAGER',
    })),
}));

jest.mock('@/components/governance/TriggeredEffectsPanel', () => ({
    TriggeredEffectsPanel: () => <div data-testid="triggered-effects-panel" />,
}));

jest.mock('@/components/governance/ConflictPanel', () => ({
    ConflictPanel: () => <div data-testid="conflict-panel" />,
}));

jest.mock('../..//app/consulting/execution/components/CompletionModal', () => ({
    CompletionModal: () => null,
}));

jest.mock('../..//app/consulting/execution/components/ExecutionCard', () => ({
    ExecutionCard: ({ operation }: { operation: { id: string; name: string } }) => (
        <div data-testid={`execution-card-${operation.id}`}>{operation.name}</div>
    ),
}));

import ManagerContour from '@/app/consulting/execution/manager/page';

describe('Execution manager workspace context', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useWorkspaceContextStore.setState({
            context: { route: '/consulting/execution/manager' },
        });
    });

    it('publishes focused operational summary into WorkspaceContext', async () => {
        render(<ManagerContour />);

        await waitFor(() => {
            expect(screen.getByTestId('execution-card-op-42')).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(useWorkspaceContextStore.getState().context.activeEntityRefs).toEqual([
                { kind: 'operation', id: 'op-42' },
            ]);
        });

        expect(useWorkspaceContextStore.getState().context.selectedRowSummary).toEqual(
            expect.objectContaining({
                kind: 'operation',
                id: 'op-42',
                title: 'Внесение удобрений',
                subtitle: 'Подкормка',
                status: 'IN_PROGRESS',
            }),
        );
    });
});
