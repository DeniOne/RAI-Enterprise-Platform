import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('next/navigation', () => ({
    useSearchParams: jest.fn(),
    useParams: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
    api: {
        exploration: {
            showcase: jest.fn(),
            transitionCase: jest.fn(),
            openWarRoom: jest.fn(),
            appendWarRoomEvent: jest.fn(),
            closeWarRoom: jest.fn(),
        },
    },
}));

import { useParams, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import ExplorationPage from '@/app/(app)/exploration/page';
import ExplorationCasePage from '@/app/(app)/exploration/cases/[id]/page';
import ExplorationWarRoomPage from '@/app/(app)/exploration/war-room/[sessionId]/page';

jest.setTimeout(30000);

describe('Exploration UI flow', () => {
    beforeEach(() => {
        (HTMLElement.prototype as any).scrollIntoView = jest.fn();
        jest.clearAllMocks();
        (useSearchParams as jest.Mock).mockReturnValue({
            get: (key: string) => {
                if (key === 'entity') return 'case-2';
                if (key === 'severity') return 'critical';
                return null;
            },
        });
    });

    it('loads showcase, applies smart focus and renders detail links', async () => {
        (api.exploration.showcase as jest.Mock).mockResolvedValue({
            data: {
                items: [
                    {
                        id: 'case-1',
                        explorationMode: 'SEU',
                        status: 'ACTIVE_EXPLORATION',
                        type: 'IDEA',
                        riskScore: 4,
                        updatedAt: '2026-02-25T10:00:00.000Z',
                        signal: { id: 'signal-1', source: 'INTERNAL', confidenceScore: 80, status: 'RAW' },
                        warRoomSessions: [],
                    },
                    {
                        id: 'case-2',
                        explorationMode: 'CDU',
                        status: 'WAR_ROOM',
                        type: 'PROBLEM',
                        riskScore: 9,
                        updatedAt: '2026-02-25T11:00:00.000Z',
                        signal: { id: 'signal-2', source: 'MARKET', confidenceScore: 90, status: 'TRIAGED' },
                        warRoomSessions: [{ id: 'wr-1', deadline: '2026-02-28T10:00:00.000Z' }],
                    },
                ],
                total: 2,
                page: 1,
                pageSize: 50,
                totalPages: 1,
            },
        });

        render(<ExplorationPage />);

        await waitFor(() => expect(api.exploration.showcase).toHaveBeenCalled());
        const focusedCard = await screen.findByText('case-2');
        expect(focusedCard).toBeInTheDocument();

        expect(screen.getByRole('link', { name: /открыть кейс/i })).toHaveAttribute('href', '/exploration/cases/case-2');
        expect(screen.getByRole('link', { name: /открыть комнату решений/i })).toHaveAttribute('href', '/exploration/war-room/wr-1');
    });

    it('submits transition and opens war room from case page', async () => {
        (useParams as jest.Mock).mockReturnValue({ id: 'case-2' });
        (api.exploration.transitionCase as jest.Mock).mockResolvedValue({ data: { id: 'case-2' } });
        (api.exploration.openWarRoom as jest.Mock).mockResolvedValue({ data: { id: 'wr-9' } });

        render(<ExplorationCasePage />);

        fireEvent.change(screen.getByLabelText(/^Роль$/i), { target: { value: 'SEU_BOARD' } });
        fireEvent.click(screen.getByRole('button', { name: /применить переход/i }));

        await waitFor(() => {
            expect(api.exploration.transitionCase).toHaveBeenCalledWith(
                'case-2',
                expect.objectContaining({ targetStatus: 'IN_TRIAGE', role: 'SEU_BOARD' }),
            );
        });

        fireEvent.change(screen.getByLabelText(/id фасилитатора/i), { target: { value: 'user-f-1' } });
        fireEvent.change(screen.getByLabelText(/id участника/i), { target: { value: 'user-p-1' } });
        fireEvent.change(screen.getByLabelText(/дедлайн \(ISO date-time\)/i), { target: { value: '2026-02-28T12:00' } });
        fireEvent.click(screen.getByRole('button', { name: /открыть комнату решений/i }));

        await waitFor(() => {
            expect(api.exploration.openWarRoom).toHaveBeenCalledWith(
                'case-2',
                expect.objectContaining({
                    facilitatorId: 'user-f-1',
                    participants: [expect.objectContaining({ userId: 'user-p-1' })],
                }),
            );
        });
    });

    it('appends war room event and closes session', async () => {
        (useParams as jest.Mock).mockReturnValue({ sessionId: 'wr-9' });
        (api.exploration.appendWarRoomEvent as jest.Mock).mockResolvedValue({ data: { id: 'evt-1' } });
        (api.exploration.closeWarRoom as jest.Mock).mockResolvedValue({ data: { id: 'wr-9' } });

        render(<ExplorationWarRoomPage />);

        fireEvent.change(screen.getByLabelText(/id участника/i), { target: { value: 'user-p-1' } });
        fireEvent.change(screen.getByLabelText(/хеш подписи/i), { target: { value: 'sig-abc' } });
        fireEvent.change(screen.getByLabelText(/примечание к решению/i), { target: { value: 'Запуск пилота' } });
        fireEvent.click(screen.getByRole('button', { name: /добавить событие/i }));

        await waitFor(() => {
            expect(api.exploration.appendWarRoomEvent).toHaveBeenCalledWith(
                'wr-9',
                expect.objectContaining({ participantId: 'user-p-1', signatureHash: 'sig-abc' }),
            );
        });

        fireEvent.change(screen.getByLabelText(/лог резолюции/i), { target: { value: 'Одобрено с контролями' } });
        fireEvent.click(screen.getByRole('button', { name: /закрыть комнату решений/i }));

        await waitFor(() => {
            expect(api.exploration.closeWarRoom).toHaveBeenCalledWith(
                'wr-9',
                expect.objectContaining({
                    resolutionLog: expect.objectContaining({ summary: 'Одобрено с контролями' }),
                }),
            );
        });
    });
});
