import React from 'react';
import { render, screen } from '@testing-library/react';
import { AiChatWidgetsRail } from '@/components/ai-chat/AiChatWidgetsRail';
import { RAI_CHAT_WIDGETS_SCHEMA_VERSION, RaiChatWidgetType } from '@/lib/ai-chat-widgets';

describe('AiChatWidgetsRail', () => {
    it('renders DeviationList and TaskBacklog widgets', () => {
        render(
                <AiChatWidgetsRail
                    isOpen={true}
                    onToggle={() => {}}
                    widgets={[
                    {
                        schemaVersion: RAI_CHAT_WIDGETS_SCHEMA_VERSION,
                        type: RaiChatWidgetType.DeviationList,
                        version: 1,
                        payload: {
                            title: 'Критические отклонения',
                            items: [
                                {
                                    id: 'dev-1',
                                    title: 'Отклонение 1',
                                    severity: 'high',
                                    fieldLabel: 'Поле 1',
                                    status: 'open',
                                },
                            ],
                        },
                    },
                    {
                        schemaVersion: RAI_CHAT_WIDGETS_SCHEMA_VERSION,
                        type: RaiChatWidgetType.TaskBacklog,
                        version: 1,
                        payload: {
                            title: 'Бэклог задач на сегодня',
                            items: [
                                {
                                    id: 'task-1',
                                    title: 'Задача 1',
                                    dueLabel: 'Сегодня',
                                    ownerLabel: 'Штаб',
                                    status: 'queued',
                                },
                            ],
                        },
                    },
                ]}
            />,
        );

        expect(screen.getByText('Критические отклонения')).toBeInTheDocument();
        expect(screen.getByText('Бэклог задач на сегодня')).toBeInTheDocument();
        expect(screen.getByText('Отклонение 1')).toBeInTheDocument();
        expect(screen.getByText('Задача 1')).toBeInTheDocument();
    });

    it('renders fallback for unknown widget type without crashing', () => {
        render(
                <AiChatWidgetsRail
                    isOpen={true}
                    onToggle={() => {}}
                    widgets={[
                    {
                        schemaVersion: RAI_CHAT_WIDGETS_SCHEMA_VERSION,
                        type: 'future_widget',
                        version: 1,
                        payload: {},
                    },
                ]}
            />,
        );

        expect(screen.getByText('Неизвестный виджет')).toBeInTheDocument();
        expect(screen.getByText(/future_widget/)).toBeInTheDocument();
    });

    it('collapses rail without losing toggle control', () => {
        render(
            <AiChatWidgetsRail
                isOpen={false}
                onToggle={() => {}}
                widgets={[]}
            />,
        );

        expect(screen.getByLabelText('Развернуть виджеты')).toBeInTheDocument();
        expect(screen.queryByText('Операционные виджеты')).not.toBeInTheDocument();
    });
});
