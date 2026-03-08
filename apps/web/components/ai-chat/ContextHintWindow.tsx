'use client';

import React from 'react';
import { Lightbulb, ChevronsDown, RefreshCw, X, Route, MapPinned, Pin } from 'lucide-react';

import { AiWorkWindow, AiWorkWindowAction } from './ai-work-window-types';

interface ContextHintWindowProps {
    window: AiWorkWindow;
    primaryWindowTitle?: string | null;
    sourceMessage?: string | null;
    onCollapse: () => void;
    onClose: () => void;
    onTogglePin?: () => void;
    onAction: (action: AiWorkWindowAction) => void;
}

export function ContextHintWindow({
    window,
    primaryWindowTitle,
    sourceMessage,
    onCollapse,
    onClose,
    onTogglePin,
    onAction,
}: ContextHintWindowProps) {
    const iconByActionKind: Record<AiWorkWindowAction['kind'], React.ReactNode> = {
        use_workspace_field: <MapPinned className="h-4 w-4" />,
        open_field_card: <MapPinned className="h-4 w-4" />,
        open_season_picker: <RefreshCw className="h-4 w-4" />,
        refresh_context: <RefreshCw className="h-4 w-4" />,
        focus_window: <Lightbulb className="h-4 w-4" />,
        go_to_techmap: <Route className="h-4 w-4" />,
        open_route: <Route className="h-4 w-4" />,
        open_entity: <MapPinned className="h-4 w-4" />,
    };

    return (
        <div className="overflow-hidden rounded-[1.5rem] border border-amber-200 bg-[rgba(255,251,235,0.98)] shadow-[0_20px_60px_rgba(17,17,17,0.12)] backdrop-blur-md">
            <div className="border-b border-amber-200/70 bg-amber-50 px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-amber-700/70">
                            <Lightbulb className="h-3.5 w-3.5" />
                            Подсказка агента
                        </div>
                        <h2 className="mt-1 text-base font-medium text-gray-950">{window.title}</h2>
                        <p className="mt-1 text-sm text-gray-600">{window.payload.summary}</p>
                        {sourceMessage ? (
                            <p className="mt-2 text-xs text-amber-800/70">
                                Источник: “{sourceMessage}”
                            </p>
                        ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onTogglePin}
                            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-white shadow-sm transition-colors hover:bg-black/[0.03] hover:text-black ${
                                window.isPinned ? 'text-black' : 'text-neutral-500'
                            }`}
                            aria-label={window.isPinned ? 'Открепить окно агента' : 'Закрепить окно агента'}
                            title={window.isPinned ? 'Открепить окно' : 'Закрепить окно'}
                            disabled={!onTogglePin}
                        >
                            <Pin className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={onCollapse}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-white text-neutral-500 shadow-sm transition-colors hover:bg-black/[0.03] hover:text-black"
                            aria-label="Свернуть окно агента"
                            title="Свернуть окно"
                        >
                            <ChevronsDown className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-white text-neutral-500 shadow-sm transition-colors hover:bg-black/[0.03] hover:text-black"
                            aria-label="Закрыть окно агента"
                            title="Закрыть окно"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-4 p-5">
                {primaryWindowTitle ? (
                    <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-gray-700">
                        Основное окно: <span className="font-medium text-gray-950">{primaryWindowTitle}</span>
                    </div>
                ) : null}
                <div className="flex flex-wrap gap-2 text-xs text-gray-700">
                    {window.payload.fieldRef !== undefined ? (
                        <span className="rounded-full border border-black/10 bg-white px-3 py-1">
                            Поле: <span className="font-mono">{window.payload.fieldRef ?? '—'}</span>
                        </span>
                    ) : null}
                    {window.payload.seasonRef !== undefined ? (
                        <span className="rounded-full border border-black/10 bg-white px-3 py-1">
                            Сезон: <span className="font-mono">{window.payload.seasonRef ?? '—'}</span>
                        </span>
                    ) : null}
                    {window.payload.seasonId !== undefined ? (
                        <span className="rounded-full border border-black/10 bg-white px-3 py-1">
                            Сезон: <span className="font-mono">{window.payload.seasonId ?? '—'}</span>
                        </span>
                    ) : null}
                    {window.payload.planId !== undefined ? (
                        <span className="rounded-full border border-black/10 bg-white px-3 py-1">
                            План: <span className="font-mono">{window.payload.planId ?? '—'}</span>
                        </span>
                    ) : null}
                </div>
                <div className="flex flex-wrap gap-3">
                    {window.actions.map((action) => (
                        <button
                            key={action.id}
                            type="button"
                            onClick={() => onAction(action)}
                            disabled={!action.enabled}
                            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm transition-colors disabled:opacity-50 ${
                                action.kind === 'focus_window'
                                    ? 'border-black bg-black text-white hover:bg-black/90'
                                    : 'border-black/10 bg-white text-gray-900 hover:bg-black/[0.03]'
                            }`}
                        >
                            {iconByActionKind[action.kind]}
                            {action.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
