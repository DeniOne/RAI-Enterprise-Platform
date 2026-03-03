'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, BellDot, ChevronLeft, ChevronRight, Eye, ExternalLink, Check } from 'lucide-react';
import { AiChatPanel } from './AiChatPanel';
import { useAiChatStore } from '@/lib/stores/ai-chat-store';
import { useWorkspaceContextStore } from '@/lib/stores/workspace-context-store';
import {
    DeviationListWidget,
    RaiChatWidget,
    RaiChatWidgetType,
    TaskBacklogWidget,
} from '@/lib/ai-chat-widgets';

interface SignalItem {
    id: string;
    tone: 'critical' | 'warning' | 'info';
    text: string;
    route?: string;
    target?: { widgetType: RaiChatWidgetType; itemId?: string };
}

function isDeviationListWidget(widget: RaiChatWidget): widget is DeviationListWidget {
    return widget.type === RaiChatWidgetType.DeviationList;
}

function isTaskBacklogWidget(widget: RaiChatWidget): widget is TaskBacklogWidget {
    return widget.type === RaiChatWidgetType.TaskBacklog;
}

export function LeftRaiChatDock() {
    const router = useRouter();
    const currentRoute = useWorkspaceContextStore((state) => state.context.route);
    const {
        fsmState,
        dispatch,
        chatWidth,
        setChatWidth,
        messages,
        toggleWidgets,
        widgetsOpen,
        setWidgetsOpen,
        setSelectedSignalTarget,
        markSignalRead,
        readSignalIds,
    } = useAiChatStore();
    const [isResizing, setIsResizing] = useState(false);

    useEffect(() => {
        if (fsmState === 'closed') {
            dispatch('OPEN');
        }
    }, [dispatch, fsmState]);

    useEffect(() => {
        if (!isResizing) {
            return;
        }

        const handlePointerMove = (event: PointerEvent) => {
            setChatWidth(event.clientX - 24);
        };

        const handlePointerUp = () => {
            setIsResizing(false);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.body.style.cursor = 'ew-resize';
        document.body.style.userSelect = 'none';

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing, setChatWidth]);

    const signalItems = useMemo(() => {
        const assistantSignals: SignalItem[] = [...messages]
            .reverse()
            .filter((message) => message.role === 'assistant')
            .slice(0, 3)
            .flatMap<SignalItem>((message) => {
                const widgets = message.widgets ?? [];
                const results: SignalItem[] = [];

                widgets.forEach((widget) => {
                    if (isDeviationListWidget(widget)) {
                        widget.payload.items.slice(0, 1).forEach((item) => {
                            results.push({
                                id: `${message.id}:${widget.type}:${item.id}`,
                                tone: item.severity === 'high' ? 'critical' : 'warning',
                                text: item.title,
                                route: currentRoute,
                                target: { widgetType: widget.type, itemId: item.id },
                            });
                        });
                    }

                    if (isTaskBacklogWidget(widget)) {
                        widget.payload.items.slice(0, 1).forEach((item) => {
                            results.push({
                                id: `${message.id}:${widget.type}:${item.id}`,
                                tone: item.status === 'in_progress' ? 'warning' : 'info',
                                text: item.title,
                                route: currentRoute,
                                target: { widgetType: widget.type, itemId: item.id },
                            });
                        });
                    }
                });

                if (results.length > 0) {
                    return results;
                }

                return [{
                    id: message.id,
                    tone: message.riskLevel === 'R3' || message.riskLevel === 'R4' ? 'critical' : message.riskLevel === 'R2' ? 'warning' : 'info',
                    text: message.content.replace(/\s+/g, ' ').trim().slice(0, 88),
                    route: currentRoute,
                }] satisfies SignalItem[];
            })
            .slice(0, 3);

        if (assistantSignals.length > 0) {
            return assistantSignals;
        }

        return [
            { id: 'signal-1', tone: 'warning' as const, text: 'Сдвиг сроков в техкарте по активным операциям требует внимания.' },
            { id: 'signal-2', tone: 'info' as const, text: 'РАИ готов показать структурный вывод поверх рабочей области.' },
            { id: 'signal-3', tone: 'critical' as const, text: 'Критические сигналы появятся здесь без потери контекста страницы.' },
        ] satisfies SignalItem[];
    }, [currentRoute, messages]);

    const toneClass: Record<string, string> = {
        critical: 'border-red-200 bg-red-50 text-red-700',
        warning: 'border-amber-200 bg-amber-50 text-amber-700',
        info: 'border-sky-200 bg-sky-50 text-sky-700',
    };

    return (
        <aside className="sticky top-0 shrink-0 self-start" style={{ width: `${chatWidth}px` }} aria-label="RAI Chat Dock">
            <div className="relative flex flex-col gap-3">
                <button
                    type="button"
                    onPointerDown={(event) => {
                        event.preventDefault();
                        setIsResizing(true);
                    }}
                    className="absolute -right-3 top-0 z-20 h-full w-6 cursor-ew-resize"
                    aria-label="Изменить ширину чата"
                    title="Потяните, чтобы изменить ширину"
                >
                    <span className="absolute right-2 top-1/2 h-24 w-[3px] -translate-y-1/2 rounded-full bg-black/10 transition-colors hover:bg-black/25" />
                </button>

                <AiChatPanel variant="shell" />

                <div className="rounded-3xl border border-black/10 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-neutral-400">
                                <BellDot className="h-3.5 w-3.5" />
                                Мини-инбокс
                            </div>
                            <div className="mt-1 text-sm font-medium text-neutral-950">Сигналы РАИ</div>
                        </div>
                        <button
                            type="button"
                            onClick={toggleWidgets}
                            className="inline-flex items-center gap-1 rounded-xl border border-black/10 px-2.5 py-1.5 text-xs text-neutral-600 transition-colors hover:bg-black/[0.04] hover:text-black"
                        >
                            {widgetsOpen ? 'Скрыть вывод' : 'Показать вывод'}
                            {widgetsOpen ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        </button>
                    </div>

                    <div className="space-y-2">
                        {signalItems.map((signal) => (
                            <div
                                key={signal.id}
                                className={`rounded-2xl border px-3 py-2 text-xs transition-colors ${toneClass[signal.tone]} ${readSignalIds.includes(signal.id) ? 'opacity-70' : ''}`}
                            >
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    <span className="flex-1">{signal.text}</span>
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setWidgetsOpen(true);
                                            setSelectedSignalTarget(signal.target ?? null);
                                            markSignalRead(signal.id);
                                        }}
                                        className="inline-flex items-center gap-1 rounded-xl border border-current/20 bg-white/70 px-2 py-1 text-[11px]"
                                    >
                                        <Eye className="h-3 w-3" />
                                        Открыть
                                    </button>
                                    {signal.route ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                router.push(signal.route!);
                                                markSignalRead(signal.id);
                                            }}
                                            className="inline-flex items-center gap-1 rounded-xl border border-current/20 bg-white/70 px-2 py-1 text-[11px]"
                                        >
                                            <ExternalLink className="h-3 w-3" />
                                            Перейти
                                        </button>
                                    ) : null}
                                    <button
                                        type="button"
                                        onClick={() => markSignalRead(signal.id)}
                                        className="inline-flex items-center gap-1 rounded-xl border border-current/20 bg-white/70 px-2 py-1 text-[11px]"
                                    >
                                        <Check className="h-3 w-3" />
                                        Пометить
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );
}
