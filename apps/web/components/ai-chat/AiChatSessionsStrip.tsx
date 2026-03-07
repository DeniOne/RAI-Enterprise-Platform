'use client';

import React, { useMemo, useState } from 'react';
import { History, Plus } from 'lucide-react';

import { useAiChatStore } from '@/lib/stores/ai-chat-store';

function formatSessionTime(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function AiChatSessionsStrip() {
    const [historyOpen, setHistoryOpen] = useState(false);
    const { sessions, activeSessionId, startNewChat, openChatSession } = useAiChatStore();

    const visibleSessions = useMemo(
        () => sessions.slice(0, 6),
        [sessions],
    );

    return (
        <div className="border-b border-black/5 bg-[#FCFBF8] px-4 py-2">
            <div className="flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={() => setHistoryOpen((current) => !current)}
                    className="inline-flex items-center gap-2 rounded-lg px-1.5 py-1 text-[10px] uppercase tracking-[0.18em] text-neutral-400 transition-colors hover:bg-black/[0.03] hover:text-neutral-700"
                    aria-label={historyOpen ? 'Скрыть историю чатов' : 'Показать историю чатов'}
                >
                    <History className="h-3.5 w-3.5" />
                    История
                </button>
                <button
                    type="button"
                    onClick={startNewChat}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-black/10 bg-white text-neutral-600 transition-colors hover:bg-black/[0.04] hover:text-black"
                    aria-label="Новый чат"
                    title="Новый чат"
                >
                    <Plus className="h-4 w-4" />
                </button>
            </div>

            {historyOpen ? (
                <div className="mt-2 space-y-1.5">
                    {visibleSessions.map((session) => {
                        const active = session.sessionId === activeSessionId;
                        return (
                            <button
                                key={session.sessionId}
                                type="button"
                                onClick={() => openChatSession(session.sessionId)}
                                className={`flex w-full items-start justify-between gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${
                                    active
                                        ? 'border-black/15 bg-white text-gray-950 shadow-sm'
                                        : 'border-black/5 bg-white/70 text-gray-700 hover:bg-white'
                                }`}
                            >
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[13px] font-medium">
                                        {session.title}
                                    </span>
                                    <span className="mt-0.5 block truncate text-[11px] text-gray-400">
                                        {session.messages.length > 0
                                            ? session.messages.at(-1)?.content
                                            : 'Пустой диалог'}
                                    </span>
                                </span>
                                <span className="shrink-0 text-[10px] text-gray-400">
                                    {formatSessionTime(session.updatedAt)}
                                </span>
                            </button>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
}
