import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ContextAcquisitionWindow } from '@/components/ai-chat/ContextAcquisitionWindow';

describe('ContextAcquisitionWindow', () => {
    it('renders missing and resolved context items', () => {
        render(
            <ContextAcquisitionWindow
                window={{
                    windowId: 'win-1',
                    originMessageId: null,
                    agentRole: 'agronomist',
                    type: 'context_acquisition',
                    category: 'clarification',
                    priority: 85,
                    mode: 'panel',
                    title: 'Добор контекста для техкарты',
                    status: 'needs_user_input',
                    payload: {
                        intentId: 'tech_map_draft',
                        summary: 'Чтобы подготовить техкарту, нужны поле и сезон.',
                        fieldRef: 'field-42',
                        missingKeys: ['seasonRef'],
                    },
                    actions: [
                        {
                            id: 'use_workspace_field',
                            kind: 'use_workspace_field',
                            label: 'Взять поле из текущего контекста',
                            enabled: true,
                        },
                        {
                            id: 'refresh_context',
                            kind: 'refresh_context',
                            label: 'Обновить контекст',
                            enabled: true,
                        },
                    ],
                    isPinned: false,
                }}
                pendingClarification={{
                    active: true,
                    windowId: 'win-1',
                    agentRole: 'agronomist',
                    intentId: 'tech_map_draft',
                    originalUserMessage: 'Составь техкарту',
                    collectedContext: { fieldRef: 'field-42' },
                    missingKeys: ['seasonRef'],
                    autoResume: true,
                    items: [
                        {
                            key: 'fieldRef',
                            label: 'Поле',
                            required: true,
                            reason: 'Нужно понять, для какого поля готовить техкарту.',
                            sourcePriority: ['workspace'],
                            status: 'resolved',
                            resolvedFrom: 'workspace',
                            value: 'field-42',
                        },
                        {
                            key: 'seasonRef',
                            label: 'Сезон',
                            required: true,
                            reason: 'Нужно понять, для какого сезона готовить техкарту.',
                            sourcePriority: ['workspace'],
                            status: 'missing',
                        },
                    ],
                }}
                sourceMessage="Составь техкарту"
                onAction={() => {}}
                onCollapse={() => {}}
                onClose={() => {}}
                onSetMode={() => {}}
            />,
        );

        expect(screen.getByText('Добор контекста для техкарты')).toBeInTheDocument();
        expect(screen.getByText(/Источник:/)).toBeInTheDocument();
        expect(screen.getByText(/Составь техкарту/)).toBeInTheDocument();
        expect(screen.getByText('Поле')).toBeInTheDocument();
        expect(screen.getByText('Сезон')).toBeInTheDocument();
        expect(screen.getByText(/Найдено:/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Взять поле из текущего контекста' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Обновить контекст' })).toBeInTheDocument();
    });

    it('switches window mode from header controls', () => {
        const onSetMode = jest.fn();

        render(
            <ContextAcquisitionWindow
                window={{
                    windowId: 'win-1',
                    originMessageId: null,
                    agentRole: 'agronomist',
                    type: 'context_acquisition',
                    category: 'clarification',
                    priority: 85,
                    mode: 'panel',
                    title: 'Добор контекста для техкарты',
                    status: 'needs_user_input',
                    payload: {
                        intentId: 'tech_map_draft',
                        summary: 'Чтобы подготовить техкарту, нужны поле и сезон.',
                        missingKeys: ['fieldRef'],
                    },
                    actions: [],
                    isPinned: false,
                }}
                pendingClarification={null}
                sourceMessage={null}
                onAction={() => {}}
                onCollapse={() => {}}
                onClose={() => {}}
                onSetMode={onSetMode}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: 'Фокус' }));

        expect(onSetMode).toHaveBeenCalledWith('takeover');
    });
});
