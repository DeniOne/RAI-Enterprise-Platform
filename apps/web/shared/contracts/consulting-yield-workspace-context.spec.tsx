import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useWorkspaceContextStore } from '@/lib/stores/workspace-context-store';

jest.mock('@/components/consulting/SystemStatusBar', () => ({
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@/lib/api', () => ({
    api: {
        consulting: {
            plans: jest.fn(),
            yield: {
                save: jest.fn(),
            },
        },
    },
}));

import { api } from '@/lib/api';
import YieldEntryPage from '@/app/consulting/yield/page';

describe('Consulting yield workspace context', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useWorkspaceContextStore.setState({
            context: { route: '/consulting/yield' },
        });
    });

    it('publishes farm and techmap refs for selected plan into WorkspaceContext', async () => {
        (api.consulting.plans as jest.Mock).mockResolvedValue({
            data: [
                {
                    id: 'plan-1',
                    status: 'ACTIVE',
                    optValue: 42.5,
                    account: { name: 'ООО Альфа' },
                    activeTechMap: {
                        id: 'tm-1',
                        crop: 'Пшеница',
                        fieldId: 'field-7',
                        farmId: 'farm-3',
                    },
                },
            ],
        });

        render(<YieldEntryPage />);

        await waitFor(() => {
            expect(screen.getByRole('option', { name: /plan-1/i })).toBeInTheDocument();
        });

        const select = screen.getAllByRole('combobox')[0];
        fireEvent.change(select, { target: { value: 'plan-1' } });

        await waitFor(() => {
            expect(useWorkspaceContextStore.getState().context.activeEntityRefs).toEqual([
                { kind: 'techmap', id: 'tm-1' },
                { kind: 'field', id: 'field-7' },
                { kind: 'farm', id: 'farm-3' },
            ]);
        });

        expect(useWorkspaceContextStore.getState().context.selectedRowSummary).toEqual(
            expect.objectContaining({
                kind: 'yield',
                id: 'plan-1',
                title: 'План уборки plan-1',
                subtitle: 'Пшеница',
            }),
        );
        expect(useWorkspaceContextStore.getState().context.lastUserAction).toBe('select-plan:plan-1');
    });
});
