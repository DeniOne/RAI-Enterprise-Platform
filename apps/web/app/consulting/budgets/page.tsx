'use client';

import React, { useState, useMemo } from 'react';
import { SystemStatusBar } from '@/components/consulting/SystemStatusBar';
import { getEntityTransitions } from '@/lib/consulting/ui-policy';
import { DomainUiContext } from '@/lib/consulting/navigation-policy';
import clsx from 'clsx';
import { useAuthority } from '@/core/governance/AuthorityContext';

const MOCK_BUDGETS = [
    { id: 'BU-2026-001', name: 'Бюджет: Пшеница Озимая', status: 'LOCKED' as const, total: 12000000, spent: 4500000 },
    { id: 'BU-2026-002', name: 'Бюджет: Кукуруза', status: 'DRAFT' as const, total: 8500000, spent: 0 },
];

export default function BudgetsPage() {
    const [budgets] = useState(MOCK_BUDGETS);
    const authority = useAuthority();

    const domainContext = useMemo<DomainUiContext>(() => ({
        plansCount: 2,
        activeTechMap: true,
        lockedBudget: budgets.some(b => b.status === 'LOCKED'),
        criticalDeviations: 1,
        advisoryRiskLevel: 'low'
    }), [budgets]);

    return (
        <div className="p-8 max-w-7xl mx-auto font-geist">
            {/* Header Area */}
            <div className="mb-8">
                <h1 className="text-2xl font-medium text-gray-900 tracking-tight mb-2">
                    Финансовый контроль (Бюджеты)
                </h1>
                <p className="text-sm text-gray-500 font-normal">
                    Управление лимитами и мониторинг исполнения бюджета урожая
                </p>
            </div>

            {/* INTEGRITY LAYER: System Status Bar */}
            <SystemStatusBar context={domainContext} />

            {/* MAIN ACTION: Budgets List */}
            <div className="bg-white border border-black/5 rounded-3xl p-8 shadow-sm">
                <div className="flex justify-between items-center mb-10">
                    <h2 className="text-lg font-medium text-gray-900">Бюджетные планы</h2>
                    <button className="px-6 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-black/10">
                        Новый бюджетный лимит
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {budgets.map(budget => {
                        const perm = getEntityTransitions('budget', budget.status, authority, domainContext);
                        const usagePercent = budget.total > 0 ? (budget.spent / budget.total) * 100 : 0;
                        const isOverrun = usagePercent > 100;
                        const isWarning = usagePercent > 90;

                        return (
                            <div key={budget.id} className="p-8 bg-white border border-black/5 rounded-2xl group hover:border-black/10 transition-all duration-300">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <div className="flex items-center space-x-3 mb-1">
                                            <h3 className="font-medium text-gray-900 text-lg">{budget.name}</h3>
                                            <span className={clsx(
                                                "px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-tight",
                                                budget.status === 'LOCKED' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-gray-100 text-gray-500'
                                            )}>
                                                {budget.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 font-normal">ID: {budget.id}</p>
                                    </div>

                                    <div className="flex space-x-2">
                                        {perm.allowedTransitions.map(t => (
                                            <button key={t.target} className="px-5 py-2 bg-black text-white rounded-xl text-xs font-medium hover:bg-gray-800 transition-all">
                                                {t.label}
                                            </button>
                                        ))}
                                        <button className="px-5 py-2 bg-white text-gray-900 rounded-xl text-xs font-medium border border-black/10 hover:bg-gray-50 transition-colors">
                                            Корректировка
                                        </button>
                                    </div>
                                </div>

                                {/* Budget Execution Indicator (Scale) */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end text-xs">
                                        <span className="text-gray-400">Исполнение бюджета:</span>
                                        <div className="text-right">
                                            <span className={clsx(
                                                "font-medium mr-2",
                                                isOverrun ? "text-red-600" : (isWarning ? "text-amber-600" : "text-green-600")
                                            )}>
                                                {usagePercent.toFixed(1)}%
                                            </span>
                                            <span className="text-gray-400">
                                                {budget.spent.toLocaleString()} / {budget.total.toLocaleString()} ₽
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={clsx(
                                                "h-full transition-all duration-1000 ease-out rounded-full",
                                                isOverrun ? "bg-red-500" : (isWarning ? "bg-amber-500" : "bg-green-500")
                                            )}
                                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                        />
                                    </div>
                                    {isOverrun && (
                                        <p className="text-[10px] text-red-500 font-medium">
                                            ВНИМАНИЕ: Превышение лимита бюджета на {(usagePercent - 100).toFixed(1)}%
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Advisory Signal */}
            <div className="mt-8 p-6 bg-amber-50/30 rounded-2xl border border-amber-100/50 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-amber-900">Блокировка лимитов</h4>
                        <p className="text-xs text-amber-700/70 mt-0.5">
                            Статус <strong>LOCKED</strong> запрещает любые изменения в техкарте без финансовой корректировки.
                        </p>
                    </div>
                </div>
                <button className="px-4 py-2 text-xs font-medium text-amber-700 hover:text-amber-900 transition-colors">
                    Подробнее в Advisory →
                </button>
            </div>
        </div>
    );
}
