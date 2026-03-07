import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { ComparisonWindow } from '@/components/ai-chat/ComparisonWindow';

describe('ComparisonWindow', () => {
    it('renders comparison table and actions', () => {
        const onAction = jest.fn();

        render(
            <ComparisonWindow
                window={{
                    windowId: 'win-comparison',
                    originMessageId: null,
                    agentRole: 'economist',
                    type: 'comparison',
                    category: 'analysis',
                    priority: 90,
                    mode: 'takeover',
                    title: 'Сравнение сценария',
                    status: 'completed',
                    payload: {
                        intentId: 'compute_plan_fact',
                        summary: 'Сравнение готово.',
                        missingKeys: [],
                        columns: ['Текущий сценарий', 'Комментарий'],
                        rows: [
                            {
                                id: 'roi',
                                label: 'ROI',
                                values: ['12.5%', 'Показатель сценария'],
                                emphasis: 'best',
                            },
                        ],
                    },
                    actions: [
                        {
                            id: 'open-finance',
                            kind: 'open_route',
                            label: 'Перейти к финансам',
                            enabled: true,
                            targetRoute: '/consulting/yield',
                        },
                    ],
                    isPinned: false,
                }}
                onAction={onAction}
                onCollapse={() => {}}
                onClose={() => {}}
            />,
        );

        expect(screen.getByText('Сравнение сценария')).toBeInTheDocument();
        expect(screen.getByText('ROI')).toBeInTheDocument();
        expect(screen.getByText('12.5%')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Перейти к финансам' }));

        expect(onAction).toHaveBeenCalled();
    });
});
