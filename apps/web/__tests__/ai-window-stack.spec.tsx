import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { AiWindowStack } from '@/components/ai-chat/AiWindowStack';

describe('AiWindowStack', () => {
    it('renders collapsed windows and restores selected one', () => {
        const onRestore = jest.fn();

        render(
            <AiWindowStack
                windows={[
                    {
                        windowId: 'win-1',
                        originMessageId: null,
                        agentRole: 'agronomist',
                        type: 'context_acquisition',
                        parentWindowId: null,
                        relatedWindowIds: [],
                        category: 'clarification',
                        priority: 85,
                        mode: 'panel',
                        title: 'Добор контекста для техкарты',
                        status: 'needs_user_input',
                        payload: {
                            intentId: 'tech_map_draft',
                            summary: 'Нужно собрать контекст.',
                            missingKeys: ['fieldRef'],
                        },
                        actions: [],
                        isPinned: false,
                    },
                ]}
                onRestore={onRestore}
                onClose={() => {}}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: /Открыть окно Добор контекста для техкарты/i }));

        expect(screen.getByText('Нужно действие')).toBeInTheDocument();
        expect(onRestore).toHaveBeenCalledWith('win-1');
    });

    it('shows relation hint for child windows in stack', () => {
        render(
            <AiWindowStack
                windows={[
                    {
                        windowId: 'win-1',
                        originMessageId: null,
                        agentRole: 'agronomist',
                        type: 'context_acquisition',
                        parentWindowId: null,
                        relatedWindowIds: ['win-1-hint'],
                        category: 'clarification',
                        priority: 85,
                        mode: 'panel',
                        title: 'Добор контекста для техкарты',
                        status: 'needs_user_input',
                        payload: {
                            intentId: 'tech_map_draft',
                            summary: 'Нужно собрать контекст.',
                            missingKeys: ['fieldRef'],
                        },
                        actions: [],
                        isPinned: false,
                    },
                    {
                        windowId: 'win-1-hint',
                        originMessageId: null,
                        agentRole: 'agronomist',
                        type: 'context_hint',
                        parentWindowId: 'win-1',
                        relatedWindowIds: ['win-1'],
                        category: 'analysis',
                        priority: 40,
                        mode: 'inline',
                        title: 'Что ещё нужно для техкарты',
                        status: 'needs_user_input',
                        payload: {
                            intentId: 'tech_map_draft',
                            summary: 'Остался один параметр.',
                            missingKeys: ['fieldRef'],
                        },
                        actions: [],
                        isPinned: false,
                    },
                ]}
                onRestore={() => {}}
                onClose={() => {}}
            />,
        );

        expect(screen.getByText(/Подсказка к:/)).toBeInTheDocument();
        expect(screen.getAllByText('Добор контекста для техкарты')).toHaveLength(2);
    });

    it('allows closing a collapsed window from the stack', () => {
        const onClose = jest.fn();

        render(
            <AiWindowStack
                windows={[
                    {
                        windowId: 'win-1',
                        originMessageId: null,
                        agentRole: 'agronomist',
                        type: 'context_acquisition',
                        parentWindowId: null,
                        relatedWindowIds: [],
                        category: 'clarification',
                        priority: 85,
                        mode: 'panel',
                        title: 'Добор контекста для техкарты',
                        status: 'needs_user_input',
                        payload: {
                            intentId: 'tech_map_draft',
                            summary: 'Нужно собрать контекст.',
                            missingKeys: ['fieldRef'],
                        },
                        actions: [],
                        isPinned: false,
                    },
                ]}
                onRestore={() => {}}
                onClose={onClose}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: /Закрыть окно Добор контекста для техкарты/i }));

        expect(onClose).toHaveBeenCalledWith('win-1');
    });
});
