'use client';

import React from 'react';
import { ChevronsDown, Pin, X } from 'lucide-react';

import { AiWorkWindow, AiWorkWindowAction } from './ai-work-window-types';

interface ComparisonWindowProps {
    window: AiWorkWindow;
    onAction: (action: AiWorkWindowAction) => void;
    onCollapse: () => void;
    onClose: () => void;
    onTogglePin?: () => void;
}

const emphasisClass: Record<'neutral' | 'best' | 'risk', string> = {
    neutral: 'text-gray-700',
    best: 'text-emerald-700 font-medium',
    risk: 'text-amber-700 font-medium',
};

export function ComparisonWindow({
    window,
    onAction,
    onCollapse,
    onClose,
    onTogglePin,
}: ComparisonWindowProps) {
    const columns = window.payload.columns ?? [];
    const rows = window.payload.rows ?? [];

    return (
        <div className="overflow-hidden rounded-[2rem] border border-black/10 bg-[rgba(255,255,255,0.99)] shadow-[0_24px_70px_rgba(17,17,17,0.14)] backdrop-blur-md">
            <div className="border-b border-black/10 bg-[#FCFBF8] px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">Сравнение</div>
                        <h2 className="text-lg font-medium text-gray-950">{window.title}</h2>
                        <p className="text-sm text-gray-500">{window.payload.summary}</p>
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

            <div className="space-y-5 p-6">
                <div className="overflow-x-auto rounded-3xl border border-black/10 bg-white">
                    <table className="min-w-full text-sm">
                        <thead className="border-b border-black/10 bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-gray-500">Показатель</th>
                                {columns.map((column) => (
                                    <th key={column} className="px-4 py-3 text-left font-medium text-gray-500">{column}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.id} className="border-b border-black/5 last:border-b-0">
                                    <td className="px-4 py-3 font-medium text-gray-900">{row.label}</td>
                                    {row.values.map((value, index) => (
                                        <td
                                            key={`${row.id}-${index}`}
                                            className={`px-4 py-3 whitespace-pre-wrap ${emphasisClass[row.emphasis ?? 'neutral']}`}
                                        >
                                            {value}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

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
