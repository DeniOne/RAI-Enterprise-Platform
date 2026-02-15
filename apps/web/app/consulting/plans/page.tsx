'use client';

import React, { useState, useMemo, useEffect } from 'react';
import SystemStatusBar from '@/components/consulting/SystemStatusBar';
import { PlansList } from '@/components/consulting/PlansList';
import { DomainUiContext } from '@/lib/consulting/navigation-policy';
import { UserRole } from '@/lib/config/role-config';
import { api } from '@/lib/api';

export default function PlansPage() {
    const [plans, setPlans] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userRole] = useState<UserRole>('ADMIN'); // In real app, from Auth Context

    const fetchPlans = async () => {
        setIsLoading(true);
        try {
            const response = await api.consulting.plans();
            setPlans(response.data);
        } catch (error) {
            console.error('Failed to fetch plans:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPlans();
    }, []);

    const domainContext = useMemo<DomainUiContext>(() => {
        const hasActiveTechMap = plans.some(p => p.activeTechMapId);
        const hasLockedBudget = plans.some(p => p.status === 'ACTIVE');
        const criticalDeviations = plans.reduce((acc, p) => acc + (p.deviationReviews?.length || 0), 0);

        return {
            plansCount: plans.length,
            activeTechMap: hasActiveTechMap,
            lockedBudget: hasLockedBudget,
            criticalDeviations: criticalDeviations,
            advisoryRiskLevel: criticalDeviations > 0 ? 'medium' : 'low'
        };
    }, [plans]);

    const handleTransition = async (id: string, target: string) => {
        try {
            // Need to update API transition method if it exists or use generic
            await api.apiClient.post(`/consulting/plans/${id}/status`, { status: target });
            await fetchPlans();
        } catch (error) {
            console.error(`Failed to transition plan ${id}:`, error);
            alert('Ошибка при смене статуса');
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto font-geist">
            {/* Header Area */}
            <div className="mb-8">
                <h1 className="text-3xl font-semibold text-gray-900 tracking-tight mb-2">
                    Планы Урожая
                </h1>
                <p className="text-sm text-gray-500 font-normal">
                    Операционная панель управления жизненным циклом сельскохозяйственных планов
                </p>
            </div>

            {/* INTEGRITY LAYER: System Status Bar (Operational Gate visualization) */}
            <SystemStatusBar context={domainContext} />

            {/* MAIN ACTION: Cockpit Control */}
            <div className="bg-white border border-black/5 rounded-[32px] p-10 shadow-sm mt-8">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h2 className="text-xl font-medium text-gray-900">Реестр планов</h2>
                        <p className="text-xs text-gray-400 mt-1">Визуализация FSM и доступных переходов</p>
                    </div>
                    <button className="px-6 py-3 bg-black text-white rounded-2xl text-sm font-medium hover:bg-zinc-800 transition-all active:scale-95 shadow-xl shadow-black/10">
                        Создать новый план
                    </button>
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-gray-50 animate-pulse rounded-2xl" />
                        ))}
                    </div>
                ) : (
                    <PlansList
                        plans={plans}
                        userRole={userRole}
                        context={domainContext}
                        onTransition={handleTransition}
                    />
                )}
            </div>

            {/* FOOTER INFO (Domain Rules Explanation) */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-stone-50/50 rounded-2xl border border-black/5">
                    <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3 font-semibold">Активные ограничения</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-normal">
                        Активация плана (ACTIVE) возможна только при заблокированном бюджете (LOCKED) и утвержденной техкарте.
                    </p>
                </div>
                <div className="p-6 bg-stone-50/50 rounded-2xl border border-black/5">
                    <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3 font-semibold">Ролевая модель</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-normal">
                        Ваша роль — <strong>{userRole}</strong>. Утверждение планов в фазу Исполнения доступно только CEO/FOUNDER.
                    </p>
                </div>
                <div className="p-6 bg-stone-50/50 rounded-2xl border border-black/5">
                    <h4 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3 font-semibold">Связи домена</h4>
                    <p className="text-xs text-gray-500 leading-relaxed font-normal">
                        Любое активное отклонение должно быть разрешено (Decision) до закрытия сезона.
                    </p>
                </div>
            </div>
        </div>
    );
}
