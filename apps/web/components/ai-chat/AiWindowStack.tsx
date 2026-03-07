'use client';

import React from 'react';
import { Bot, ChevronsUpDown, X } from 'lucide-react';

import { AiWorkWindow, getWindowStatusLabel } from './ai-work-window-types';

interface AiWindowStackProps {
    windows: AiWorkWindow[];
    onRestore: (windowId: string) => void;
    onClose: (windowId: string) => void;
}

export function AiWindowStack({ windows, onRestore, onClose }: AiWindowStackProps) {
    if (windows.length === 0) {
        return null;
    }

    const orderedWindows = [...windows].sort((left, right) => {
        if (left.isPinned !== right.isPinned) {
            return left.isPinned ? -1 : 1;
        }
        return right.priority - left.priority;
    });
    const windowTitles = new Map(windows.map((window) => [window.windowId, window.title]));

    return (
        <div className="pointer-events-auto fixed bottom-6 right-6 z-40 flex max-w-[320px] flex-col gap-3">
            {orderedWindows.map((window) => (
                <div
                    key={window.windowId}
                    className="group rounded-3xl border border-black/10 bg-[rgba(255,255,255,0.96)] px-4 py-3 text-left shadow-[0_14px_35px_rgba(17,17,17,0.14)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white"
                >
                    <div className="flex items-start justify-between gap-3">
                        <button
                            type="button"
                            onClick={() => onRestore(window.windowId)}
                            className="min-w-0 flex-1 text-left"
                            aria-label={`Открыть окно ${window.title}`}
                        >
                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                                <Bot className="h-3.5 w-3.5" />
                                Окно агента
                            </div>
                            <p className="mt-1 truncate text-sm font-medium text-gray-950">{window.title}</p>
                            <p className="mt-1 text-xs text-gray-500">{getWindowStatusLabel(window.status)}</p>
                            {window.isPinned ? (
                                <p className="mt-1 text-[11px] text-gray-400">Закреплено</p>
                            ) : null}
                            {window.parentWindowId ? (
                                <p className="mt-1 text-[11px] text-gray-400">
                                    Подсказка к: <span className="text-gray-500">{windowTitles.get(window.parentWindowId) ?? 'связанному окну'}</span>
                                </p>
                            ) : null}
                        </button>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-white text-neutral-500 transition-colors group-hover:text-black">
                                <ChevronsUpDown className="h-4 w-4" />
                            </span>
                            <button
                                type="button"
                                onClick={() => onClose(window.windowId)}
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-white text-neutral-500 transition-colors hover:bg-black/[0.03] hover:text-black"
                                aria-label={`Закрыть окно ${window.title}`}
                                title="Закрыть окно"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
