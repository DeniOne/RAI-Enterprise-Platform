'use client';

import React from 'react';
import { RefreshCw, MapPinned, CalendarDays, CheckCircle2, CircleDashed, ChevronsDown, X, Route, Pin } from 'lucide-react';
import { AiWorkWindow, PendingClarificationState, AiWorkWindowAction } from './ai-work-window-types';

interface ContextAcquisitionWindowProps {
    window: AiWorkWindow;
    pendingClarification: PendingClarificationState | null;
    sourceMessage?: string | null;
    onAction: (action: AiWorkWindowAction) => void;
    onCollapse: () => void;
    onClose: () => void;
    onTogglePin?: () => void;
    onSetMode: (mode: AiWorkWindow['mode']) => void;
}

export function ContextAcquisitionWindow({
    window,
    pendingClarification,
    sourceMessage,
    onAction,
    onCollapse,
    onClose,
    onTogglePin,
    onSetMode,
}: ContextAcquisitionWindowProps) {
    const items = pendingClarification?.items ?? [];
    const isCompleted = window.status === 'completed';
    const shellClassName = {
        inline: 'rounded-[1.5rem]',
        panel: 'rounded-[1.75rem]',
        takeover: 'min-h-[calc(100vh-2rem)] rounded-[2rem]',
    }[window.mode];
    const bodyClassName = {
        inline: 'space-y-5 p-5',
        panel: 'space-y-6 p-6',
        takeover: 'space-y-8 p-8',
    }[window.mode];
    const modeOptions: Array<{ id: AiWorkWindow['mode']; label: string }> = [
        { id: 'inline', label: 'Кратко' },
        { id: 'panel', label: 'Панель' },
        { id: 'takeover', label: 'Фокус' },
    ];
    const valueByKey = pendingClarification?.collectedContext ?? window.payload;

    const iconByActionKind: Record<AiWorkWindowAction['kind'], React.ReactNode> = {
        use_workspace_field: <MapPinned className="h-4 w-4" />,
        open_field_card: <MapPinned className="h-4 w-4" />,
        open_season_picker: <CalendarDays className="h-4 w-4" />,
        refresh_context: <RefreshCw className="h-4 w-4" />,
        focus_window: <Route className="h-4 w-4" />,
        go_to_techmap: <Route className="h-4 w-4" />,
        open_route: <Route className="h-4 w-4" />,
        open_entity: <MapPinned className="h-4 w-4" />,
    };

    return (
        <div className={`${shellClassName} overflow-hidden border border-black/10 bg-[rgba(255,255,255,0.98)] shadow-[0_24px_70px_rgba(17,17,17,0.14)] backdrop-blur-md`}>
            <div className="border-b border-black/10 bg-[#FCFBF8] px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">Вывод системы</div>
                        <h2 className="text-lg font-medium text-gray-950">{window.title}</h2>
                        <p className="text-sm text-gray-500">{window.payload.summary}</p>
                        {sourceMessage ? (
                            <p className="mt-2 text-xs text-gray-400">
                                Источник: “{sourceMessage}”
                            </p>
                        ) : null}
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
                            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-white shadow-sm transition-colors hover:bg-black/[0.03] hover:text-black ${
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
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-white text-neutral-500 shadow-sm transition-colors hover:bg-black/[0.03] hover:text-black"
                            aria-label="Свернуть окно агента"
                            title="Свернуть окно"
                        >
                            <ChevronsDown className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-white text-neutral-500 shadow-sm transition-colors hover:bg-black/[0.03] hover:text-black"
                            aria-label="Закрыть окно агента"
                            title="Закрыть окно"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className={bodyClassName}>
                {isCompleted ? (
                    <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                        <div className="flex items-center gap-2 text-emerald-700">
                            <CheckCircle2 className="h-4 w-4" />
                            <p className="text-sm font-medium">Техкарта подготовлена</p>
                        </div>
                        {window.payload.fieldRef || window.payload.seasonRef ? (
                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-emerald-800">
                                {window.payload.fieldRef ? <span className="rounded-full bg-white px-3 py-1 border border-emerald-200">Поле: {window.payload.fieldRef}</span> : null}
                                {window.payload.seasonRef ? <span className="rounded-full bg-white px-3 py-1 border border-emerald-200">Сезон: {window.payload.seasonRef}</span> : null}
                            </div>
                        ) : null}
                        {window.payload.resultText ? (
                            <p className="mt-4 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">{window.payload.resultText}</p>
                        ) : null}
                    </div>
                ) : (
                    <>
                        <section>
                            <h3 className="text-xs uppercase tracking-[0.16em] text-neutral-400">Что нужно</h3>
                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                                {items.map((item) => {
                                    const resolved = item.status === 'resolved';
                                    return (
                                        <div
                                            key={item.key}
                                            className={`rounded-3xl border p-4 ${resolved ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {resolved ? <CheckCircle2 className="h-4 w-4 text-emerald-700" /> : <CircleDashed className="h-4 w-4 text-amber-700" />}
                                                <p className="text-sm font-medium text-gray-900">{item.label}</p>
                                            </div>
                                            <p className="mt-2 text-xs leading-relaxed text-gray-600">{item.reason}</p>
                                            {item.value ? (
                                                <div className="mt-3 text-xs text-gray-800">
                                                    Найдено: <span className="font-mono">{item.value}</span>
                                                </div>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xs uppercase tracking-[0.16em] text-neutral-400">Что уже найдено</h3>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {items.map((item) => (
                                    <span key={item.key} className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs">
                                        {item.label}: <span className="font-mono">{valueByKey[item.key] ?? '—'}</span>
                                    </span>
                                ))}
                                {!items.length && window.payload.planId ? (
                                    <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs">
                                        План: <span className="font-mono">{window.payload.planId}</span>
                                    </span>
                                ) : null}
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xs uppercase tracking-[0.16em] text-neutral-400">Действия</h3>
                            <div className="mt-3 flex flex-wrap gap-3">
                                {window.actions.map((action) => (
                                    <button
                                        key={action.id}
                                        type="button"
                                        onClick={() => onAction(action)}
                                        disabled={!action.enabled}
                                        className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-2 text-sm text-gray-900 transition-colors hover:bg-black/[0.03] disabled:text-gray-500 disabled:opacity-50"
                                    >
                                        {iconByActionKind[action.kind]}
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}
