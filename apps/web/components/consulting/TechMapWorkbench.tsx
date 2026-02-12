'use client';

import React, { useEffect } from 'react';
import { TechMapStatus, getEntityTransitions } from '@/lib/consulting/ui-policy';
import { UserRole } from '@/lib/config/role-config';
import { DomainUiContext } from '@/lib/consulting/navigation-policy';
import clsx from 'clsx';

interface Operation {
    id: string;
    title: string;
    status: 'PENDING' | 'DONE' | 'DELAYED';
}

interface TechMapWorkbenchProps {
    techMap: {
        id: string;
        status: TechMapStatus;
        operations: Operation[];
    };
    userRole: UserRole;
    context: DomainUiContext;
}

export function TechMapWorkbench({ techMap, userRole, context }: TechMapWorkbenchProps) {
    const perm = getEntityTransitions('tech-map', techMap.status, userRole, context);
    const isFrozen = techMap.status === 'FROZEN';

    // Absolute Lock: Intercept keyboard and prevent anything
    useEffect(() => {
        if (!isFrozen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Block almost everything except navigation/scrolling
            if (e.key === 'Enter' || (e.ctrlKey && e.key === 's')) {
                e.preventDefault();
                console.warn('Action blocked: TechMap is FROZEN');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFrozen]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
                <div>
                    <h2 className="text-lg font-medium text-gray-900 tracking-tight">Workbench: {techMap.id}</h2>
                    <div className="flex items-center space-x-2 mt-1">
                        <span className={clsx(
                            "w-2 h-2 rounded-full",
                            isFrozen ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
                        )} />
                        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                            Status: {techMap.status} {isFrozen && '// READ-ONLY SNAPSHOT'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    {/* FSM Controls integrated into Workbench */}
                    {perm.allowedTransitions.map(t => (
                        <button
                            key={t.target}
                            className="px-5 py-2 bg-black text-white rounded-xl text-xs font-medium hover:bg-gray-800 transition-all active:scale-95"
                        >
                            {t.label}
                        </button>
                    ))}

                    {isFrozen && (
                        <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-medium uppercase border border-blue-100">
                            Immutable Snapshot
                        </div>
                    )}
                </div>
            </div>

            <div className={clsx(
                "grid grid-cols-1 gap-4 transition-all duration-500",
                isFrozen ? 'pointer-events-none grayscale-[0.5] opacity-80' : ''
            )}>
                <div className="bg-gray-50/50 p-4 rounded-2xl border border-dashed border-black/10 text-center text-xs text-gray-400 font-normal">
                    {isFrozen ? 'Режим просмотра. Все элементы управления заблокированы.' : 'Режим проектирования активен.'}
                </div>

                {techMap.operations.map(op => (
                    <div key={op.id} className="p-5 bg-white border border-black/5 rounded-2xl flex items-center justify-between group hover:border-black/10 transition-colors">
                        <div className="flex items-center space-x-4">
                            <input
                                type="checkbox"
                                checked={op.status === 'DONE'}
                                readOnly={isFrozen}
                                className="w-4 h-4 rounded-full border-black/10 accent-black transition-all"
                            />
                            <span className="text-sm font-medium text-gray-700">{op.title}</span>
                        </div>
                        <span className="text-[10px] font-medium text-gray-300 uppercase tracking-tighter">Phase 1</span>
                    </div>
                ))}
            </div>

            {/* Locked Reason Explanation if Frozen */}
            {isFrozen && (
                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex items-start space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m11 3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-blue-900">Техкарта заблокирована</h4>
                        <p className="text-xs text-blue-700/70 mt-0.5 leading-relaxed">
                            Эта версия техкарты является утвержденным слепком для Плана Урожая. Изменения невозможны до создания новой версии.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
