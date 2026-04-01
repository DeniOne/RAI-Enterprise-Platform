import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

import { ExternalFrontOfficeThreadClient } from '@/components/front-office/ExternalFrontOfficeThreadClient';
import { externalFrontOfficeApi } from '@/lib/api/front-office';

jest.mock('@/lib/api/front-office', () => ({
    externalFrontOfficeApi: {
        getThreadMessages: jest.fn(),
        markThreadRead: jest.fn(),
        replyToThread: jest.fn(),
        intakeMessage: jest.fn(),
    },
}));

describe('ExternalFrontOfficeThreadClient', () => {
    beforeEach(() => {
        (externalFrontOfficeApi.getThreadMessages as jest.Mock).mockReset();
        (externalFrontOfficeApi.markThreadRead as jest.Mock).mockReset();
        (externalFrontOfficeApi.replyToThread as jest.Mock).mockReset();
        (externalFrontOfficeApi.markThreadRead as jest.Mock).mockResolvedValue({ ok: true });
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    it('polls incremental messages via afterId cursor and renders explainability block', async () => {
        (externalFrontOfficeApi.getThreadMessages as jest.Mock).mockResolvedValue([
            {
                id: 'm-2',
                direction: 'outbound',
                channel: 'web_chat',
                messageText: 'Ответ оператора',
                createdAt: '2026-03-31T10:00:00.000Z',
                deliveryStatus: 'SENT',
                metadata: {
                    explainabilitySummary: 'Ответ подтверждён по рабочему процессу.',
                    evidenceCount: 2,
                },
            },
        ]);

        await act(async () => {
            render(
                <ExternalFrontOfficeThreadClient
                    threadKey="thread-1"
                    initialMessages={[
                        {
                            id: 'm-1',
                            direction: 'inbound',
                            channel: 'web_chat',
                            messageText: 'Входящее сообщение',
                            createdAt: '2026-03-31T09:59:00.000Z',
                        },
                    ]}
                />,
            );
        });

        await waitFor(() => {
            expect(screen.getByText('Ответ оператора')).toBeInTheDocument();
        });

        expect(externalFrontOfficeApi.getThreadMessages).toHaveBeenCalledWith(
            'thread-1',
            undefined,
            {
                afterId: 'm-1',
                limit: 120,
            },
        );
        expect(screen.getByText('доставлено')).toBeInTheDocument();
        expect(screen.getByText('Ответ подтверждён по рабочему процессу.')).toBeInTheDocument();
        expect(screen.getByText('Evidence: 2')).toBeInTheDocument();
    });

    it('uses reply payload delivery fields when API returns top-level metadata', async () => {
        (externalFrontOfficeApi.getThreadMessages as jest.Mock).mockResolvedValue([]);
        (externalFrontOfficeApi.replyToThread as jest.Mock).mockResolvedValue({
            messageId: 'm-out-1',
            channel: 'web_chat',
            createdAt: '2026-03-31T10:01:00.000Z',
            deliveryStatus: 'SKIPPED',
        });

        await act(async () => {
            render(
                <ExternalFrontOfficeThreadClient
                    threadKey="thread-2"
                    initialMessages={[]}
                />,
            );
        });

        await act(async () => {
            fireEvent.change(screen.getByPlaceholderText('Введите сообщение для отправки представителю хозяйства'), {
                target: { value: 'Проверка доставки без Telegram' },
            });
            fireEvent.click(screen.getByText('Отправить'));
        });

        await waitFor(() => {
            expect(screen.getByText('Проверка доставки без Telegram')).toBeInTheDocument();
        });

        expect(externalFrontOfficeApi.replyToThread).toHaveBeenCalledWith(
            'thread-2',
            'Проверка доставки без Telegram',
        );
        expect(await screen.findByText('в thread-store')).toBeInTheDocument();
    });
});
