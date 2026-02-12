'use client';

import React, { useState, useMemo } from 'react';
import { SystemStatusBar } from '@/components/consulting/SystemStatusBar';
import { DomainUiContext } from '@/lib/consulting/navigation-policy';
import { UserRole } from '@/lib/config/role-config';
import clsx from 'clsx';

const MOCK_DECISIONS = [
    { id: 'DEC-101', deviationId: 'DEV-001', title: 'Увеличение нормы ГСМ', author: 'ADMIN', date: '2026-05-12', outcome: 'APPROVED', impact: 'Economy: -1.2%' },
    { id: 'DEC-102', deviationId: 'DEV-004', title: 'Продажа остатков СЗР', author: 'MANAGER', date: '2026-05-10', outcome: 'REJECTED', impact: 'None' },
];

export default function DecisionsPage() {
    const [decisions] = useState(MOCK_DECISIONS);
    const [userRole] = useState<UserRole>('ADMIN');

    const domainContext = useMemo<DomainUiContext>(() => ({
        plansCount: 2,
        activeTechMap: true,
        lockedBudget: true,
        criticalDeviations: 0,
        advisoryRiskLevel: 'low'
    }), [decisions]);

    return (
        <div className="p-8 max-w-7xl mx-auto font-geist">
            {/* Header Area */}
            <div className="mb-8">
                <h1 className="text-2xl font-medium text-gray-900 tracking-tight mb-2">
                    Журнал Решений
                </h1>
                <p className="text-sm text-gray-500 font-normal">
                    Архив управленческих решений и их влияние на экономику урожая
                </p>
            </div>

            {/* INTEGRITY LAYER: System Status Bar */}
            <SystemStatusBar context={domainContext} />

            {/* Main Content: Decision Log Table */}
            <div className="bg-white border border-black/5 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-8 border-b border-black/5 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">Операционный лог</h2>
                    <div className="flex space-x-2">
                        <button className="px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-medium border border-black/5 hover:bg-white transition-all">Экспорт (PDF)</button>
                    </div>
                </div>

                <div className="p-2">
                    <table className="w-full text-left border-separate border-spacing-y-2">
                        <thead>
                            <tr className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                                <th className="px-6 py-3">ID / Дата</th>
                                <th className="px-6 py-3">Суть решения</th>
                                <th className="px-6 py-3">Связанное отклонение</th>
                                <th className="px-6 py-3">Результат</th>
                                <th className="px-6 py-3">Эффект</th>
                            </tr>
                        </thead>
                        <tbody>
                            {decisions.map(dec => (
                                <tr key={dec.id} className="group hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium text-gray-900">{dec.id}</span>
                                            <span className="text-[10px] text-gray-400">{dec.date}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-700 font-normal">{dec.title}</span>
                                        <div className="text-[10px] text-gray-400 uppercase mt-1">Автор: {dec.author}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-blue-600 font-medium underline underline-offset-2 cursor-pointer">{dec.deviationId}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={clsx(
                                            "px-3 py-1 rounded-full text-[10px] font-medium w-fit border",
                                            dec.outcome === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                                        )}>
                                            {dec.outcome}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-medium text-gray-900">{dec.impact}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Integrity Note */}
            <div className="mt-8 p-6 bg-blue-50/30 rounded-2xl border border-blue-100/50">
                <p className="text-xs text-blue-700/70 leading-relaxed italic">
                    Каждое решение в этом журнале является юридически значимым действием, которое изменяет параметры BudgetPlan или TechMap. Система автоматически пересчитывает Risk Score в Advisory после фиксации решения.
                </p>
            </div>
        </div>
    );
}
