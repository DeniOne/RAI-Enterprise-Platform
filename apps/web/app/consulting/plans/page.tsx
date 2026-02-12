'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { SystemStatusBar } from '@/components/consulting/SystemStatusBar';
import { PlansList } from '@/components/consulting/PlansList';
import { DomainUiContext } from '@/lib/consulting/navigation-policy';
import { UserRole } from '@/lib/config/role-config';

// Mock data to demonstrate the Domain Visualization concept
const MOCK_PLANS = [
    { id: 'HP-2026-001', targetMetric: 'Пшеница Озимая (Юг)', status: 'ACTIVE' as const },
    { id: 'HP-2026-002', targetMetric: 'Кукуруза (Центр)', status: 'APPROVED' as const },
    { id: 'HP-2026-003', targetMetric: 'Подсолнечник (Степь)', status: 'DRAFT' as const },
];

export default function PlansPage() {
    const [plans, setPlans] = useState(MOCK_PLANS);
    const [userRole] = useState<UserRole>('ADMIN'); // In real app, from Auth Context

    // RULE: Context is re-assembled on ogni fetch/data change to avoid "phantom locks"
    const domainContext = useMemo<DomainUiContext>(() => {
        const hasActiveTechMap = true; // Logic: find if any plan has associated active techmap
        const hasLockedBudget = plans.some(p => p.status === 'ACTIVE'); // Simplified for demo
        const criticalDeviations = 2; // Logic: count from Deviations service

        return {
            plansCount: plans.length,
            activeTechMap: hasActiveTechMap,
            lockedBudget: hasLockedBudget,
            criticalDeviations: criticalDeviations,
            advisoryRiskLevel: criticalDeviations > 0 ? 'medium' : 'low'
        };
    }, [plans]);

    const handleTransition = (id: string, target: string) => {
        console.log(`Transitioning plan ${id} to ${target}`);
        setPlans(prev => prev.map(p => p.id === id ? { ...p, status: target as any } : p));
    };

    return (
        <div className="p-8 max-w-7xl mx-auto font-geist">
            {/* Header Area */}
            <div className="mb-8">
                <h1 className="text-2xl font-medium text-gray-900 tracking-tight mb-2">
                    Планы Урожая
                </h1>
                <p className="text-sm text-gray-500 font-normal">
                    Операционная панель управления жизненным циклом сельскохозяйственных планов
                </p>
            </div>

            {/* INTEGRITY LAYER: System Status Bar (Operational Gate visualization) */}
            <SystemStatusBar context={domainContext} />

            {/* MAIN ACTION: Cockpit Control */}
            <div className="bg-white border border-black/5 rounded-3xl p-8 shadow-sm">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h2 className="text-lg font-medium text-gray-900">Реестр планов</h2>
                        <p className="text-xs text-gray-400 mt-1">Визуализация FSM и доступных переходов</p>
                    </div>
                    <button className="px-6 py-2.5 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-black/10">
                        Создать новый план
                    </button>
                </div>

                <PlansList
                    plans={plans}
                    userRole={userRole}
                    context={domainContext}
                    onTransition={handleTransition}
                />
            </div>

            {/* FOOTER INFO (Domain Rules Explanation) */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 bg-stone-50/50 rounded-2xl border border-black/5">
                    <h4 className="text-[10px] uppercase tracking-widest text-gray-400 mb-2 font-medium">Активные ограничения</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-normal">
                        Активация плана (ACTIVE) возможна только при заблокированном бюджете (LOCKED) и утвержденной техкарте.
                    </p>
                </div>
                <div className="p-5 bg-stone-50/50 rounded-2xl border border-black/5">
                    <h4 className="text-[10px] uppercase tracking-widest text-gray-400 mb-2 font-medium">Ролевая модель</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-normal">
                        Ваша роль — <strong>{userRole}</strong>. Утверждение планов в фазу Исполнения доступно только CEO/FOUNDER.
                    </p>
                </div>
                <div className="p-5 bg-stone-50/50 rounded-2xl border border-black/5">
                    <h4 className="text-[10px] uppercase tracking-widest text-gray-400 mb-2 font-medium">Связи домена</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-normal">
                        Любое активное отклонение должно быть разрешено (Decision) до закрытия сезона.
                    </p>
                </div>
            </div>
        </div>
    );
}
