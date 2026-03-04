'use client';

import React from 'react';
import clsx from 'clsx';
import type { Operation } from './TechMapWorkbench';

interface OperationDagViewProps {
    operations: Operation[];
    isFrozen: boolean;
}

export function OperationDagView({ operations, isFrozen }: OperationDagViewProps) {
    if (!operations || operations.length === 0) {
        return (
            <div className="p-4 bg-white rounded-2xl border border-dashed border-black/10 text-xs text-gray-400 text-center">
                Нет операций для визуализации графа.
            </div>
        );
    }

    const sorted = [...operations].sort((a, b) => {
        const aKey = a.bbchWindowStart ?? 0;
        const bKey = b.bbchWindowStart ?? 0;
        if (aKey === bKey) {
            return a.title.localeCompare(b.title);
        }
        return aKey - bKey;
    });

    return (
        <div className={clsx(
            "p-4 bg-white rounded-2xl border border-black/5",
            isFrozen && "opacity-80"
        )}>
            <div className="flex justify-between items-center mb-3">
                <span className="text-xs text-gray-500">DAG операций</span>
                <span className="text-[10px] text-gray-400">Критический путь подсвечен рамкой</span>
            </div>

            <div className="space-y-3">
                {sorted.map((op) => (
                    <div
                        key={op.id}
                        className={clsx(
                            "p-3 rounded-2xl border bg-white flex flex-col gap-1",
                            op.isCritical && "border-red-500 shadow-sm"
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-800">{op.title}</span>
                                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                    {op.operationType && <span>{op.operationType}</span>}
                                    {(op.bbchWindowStart !== undefined || op.bbchWindowEnd !== undefined) && (
                                        <span>
                                            BBCH: {op.bbchWindowStart ?? '—'}–{op.bbchWindowEnd ?? '—'}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <span className={clsx(
                                "text-[10px] px-2 py-0.5 rounded-full border",
                                op.status === 'DONE' && "border-emerald-500 text-emerald-600",
                                op.status === 'PENDING' && "border-amber-400 text-amber-500",
                                op.status === 'DELAYED' && "border-red-500 text-red-600"
                            )}>
                                {op.status}
                            </span>
                        </div>

                        {op.dependencies && op.dependencies.length > 0 && (
                            <div className="mt-2 space-y-1">
                                {op.dependencies.map((dep, idx) => (
                                    <div key={`${op.id}-${dep.operationId}-${idx}`} className="flex items-center text-[11px] text-gray-500">
                                        <svg
                                            className="w-3 h-3 text-gray-400 mr-1"
                                            viewBox="0 0 20 20"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M4 10h10M10 4l4 6-4 6"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        <span>
                                            → {dep.operationId} ({dep.dependencyType}
                                            {typeof dep.lagDays === 'number' && dep.lagDays !== 0
                                                ? `, ${dep.lagDays > 0 ? '+' : ''}${dep.lagDays} дн.`
                                                : ''}
                                            )
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

