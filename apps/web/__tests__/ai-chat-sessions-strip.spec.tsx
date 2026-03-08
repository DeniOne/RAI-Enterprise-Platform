import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { AiChatSessionsStrip } from '@/components/ai-chat/AiChatSessionsStrip';
import { useAiChatStore } from '@/lib/stores/ai-chat-store';

describe('AiChatSessionsStrip', () => {
    beforeEach(() => {
        useAiChatStore.setState({
            activeSessionId: 'chat-1',
            sessions: [
                {
                    sessionId: 'chat-1',
                    title: 'Покажи KPI',
                    updatedAt: '2026-03-07T10:00:00.000Z',
                    threadId: 'thread-1',
                    messages: [
                        {
                            id: 'msg-1',
                            role: 'user',
                            content: 'Покажи KPI',
                            timestamp: '2026-03-07T10:00:00.000Z',
                        },
                    ],
                    signals: [],
                    workWindows: [],
                    activeWindowId: null,
                    collapsedWindowIds: [],
                    pendingClarification: null,
                },
                {
                    sessionId: 'chat-2',
                    title: 'Новый чат',
                    updatedAt: '2026-03-07T11:00:00.000Z',
                    threadId: null,
                    messages: [],
                    signals: [],
                    workWindows: [],
                    activeWindowId: null,
                    collapsedWindowIds: [],
                    pendingClarification: null,
                },
            ],
        });
    });

    it('renders session history and new chat control', () => {
        render(<AiChatSessionsStrip />);

        expect(screen.getByText('История')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Новый чат' })).toBeInTheDocument();
        expect(screen.queryByText('Покажи KPI')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Показать историю чатов' }));

        expect(screen.getAllByText('Покажи KPI').length).toBeGreaterThan(0);
    });

    it('starts a new chat and opens another session', () => {
        const newChatSpy = jest.spyOn(useAiChatStore.getState(), 'startNewChat');
        const openSpy = jest.spyOn(useAiChatStore.getState(), 'openChatSession');

        render(<AiChatSessionsStrip />);

        fireEvent.click(screen.getByRole('button', { name: 'Показать историю чатов' }));
        fireEvent.click(screen.getAllByText('Покажи KPI')[0].closest('button')!);
        fireEvent.click(screen.getByRole('button', { name: 'Новый чат' }));

        expect(openSpy).toHaveBeenCalledWith('chat-1');
        expect(newChatSpy).toHaveBeenCalled();
    });
});
