'use client';

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, ChevronUp, ListTodo } from 'lucide-react';
import { useAiChatStore } from '@/lib/stores/ai-chat-store';
import { DeviationListWidget, RaiChatWidget, RaiChatWidgetType, TaskBacklogWidget } from '@/lib/ai-chat-widgets';
import clsx from 'clsx';

function isDeviationListWidget(widget: RaiChatWidget): widget is DeviationListWidget {
    return widget.type === RaiChatWidgetType.DeviationList;
}

function isTaskBacklogWidget(widget: RaiChatWidget): widget is TaskBacklogWidget {
    return widget.type === RaiChatWidgetType.TaskBacklog;
}

function UnknownWidgetCard({ type }: { type: string }) {
    return (
        <div className="rounded-2xl border border-black/10 bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-900">Неизвестный виджет</p>
            <p className="mt-1 text-xs text-gray-500">Тип `{type}` пока не поддерживается renderer.</p>
        </div>
    );
}

export function RaiOutputOverlay() {
    const { messages, widgetsOpen, toggleWidgets, selectedSignalTarget } = useAiChatStore();
    const highlightedRef = useRef<HTMLDivElement | null>(null);

    const latestWidgets = [...messages]
        .reverse()
        .find((message) => message.role === 'assistant' && message.widgets && message.widgets.length > 0)
        ?.widgets ?? [];

    useEffect(() => {
        if (!widgetsOpen || latestWidgets.length === 0 || !selectedSignalTarget) return;
        highlightedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [latestWidgets.length, selectedSignalTarget, widgetsOpen]);

    if (!widgetsOpen || latestWidgets.length === 0) {
        return null;
    }

    return (
        <div className="absolute inset-x-0 top-0 z-30">
            <div className="mx-1 overflow-hidden rounded-[1.75rem] border border-black/10 bg-[rgba(255,255,255,0.98)] shadow-[0_24px_70px_rgba(17,17,17,0.14)] backdrop-blur-md">
                <button
                    type="button"
                    onClick={toggleWidgets}
                    className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white text-neutral-500 shadow-sm transition-colors hover:bg-black/5 hover:text-black"
                    aria-label="Свернуть вывод РАИ"
                    title="Свернуть вывод"
                >
                    <ChevronUp className="h-4 w-4" />
                </button>

                <div className="border-b border-black/10 bg-[#FCFBF8] px-6 py-5 pr-20">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">RAI вывод</div>
                        <h2 className="text-lg font-medium text-gray-950">Структурный вывод агента</h2>
                        <p className="text-sm text-gray-500">Панель раскрывается сверху поверх workspace и сворачивается без потери контекста.</p>
                    </div>
                </div>

                <div className="max-h-[min(68vh,720px)] overflow-y-auto p-6">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {latestWidgets.map((widget, index) => {
                            const widgetSelected = selectedSignalTarget?.widgetType === widget.type;

                            if (isDeviationListWidget(widget)) {
                                return (
                                    <div
                                        key={`${widget.type}-${index}`}
                                        ref={widgetSelected && !selectedSignalTarget?.itemId ? highlightedRef : null}
                                        className={clsx(
                                            'rounded-3xl border bg-white p-5 shadow-sm transition-all duration-500',
                                            widgetSelected && !selectedSignalTarget?.itemId ? 'border-sky-400 ring-2 ring-sky-200 shadow-md scale-[1.02]' : 'border-black/10'
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                                            <p className="text-sm font-medium text-gray-900">{widget.payload.title}</p>
                                        </div>
                                        <div className="mt-4 space-y-2">
                                            {widget.payload.items.map((item) => {
                                                const isItemSelected = selectedSignalTarget?.itemId === item.id;
                                                return (
                                                    <div
                                                        key={item.id}
                                                        ref={isItemSelected ? highlightedRef : null}
                                                        className={clsx(
                                                            'rounded-2xl px-4 py-3 transition-all duration-500',
                                                            isItemSelected
                                                                ? 'bg-sky-50 ring-2 ring-sky-200 border-sky-200 scale-[1.02] shadow-sm'
                                                                : 'bg-gray-50 border border-transparent'
                                                        )}
                                                    >
                                                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            {item.fieldLabel} • severity: {item.severity} • status: {item.status}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            }

                            if (isTaskBacklogWidget(widget)) {
                                return (
                                    <div
                                        key={`${widget.type}-${index}`}
                                        ref={widgetSelected && !selectedSignalTarget?.itemId ? highlightedRef : null}
                                        className={clsx(
                                            'rounded-3xl border bg-white p-5 shadow-sm transition-all duration-500',
                                            widgetSelected && !selectedSignalTarget?.itemId ? 'border-sky-400 ring-2 ring-sky-200 shadow-md scale-[1.02]' : 'border-black/10'
                                        )}
                                    >
                                        <div className="flex items-center gap-2">
                                            <ListTodo className="h-4 w-4 text-blue-600" />
                                            <p className="text-sm font-medium text-gray-900">{widget.payload.title}</p>
                                        </div>
                                        <div className="mt-4 space-y-2">
                                            {widget.payload.items.map((item) => {
                                                const isItemSelected = selectedSignalTarget?.itemId === item.id;
                                                return (
                                                    <div
                                                        key={item.id}
                                                        ref={isItemSelected ? highlightedRef : null}
                                                        className={clsx(
                                                            'rounded-2xl px-4 py-3 transition-all duration-500',
                                                            isItemSelected
                                                                ? 'bg-sky-50 ring-2 ring-sky-200 border-sky-200 scale-[1.02] shadow-sm'
                                                                : 'bg-gray-50 border border-transparent'
                                                        )}
                                                    >
                                                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            {item.ownerLabel} • {item.dueLabel} • {item.status}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            }

                            return <UnknownWidgetCard key={`${widget.type}-${index}`} type={String(widget.type)} />;
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
