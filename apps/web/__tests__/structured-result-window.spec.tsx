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

    it('uses compact sizing for short fact answers', () => {
        render(
            <StructuredResultWindow
                window={{
                    windowId: 'win-director',
                    originMessageId: null,
                    agentRole: 'crm_agent',
                    type: 'structured_result',
                    category: 'result',
                    priority: 76,
                    mode: 'panel',
                    title: 'Рабочее пространство аккаунта',
                    status: 'completed',
                    payload: {
                        intentId: 'compute_plan_fact',
                        summary: 'Директор ООО "СЫСОИ" — Евдокушин Петр Михайлович.',
                        missingKeys: [],
                        sections: [
                            {
                                id: 'director-identity',
                                title: 'Директор',
                                items: [{ label: 'ФИО', value: 'Евдокушин Петр Михайлович' }],
                            },
                            {
                                id: 'director-contacts',
                                title: 'Контакты',
                                items: [
                                    { label: 'Телефон', value: '+7 900 123-45-67' },
                                    { label: 'Email', value: 'director@sysoi.ru' },
                                ],
                            },
                        ],
                    },
                    actions: [
                        {
                            id: 'open-party-card',
                            kind: 'open_route',
                            label: 'Открыть карточку контрагента',
                            enabled: true,
                            targetRoute: '/parties/party-1',
                        },
                    ],
                    isPinned: false,
                }}
                onAction={() => {}}
                onCollapse={() => {}}
                onClose={() => {}}
                onSetMode={() => {}}
            />,
        );

        const windowShell = screen.getByTestId('structured-result-window');
        expect(windowShell.className).toContain('inline-flex');
        expect(windowShell.className).toContain('max-w-[min(720px,calc(100vw-32px))]');
        expect(windowShell.className).toContain('max-h-[calc(100vh-72px)]');
        expect(screen.queryByText('ИНН')).not.toBeInTheDocument();
    });
});
