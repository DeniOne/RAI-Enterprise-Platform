import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { StructuredResultWindow } from '@/components/ai-chat/StructuredResultWindow';

describe('StructuredResultWindow', () => {
    it('renders sections and actions', () => {
        const onAction = jest.fn();
        const onSetMode = jest.fn();

        render(
            <StructuredResultWindow
                window={{
                    windowId: 'win-structured',
                    originMessageId: null,
                    agentRole: 'knowledge',
                    type: 'structured_result',
                    category: 'result',
                    priority: 55,
                    mode: 'panel',
                    title: 'Структурный вывод',
                    status: 'completed',
                    payload: {
                        intentId: 'compute_plan_fact',
                        summary: 'Сводка готова.',
                        missingKeys: [],
                        sections: [
                            {
                                id: 'section-1',
                                title: 'Итоги',
                                items: [
                                    { label: 'ROI', value: '12.5%' },
                                ],
                            },
                        ],
                    },
                    actions: [
                        {
                            id: 'open-route',
                            kind: 'open_route',
                            label: 'Перейти к финансам',
                            enabled: true,
                            targetRoute: '/consulting/yield',
                        },
                    ],
                    isPinned: false,
                }}
                sourceMessage="Покажи итоги"
                onAction={onAction}
                onCollapse={() => {}}
                onClose={() => {}}
                onSetMode={onSetMode}
            />,
        );

        expect(screen.getByText('Структурный вывод')).toBeInTheDocument();
        expect(screen.getByText('Итоги')).toBeInTheDocument();
        expect(screen.getByText('ROI')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Перейти к финансам' }));
        fireEvent.click(screen.getByRole('button', { name: 'Фокус' }));

        expect(onAction).toHaveBeenCalled();
        expect(onSetMode).toHaveBeenCalledWith('takeover');
    });
});
