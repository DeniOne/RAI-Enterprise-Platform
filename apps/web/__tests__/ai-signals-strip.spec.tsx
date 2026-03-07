import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { AiSignalsStrip } from '@/components/ai-chat/AiSignalsStrip';
import { useAiChatStore } from '@/lib/stores/ai-chat-store';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: pushMock,
    }),
}));

describe('AiSignalsStrip', () => {
    beforeEach(() => {
        pushMock.mockReset();
        useAiChatStore.setState({
            signals: [
                {
                    id: 'signal-1',
                    tone: 'warning',
                    text: 'Открыть окно результата',
                    targetWindowId: 'win-1',
                },
                {
                    id: 'signal-2',
                    tone: 'info',
                    text: 'Перейти к полю',
                    targetRoute: '/registry/fields/field-1',
                },
            ],
            readSignalIds: [],
        });
    });

    it('renders signals and triggers open/route actions', () => {
        const restoreSpy = jest.spyOn(useAiChatStore.getState(), 'restoreWorkWindow');

        render(<AiSignalsStrip />);

        fireEvent.click(screen.getByRole('button', { name: 'Открыть' }));
        fireEvent.click(screen.getByRole('button', { name: 'Перейти' }));

        expect(restoreSpy).toHaveBeenCalledWith('win-1');
        expect(pushMock).toHaveBeenCalledWith('/registry/fields/field-1');
    });
});
