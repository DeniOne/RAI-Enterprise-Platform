'use client';

import React from 'react';
import { AlertTriangle, ListTodo } from 'lucide-react';
import { RaiChatWidget, RaiChatWidgetType } from '@/lib/ai-chat-widgets';

interface AiChatWidgetsRailProps {
    widgets: RaiChatWidget[];
}

function UnknownWidgetCard({ type }: { type: string }) {
    return (
        <div className="rounded-2xl border border-black/10 bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-900">Неизвестный виджет</p>
            <p className="mt-1 text-xs text-gray-500">Тип `{type}` пока не поддерживается renderer.</p>
        </div>
    );
}

export function AiChatWidgetsRail({ widgets }: AiChatWidgetsRailProps) {
    return (
        <aside className="w-[280px] shrink-0 border-l border-black/5 bg-gray-50/60 p-4">
            <div className="mb-4">
                <p className="text-sm font-medium text-gray-900">Операционные виджеты</p>
                <p className="mt-1 text-xs text-gray-500">Структурный вывод агента по канонической схеме.</p>
            </div>

            <div className="space-y-3">
                {widgets.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-black/10 bg-white p-4">
                        <p className="text-sm font-medium text-gray-900">Виджеты появятся после ответа</p>
                        <p className="mt-1 text-xs text-gray-500">Пока агент не вернул структурные блоки.</p>
                    </div>
                )}

                {widgets.map((widget, index) => {
                    if (widget.type === RaiChatWidgetType.DeviationList) {
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

                    if (widget.type === RaiChatWidgetType.TaskBacklog) {
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

                    return <UnknownWidgetCard key={`${widget.type}-${index}`} type={widget.type} />;
                })}
            </div>
        </aside>
    );
}
