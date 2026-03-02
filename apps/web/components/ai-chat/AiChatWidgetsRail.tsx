'use client';

import React from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, ListTodo, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { DeviationListWidget, RaiChatWidget, RaiChatWidgetType, TaskBacklogWidget } from '@/lib/ai-chat-widgets';

interface AiChatWidgetsRailProps {
    widgets: RaiChatWidget[];
    isOpen: boolean;
    onToggle: () => void;
}

function UnknownWidgetCard({ type }: { type: string }) {
    return (
        <div className="rounded-2xl border border-black/10 bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-900">Неизвестный виджет</p>
            <p className="mt-1 text-xs text-gray-500">Тип `{type}` пока не поддерживается renderer.</p>
        </div>
    );
}

function isDeviationListWidget(widget: RaiChatWidget): widget is DeviationListWidget {
    return widget.type === RaiChatWidgetType.DeviationList;
}

function isTaskBacklogWidget(widget: RaiChatWidget): widget is TaskBacklogWidget {
    return widget.type === RaiChatWidgetType.TaskBacklog;
}

export function AiChatWidgetsRail({ widgets, isOpen, onToggle }: AiChatWidgetsRailProps) {
    return (
        <aside
            className={`shrink-0 border-l border-black/5 bg-gray-50/60 transition-[width,padding] duration-200 ${
                isOpen ? 'w-[280px] p-4' : 'w-[56px] p-2'
            }`}
        >
            <div className={`mb-4 flex items-start ${isOpen ? 'justify-between gap-3' : 'justify-center'}`}>
                {isOpen ? (
                    <div>
                        <p className="text-sm font-medium text-gray-900">Операционные виджеты</p>
                        <p className="mt-1 text-xs text-gray-500">Структурный вывод агента по канонической схеме.</p>
                    </div>
                ) : null}
                <button
                    type="button"
                    onClick={onToggle}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/10 bg-white text-gray-500 transition-colors hover:bg-black/5 hover:text-gray-900"
                    aria-label={isOpen ? 'Свернуть виджеты' : 'Развернуть виджеты'}
                    title={isOpen ? 'Свернуть виджеты' : 'Развернуть виджеты'}
                >
                    {isOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                </button>
            </div>

            {!isOpen && (
                <div className="flex h-full flex-col items-center justify-center gap-3">
                    <ChevronLeft className="h-4 w-4 text-gray-400" />
                    <span className="rotate-180 text-[10px] font-medium tracking-[0.2em] text-gray-400 [writing-mode:vertical-rl]">
                        WIDGETS
                    </span>
                    {widgets.length > 0 && (
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-gray-700">
                            {widgets.length}
                        </span>
                    )}
                </div>
            )}

            {isOpen && (
                <div className="space-y-3">
                    {widgets.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-black/10 bg-white p-4">
                            <p className="text-sm font-medium text-gray-900">Виджеты появятся после ответа</p>
                            <p className="mt-1 text-xs text-gray-500">Пока агент не вернул структурные блоки.</p>
                        </div>
                    )}

                    {widgets.map((widget, index) => {
                        if (isDeviationListWidget(widget)) {
                            return (
                                <div
                                    key={`${widget.type}-${index}`}
                                    className="rounded-2xl border border-black/10 bg-white p-4"
                                >
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                                        <p className="text-sm font-medium text-gray-900">{widget.payload.title}</p>
                                    </div>
                                    <div className="mt-3 space-y-2">
                                        {widget.payload.items.map((item) => (
                                            <div key={item.id} className="rounded-xl bg-gray-50 px-3 py-2">
                                                <p className="text-xs font-medium text-gray-900">{item.title}</p>
                                                <p className="mt-1 text-[11px] text-gray-500">
                                                    {item.fieldLabel} • severity: {item.severity} • status: {item.status}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        }

                        if (isTaskBacklogWidget(widget)) {
                            return (
                                <div
                                    key={`${widget.type}-${index}`}
                                    className="rounded-2xl border border-black/10 bg-white p-4"
                                >
                                    <div className="flex items-center gap-2">
                                        <ListTodo className="h-4 w-4 text-blue-600" />
                                        <p className="text-sm font-medium text-gray-900">{widget.payload.title}</p>
                                    </div>
                                    <div className="mt-3 space-y-2">
                                        {widget.payload.items.map((item) => (
                                            <div key={item.id} className="rounded-xl bg-gray-50 px-3 py-2">
                                                <p className="text-xs font-medium text-gray-900">{item.title}</p>
                                                <p className="mt-1 text-[11px] text-gray-500">
                                                    {item.ownerLabel} • {item.dueLabel} • {item.status}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        }

                        return <UnknownWidgetCard key={`${widget.type}-${index}`} type={String(widget.type)} />;
                    })}
                </div>
            )}
        </aside>
    );
}
