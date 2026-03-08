'use client';

import React from 'react';
import { AlertTriangle, BellDot, Check, ExternalLink, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useAiChatStore } from '@/lib/stores/ai-chat-store';
import { AiSignalItem } from './ai-work-window-types';

const toneClass: Record<'critical' | 'warning' | 'info', string> = {
    critical: 'border-red-200 bg-red-50 text-red-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    info: 'border-sky-200 bg-sky-50 text-sky-700',
};

export function AiSignalsStrip() {
    const router = useRouter();
    const {
        signals,
        messages,
        workWindows,
        readSignalIds,
        markSignalRead,
        restoreWorkWindow,
    } = useAiChatStore();

    const fallbackSignals: AiSignalItem[] = signals.length > 0
        ? signals
        : (() => {
            const signalWindows = workWindows.filter((window) => window.type === 'related_signals');
            if (signalWindows.length > 0) {
                return signalWindows
                    .flatMap((window) => (window.payload.signalItems ?? []).map((item) => ({
                        ...item,
                        targetWindowId: item.targetWindowId ?? window.parentWindowId ?? window.windowId,
                    })))
                    .slice(0, 3);
            }

            return [...messages]
                .reverse()
                .filter((message) => message.role === 'assistant')
                .slice(0, 3)
                .map((message) => ({
                    id: message.id,
                    tone:
                        message.riskLevel === 'R3' || message.riskLevel === 'R4'
                            ? 'critical'
                            : message.riskLevel === 'R2'
                                ? 'warning'
                                : 'info',
                    text: message.content.replace(/\s+/g, ' ').trim().slice(0, 88),
                }));
        })();

    if (fallbackSignals.length === 0) {
        return null;
    }

    return (
        <div className="border-b border-black/5 bg-[#FCFBF8] px-4 py-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                <BellDot className="h-3.5 w-3.5" />
                Сигналы
            </div>
            <div className="space-y-2">
                {fallbackSignals.slice(0, 3).map((signal) => (
                    <div
                        key={signal.id}
                        className={`rounded-2xl border px-3 py-2 text-xs transition-colors ${toneClass[signal.tone]} ${readSignalIds.includes(signal.id) ? 'opacity-70' : ''}`}
                    >
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span className="flex-1">{signal.text}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                            {signal.targetWindowId ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        restoreWorkWindow(signal.targetWindowId!);
                                        markSignalRead(signal.id);
                                    }}
                                    className="inline-flex items-center gap-1 rounded-xl border border-current/20 bg-white/70 px-2 py-1 text-[11px]"
                                >
                                    <Eye className="h-3 w-3" />
                                    Открыть
                                </button>
                            ) : null}
                            {signal.targetRoute ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        router.push(signal.targetRoute!);
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
                                Скрыть
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
