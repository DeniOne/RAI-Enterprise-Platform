'use client';

import React, { useState, useMemo } from 'react';
import { SystemStatusBar } from '@/components/consulting/SystemStatusBar';
import { DomainUiContext } from '@/lib/consulting/navigation-policy';
import { UserRole } from '@/lib/config/role-config';
import clsx from 'clsx';

const MOCK_ADVISORY = {
    plans: [
        { id: 'HP-001', name: 'Пшеница Озимая', riskScore: 82, majorIssues: ['Задержка ГСМ', 'Погодный риск: Высокий'] },
        { id: 'HP-002', name: 'Кукуруза (Центр)', riskScore: 15, majorIssues: [] },
    ],
    companyRisk: 48,
    riskyPlansCount: 1
};

export default function AdvisoryPage() {
    const [advisory] = useState(MOCK_ADVISORY);
    const [userRole] = useState<UserRole>('ADMIN');

    const domainContext = useMemo<DomainUiContext>(() => ({
        plansCount: 2,
        activeTechMap: true,
        lockedBudget: true,
        criticalDeviations: 1,
        advisoryRiskLevel: advisory.companyRisk > 70 ? 'high' : (advisory.companyRisk > 30 ? 'medium' : 'low')
    }), [advisory]);

    return (
        <div className="p-8 max-w-7xl mx-auto font-geist">
            {/* Header Area */}
            <div className="mb-8">
                <h1 className="text-2xl font-medium text-gray-900 tracking-tight mb-2">
                    Advisory Engine
                </h1>
                <p className="text-sm text-gray-500 font-normal">
                    Интегральная оценка рисков и экспертные рекомендации по управлению урожаем
                </p>
            </div>

            {/* INTEGRITY LAYER: System Status Bar */}
            <SystemStatusBar context={domainContext} />

            {/* Main Content: 2-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left: Company Level Advisory */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white border border-black/5 rounded-3xl p-8 shadow-sm">
                        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-6">Company Risk Score</h2>
                        <div className="flex flex-col items-center justify-center py-6">
                            <div className="relative w-40 h-40 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r="70"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        strokeDasharray={440}
                                        strokeDashoffset={440 - (440 * advisory.companyRisk) / 100}
                                        className={clsx(
                                            "transition-all duration-1000",
                                            advisory.companyRisk > 70 ? "text-red-500" : (advisory.companyRisk > 30 ? "text-amber-500" : "text-green-500")
                                        )}
                                    />
                                </svg>
                                <span className="absolute text-4xl font-medium text-gray-900">{advisory.companyRisk}</span>
                            </div>
                            <p className="mt-6 text-xs text-gray-500 text-center font-normal px-4">
                                Средневзвешенный риск по всем контрагентам и планам хозяйства.
                            </p>
                        </div>
                    </div>

                    <div className="bg-black text-white rounded-3xl p-8 shadow-xl">
                        <h3 className="text-xs font-medium uppercase tracking-[0.2em] opacity-40 mb-4">Urgent Signal</h3>
                        <p className="text-lg font-medium leading-snug">
                            {advisory.riskyPlansCount} план требует немедленного вмешательства в технологическую карту.
                        </p>
                        <button className="mt-8 w-full py-3 bg-white text-black rounded-xl text-sm font-medium hover:bg-gray-100 transition-all active:scale-95">
                            Смотреть детализацию
                        </button>
                    </div>
                </div>

                {/* Right: Plan Specific Risks */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border border-black/5 rounded-3xl p-8 shadow-sm">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-lg font-medium text-gray-900">Риски Планов</h2>
                            <button className="text-xs text-blue-600 font-medium hover:underline underline-offset-4">История изменений</button>
                        </div>

                        <div className="space-y-4">
                            {advisory.plans.map(plan => (
                                <div key={plan.id} className="p-6 bg-gray-50/50 border border-black/5 rounded-2xl flex items-center justify-between group hover:border-black/10 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <h4 className="text-sm font-medium text-gray-900">{plan.name}</h4>
                                            <span className="text-[10px] text-gray-400">ID: {plan.id}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {plan.majorIssues.length > 0 ? (
                                                plan.majorIssues.map((issue, idx) => (
                                                    <span key={idx} className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[10px] font-medium border border-red-100">
                                                        {issue}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-[10px] font-medium border border-green-100">
                                                    Критических проблем не выявлено
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-6">
                                        <div className="text-right">
                                            <div className={clsx(
                                                "text-lg font-medium",
                                                plan.riskScore > 70 ? "text-red-600" : (plan.riskScore > 30 ? "text-amber-600" : "text-green-600")
                                            )}>
                                                {plan.riskScore}
                                            </div>
                                            <div className="text-[10px] text-gray-400 uppercase tracking-tighter">Risk Score</div>
                                        </div>
                                        <button className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-black/5 transition-all">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-8 bg-stone-50 border border-black/5 rounded-3xl">
                        <h4 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">Методология расчёта</h4>
                        <p className="text-xs text-gray-500 leading-relaxed font-normal">
                            Risk Score агрегирует 4 замера: агротехнологическую дисциплину, финансовое соответствие бюджету, внешние угрозы (погода, вредители) и юридическую чистоту (compliance). Индекс более 70 считается "критическим" и требует сценарного моделирования в блоке Стратегии.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
