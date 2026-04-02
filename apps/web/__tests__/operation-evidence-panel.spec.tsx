import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OperationEvidencePanel } from '@/app/consulting/execution/components/OperationEvidencePanel';

jest.mock('qrcode', () => ({
    toString: jest.fn().mockResolvedValue('<svg data-testid="mock-qr"></svg>'),
}));

jest.mock('@/lib/api', () => ({
    api: {
        consulting: {
            execution: {
                evidence: jest.fn().mockResolvedValue({ data: [] }),
                evidenceStatus: jest.fn().mockResolvedValue({
                    data: {
                        isComplete: false,
                        missingEvidenceTypes: ['PHOTO'],
                        presentEvidenceTypes: [],
                    },
                }),
                attachEvidence: jest.fn().mockResolvedValue({ data: {} }),
            },
        },
    },
}));

const ARTIFACT_HISTORY_STORAGE_KEY = 'consulting:execution:artifact-history-by-type';

function renderPanel() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <OperationEvidencePanel operation={{ id: 'op-1', evidence: [] }} />
        </QueryClientProvider>
    );
}

describe('OperationEvidencePanel', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        window.localStorage.clear();
        window.localStorage.setItem(
            ARTIFACT_HISTORY_STORAGE_KEY,
            JSON.stringify({
                PHOTO: [
                    {
                        url: 'https://cdn.example.com/photo-1.jpg',
                        savedAt: '2026-04-01T17:30:00.000Z',
                    },
                ],
            }),
        );
    });

    afterEach(() => {
        jest.clearAllTimers();
        jest.useRealTimers();
    });

    it('поддерживает удаление artifact URL с countdown и undo-восстановлением', async () => {
        const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
        renderPanel();

        expect(await screen.findByText(/Последние artifact URL/i)).toBeInTheDocument();
        expect(screen.getByText('https://cdn.example.com/photo-1.jpg')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: /Удалить URL/i }));

        expect(screen.getByText(/Запись можно восстановить ещё 6 сек/i)).toBeInTheDocument();
        expect(
            JSON.parse(window.localStorage.getItem(ARTIFACT_HISTORY_STORAGE_KEY) || '{}').PHOTO
        ).toBeUndefined();

        act(() => {
            jest.advanceTimersByTime(2200);
        });

        await waitFor(() => {
            expect(screen.getByText(/Запись можно восстановить ещё [34] сек/i)).toBeInTheDocument();
        });

        await user.click(screen.getByRole('button', { name: /Восстановить/i }));

        await waitFor(() => {
            expect(screen.queryByText(/Запись можно восстановить ещё/i)).not.toBeInTheDocument();
        });

        const restored = JSON.parse(window.localStorage.getItem(ARTIFACT_HISTORY_STORAGE_KEY) || '{}');
        expect(restored.PHOTO).toEqual([
            {
                url: 'https://cdn.example.com/photo-1.jpg',
                savedAt: '2026-04-01T17:30:00.000Z',
            },
        ]);
    });
});
