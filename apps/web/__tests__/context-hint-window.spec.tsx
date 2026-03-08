import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { ContextHintWindow } from '@/components/ai-chat/ContextHintWindow';

describe('ContextHintWindow', () => {
    it('renders compact hint window and triggers actions', () => {
        const onCollapse = jest.fn();
        const onClose = jest.fn();
        const onAction = jest.fn();

        render(
            <ContextHintWindow
                window={{
                    windowId: 'win-1-hint',
                    originMessageId: null,
                    agentRole: 'agronomist',
                    type: 'context_hint',
                    category: 'analysis',
                    priority: 40,
                    mode: 'inline',
                    title: 'Что ещё нужно для техкарты',
                    status: 'needs_user_input',
                    payload: {
                        intentId: 'tech_map_draft',
                        summary: 'Осталось уточнить только один параметр.',
                        fieldRef: 'field-42',
                        missingKeys: ['seasonRef'],
                    },
                    actions: [
                        {
                            id: 'focus_context_acquisition',
                            kind: 'focus_window',
                            label: 'Открыть панель добора',
                            enabled: true,
                            targetWindowId: 'win-1',
                        },
                        {
                            id: 'open_field_card_result',
                            kind: 'open_field_card',
                            label: 'Открыть поле',
                            enabled: true,
                        },
                        {
                            id: 'go_to_techmap_result',
                            kind: 'go_to_techmap',
                            label: 'Перейти к техкартам',
                            enabled: true,
                            targetRoute: '/consulting/techmaps/active',
                        },
                    ],
                    isPinned: false,
                }}
                primaryWindowTitle="Добор контекста для техкарты"
                sourceMessage="Составь техкарту"
                onCollapse={onCollapse}
                onClose={onClose}
                onAction={onAction}
            />,
        );

        expect(screen.getByText('Что ещё нужно для техкарты')).toBeInTheDocument();
        expect(screen.getByText(/Основное окно:/)).toBeInTheDocument();
        expect(screen.getByText(/Источник:/)).toBeInTheDocument();
        expect(screen.getByText('Добор контекста для техкарты')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Открыть панель добора' }));
        fireEvent.click(screen.getByRole('button', { name: 'Открыть поле' }));
        fireEvent.click(screen.getByRole('button', { name: 'Перейти к техкартам' }));
        fireEvent.click(screen.getByRole('button', { name: 'Свернуть окно агента' }));
        fireEvent.click(screen.getByRole('button', { name: 'Закрыть окно агента' }));

        expect(onAction).toHaveBeenCalledTimes(3);
        expect(onCollapse).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
    });
});
