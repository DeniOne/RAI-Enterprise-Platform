import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { RelatedSignalsWindow } from '@/components/ai-chat/RelatedSignalsWindow';

describe('RelatedSignalsWindow', () => {
    it('renders signal items and actions', () => {
        const onAction = jest.fn();

        render(
            <RelatedSignalsWindow
                window={{
                    windowId: 'win-signals',
                    originMessageId: null,
                    agentRole: 'knowledge',
                    type: 'related_signals',
                    category: 'signals',
                    priority: 45,
                    mode: 'inline',
                    title: 'Ключевые сигналы',
                    status: 'informational',
                    payload: {
                        intentId: 'compute_plan_fact',
                        summary: 'Короткий обзор.',
                        missingKeys: [],
                        signalItems: [
                            {
                                id: 'sig-1',
                                tone: 'critical',
                                text: 'Есть критическое отклонение',
                            },
                        ],
                    },
                    actions: [
                        {
                            id: 'focus-parent',
                            kind: 'focus_window',
                            label: 'Открыть основное окно',
                            enabled: true,
                            targetWindowId: 'win-main',
                        },
                    ],
                    isPinned: false,
                }}
                onAction={onAction}
                onCollapse={() => {}}
                onClose={() => {}}
            />,
        );

        expect(screen.getByText('Ключевые сигналы')).toBeInTheDocument();
        expect(screen.getByText('Есть критическое отклонение')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Открыть основное окно' }));

        expect(onAction).toHaveBeenCalled();
    });
});
