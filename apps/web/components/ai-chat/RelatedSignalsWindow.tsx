'use client';

import React from 'react';
import { AlertTriangle, ChevronsDown, Pin, X } from 'lucide-react';

import { AiWorkWindow, AiWorkWindowAction } from './ai-work-window-types';

interface RelatedSignalsWindowProps {
    window: AiWorkWindow;
    onAction: (action: AiWorkWindowAction) => void;
    onCollapse: () => void;
    onClose: () => void;
    onTogglePin?: () => void;
}

const toneBadgeClass: Record<'critical' | 'warning' | 'info', string> = {
    critical: 'border-red-200 bg-red-50 text-red-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    info: 'border-sky-200 bg-sky-50 text-sky-700',
};

export function RelatedSignalsWindow({
    window,
    onAction,
    onCollapse,
    onClose,
    onTogglePin,
}: RelatedSignalsWindowProps) {
    return (
        <div className="overflow-hidden rounded-[1.5rem] border border-black/10 bg-[rgba(255,255,255,0.98)] shadow-[0_20px_60px_rgba(17,17,17,0.12)] backdrop-blur-md">
            <div className="border-b border-black/10 bg-[#FCFBF8] px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">Сигналы</div>
                        <h2 className="mt-1 text-base font-medium text-gray-950">{window.title}</h2>
                        <p className="mt-1 text-sm text-gray-600">{window.payload.summary}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onTogglePin}
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-black/10 bg-white shadow-sm transition-colors hover:bg-black/[0.03] hover:text-black ${
                                window.isPinned ? 'text-black' : 'text-neutral-500'
                            }`}
                            aria-label={window.isPinned ? 'Открепить окно агента' : 'Закрепить окно агента'}
                            disabled={!onTogglePin}
                        >
                            <Pin className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={onCollapse}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-black/10 bg-white text-neutral-500 shadow-sm transition-colors hover:bg-black/[0.03] hover:text-black"
                            aria-label="Свернуть окно агента"
                        >
                            <ChevronsDown className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-black/10 bg-white text-neutral-500 shadow-sm transition-colors hover:bg-black/[0.03] hover:text-black"
                            aria-label="Закрыть окно агента"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-3 p-5">
                {(window.payload.signalItems ?? []).map((item) => (
                    <div key={item.id} className={`rounded-2xl border px-3 py-3 text-sm ${toneBadgeClass[item.tone]}`}>
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span className="flex-1">{item.text}</span>
                        </div>
                    </div>
                ))}
                {window.actions.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                        {window.actions.map((action) => (
                            <button
                                key={action.id}
                                type="button"
                                onClick={() => onAction(action)}
                                disabled={!action.enabled}
                                className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm text-gray-900 transition-colors hover:bg-black/[0.03] disabled:opacity-50"
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
