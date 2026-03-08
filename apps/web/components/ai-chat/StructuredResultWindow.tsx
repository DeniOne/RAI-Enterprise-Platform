'use client';

import React from 'react';
import { ChevronsDown, Pin, X } from 'lucide-react';

import { AiWorkWindow, AiWorkWindowAction } from './ai-work-window-types';

interface StructuredResultWindowProps {
    window: AiWorkWindow;
    sourceMessage?: string | null;
    onAction: (action: AiWorkWindowAction) => void;
    onCollapse: () => void;
    onClose: () => void;
    onTogglePin?: () => void;
    onSetMode: (mode: AiWorkWindow['mode']) => void;
}

export function StructuredResultWindow({
    window,
    sourceMessage,
    onAction,
    onCollapse,
    onClose,
    onTogglePin,
    onSetMode,
}: StructuredResultWindowProps) {
    const modeOptions: Array<{ id: AiWorkWindow['mode']; label: string }> = [
        { id: 'inline', label: 'Кратко' },
        { id: 'panel', label: 'Панель' },
        { id: 'takeover', label: 'Фокус' },
    ];

    return (
        <div className="overflow-hidden rounded-[1.75rem] border border-black/10 bg-[rgba(255,255,255,0.98)] shadow-[0_24px_70px_rgba(17,17,17,0.14)] backdrop-blur-md">
            <div className="border-b border-black/10 bg-[#FCFBF8] px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">Результат агента</div>
                        <h2 className="text-lg font-medium text-gray-950">{window.title}</h2>
                        <p className="text-sm text-gray-500">{window.payload.summary}</p>
                        {sourceMessage ? <p className="mt-2 text-xs text-gray-400">Источник: “{sourceMessage}”</p> : null}
                        <div className="mt-4 inline-flex rounded-2xl border border-black/10 bg-white p-1">
                            {modeOptions.map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => onSetMode(option.id)}
                                    className={`rounded-xl px-3 py-1.5 text-xs transition-colors ${
                                        window.mode === option.id
                                            ? 'bg-black text-white'
                                            : 'text-neutral-600 hover:bg-black/[0.04] hover:text-black'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onTogglePin}
                            className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white shadow-sm transition-colors hover:bg-black/[0.03] hover:text-black ${
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
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white text-neutral-500 shadow-sm transition-colors hover:bg-black/[0.03] hover:text-black"
                            aria-label="Свернуть окно агента"
                        >
                            <ChevronsDown className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white text-neutral-500 shadow-sm transition-colors hover:bg-black/[0.03] hover:text-black"
                            aria-label="Закрыть окно агента"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-6 p-6">
                {(window.payload.sections ?? []).map((section) => (
                    <section key={section.id}>
                        <h3 className="text-xs uppercase tracking-[0.16em] text-neutral-400">{section.title}</h3>
                        <div className="mt-3 grid gap-3">
                            {section.items.map((item) => (
                                <div key={`${section.id}-${item.label}`} className="rounded-3xl border border-black/10 bg-white p-4">
                                    <div className="text-sm font-medium text-gray-950">{item.label}</div>
                                    <div className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{item.value}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}
                {window.actions.length > 0 ? (
                    <section>
                        <h3 className="text-xs uppercase tracking-[0.16em] text-neutral-400">Действия</h3>
                        <div className="mt-3 flex flex-wrap gap-3">
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
                    </section>
                ) : null}
            </div>
        </div>
    );
}
